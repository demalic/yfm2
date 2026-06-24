from __future__ import annotations

import shutil
import subprocess
import sys
import threading
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Callable

from config import BOT_DIR, COUNT_FILES, JOBS_DIR, QUALIFIER_SCRIPT, TOWER_PYTHON, ZIPCHECK_SCRIPT
from log_parser import QualifierParseState, ZipCheckParseState, parse_qualifier_line, parse_zipcheck_line
from models import EligibilityCounts, EligibilityJob, QualifierPhase, ZipCheckPhase

MAX_LOG_LINES = 10_000


def _utc_now() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def _empty_job(
    job_id: str,
    isp: str,
    scope: str,
    zip_code: str | None,
    state: str | None,
) -> EligibilityJob:
    return EligibilityJob(
        jobId=job_id,
        isp=isp,
        scope=scope,  # type: ignore[arg-type]
        zip=zip_code,
        state=state,
        status="queued",
        phase="zipcheck",
        createdAt=_utc_now(),
        zipcheck=ZipCheckPhase(
            status="queued",
            progress=0,
            message="Waiting to start zip checker…",
        ),
        qualifier=QualifierPhase(
            status="idle",
            progress=0,
            message="Waiting for zip checker…",
            counts=EligibilityCounts(),
        ),
    )


class JobManager:
    def __init__(self) -> None:
        self._jobs: dict[str, EligibilityJob] = {}
        self._job_logs: dict[str, list[str]] = {}
        self._lock = threading.Lock()
        self._processes: dict[str, subprocess.Popen[str]] = {}
        JOBS_DIR.mkdir(parents=True, exist_ok=True)

    def get_job(self, job_id: str) -> EligibilityJob | None:
        with self._lock:
            job = self._jobs.get(job_id)
            return job.model_copy(deep=True) if job else None

    def start_job(
        self,
        isp: str,
        scope: str,
        zip_code: str | None,
        state: str | None,
    ) -> EligibilityJob:
        if isp != "frontier":
            raise ValueError(f"ISP '{isp}' is not supported on the tower yet")

        if scope == "zip":
            if not zip_code or len(zip_code) != 5 or not zip_code.isdigit():
                raise ValueError("ZIP scope requires a 5-digit zip code")
        elif scope == "state":
            if not state:
                raise ValueError("State scope requires a state code")
            raise ValueError(
                "State-wide runs are not supported yet — use ZIP scope. "
                "State mode needs a statewide address CSV workflow on the tower."
            )
        else:
            raise ValueError(f"Unknown scope: {scope}")

        if not ZIPCHECK_SCRIPT.exists():
            raise RuntimeError(f"Zip checker script not found: {ZIPCHECK_SCRIPT}")
        if not QUALIFIER_SCRIPT.exists():
            raise RuntimeError(f"Qualifier script not found: {QUALIFIER_SCRIPT}")

        job_id = str(uuid.uuid4())
        job_dir = JOBS_DIR / job_id
        job_dir.mkdir(parents=True, exist_ok=True)

        job = _empty_job(job_id, isp, scope, zip_code, state)
        with self._lock:
            self._jobs[job_id] = job

        thread = threading.Thread(
            target=self._run_pipeline,
            args=(job_id, job_dir, zip_code),
            daemon=True,
        )
        thread.start()
        return job.model_copy(deep=True)

    def retry_qualifier(self, job_id: str) -> EligibilityJob:
        with self._lock:
            job = self._jobs.get(job_id)
            if not job:
                raise KeyError("Job not found")
            if job.status not in ("failed", "cancelled"):
                raise ValueError("Job is not in a retryable state")
            if job.zipcheck.status != "completed":
                raise ValueError("Zip checker did not complete — run the full pipeline instead")
            job_snapshot = job.model_copy(deep=True)

        proc = self._processes.get(job_id)
        if proc and proc.poll() is None:
            raise RuntimeError("Job is already running")

        job_dir = JOBS_DIR / job_id
        csv_path = self._resolve_csv_path(job_snapshot, job_dir)
        if not csv_path.exists():
            raise FileNotFoundError(f"Zip checker CSV not found: {csv_path.name}")

        start_row = job_snapshot.qualifier.current if job_snapshot.qualifier.current > 0 else 0

        def prepare_retry(target: EligibilityJob) -> None:
            target.status = "running"
            target.phase = "qualifier"
            target.error = None
            target.completedAt = None
            target.downloads = None
            target.qualifier.status = "running"
            target.qualifier.message = (
                f"Retrying qualifier from row {start_row:,}…"
                if start_row > 0
                else "Retrying qualifier (reusing zip checker CSV)…"
            )
            if start_row == 0:
                target.qualifier.progress = 0
                target.qualifier.current = 0
                target.qualifier.counts = EligibilityCounts()

        self._update_job(job_id, prepare_retry)
        self._append_log(job_id, "", job_dir)
        self._append_log(job_id, "── Qualifier retry (zip checker skipped) ──", job_dir)

        if start_row == 0:
            out_dir = job_dir / csv_path.stem
            if out_dir.exists():
                shutil.rmtree(out_dir, ignore_errors=True)

        thread = threading.Thread(
            target=self._run_qualifier_only,
            args=(job_id, job_dir, csv_path, start_row),
            daemon=True,
        )
        thread.start()

        refreshed = self.get_job(job_id)
        if not refreshed:
            raise RuntimeError("Job disappeared after retry was queued")
        return refreshed

    def cancel_job(self, job_id: str) -> EligibilityJob:
        with self._lock:
            job = self._jobs.get(job_id)
            if not job:
                raise KeyError("Job not found")
            if job.status in ("completed", "failed", "cancelled"):
                return job.model_copy(deep=True)

        proc = self._processes.get(job_id)
        if proc and proc.poll() is None:
            self._terminate_process(proc)

        with self._lock:
            job = self._jobs[job_id]
            job.status = "cancelled"
            job.completedAt = _utc_now()
            if job.zipcheck.status in ("queued", "running"):
                job.zipcheck.status = "failed"
                job.zipcheck.message = "Cancelled"
            if job.qualifier.status in ("queued", "running"):
                job.qualifier.status = "failed"
                job.qualifier.message = "Cancelled"
            return job.model_copy(deep=True)

    def get_job_logs(self, job_id: str, offset: int = 0) -> tuple[list[str], int]:
        with self._lock:
            if job_id not in self._jobs:
                raise KeyError("Job not found")
            logs = self._job_logs.get(job_id, [])
            safe_offset = max(0, min(offset, len(logs)))
            return logs[safe_offset:], len(logs)

    def resolve_download(self, job_id: str, bucket: str) -> Path:
        if bucket not in COUNT_FILES:
            raise KeyError(f"Unknown download bucket: {bucket}")

        job = self.get_job(job_id)
        if not job:
            raise KeyError("Job not found")
        if job.status != "completed":
            raise RuntimeError("Job is not complete yet")

        job_dir = JOBS_DIR / job_id
        csv_name = job.zipcheck.outputCsv or (f"zipcheck_{job.zip}" if job.zip else None)
        if not csv_name:
            raise RuntimeError("Job output CSV is missing")

        output_dir = job_dir / Path(csv_name).stem
        file_path = output_dir / COUNT_FILES[bucket]
        if not file_path.exists():
            raise FileNotFoundError(f"Output file not found: {file_path.name}")
        return file_path

    def _update_job(self, job_id: str, updater: Callable[[EligibilityJob], None]) -> None:
        with self._lock:
            job = self._jobs[job_id]
            updater(job)

    def _resolve_csv_path(self, job: EligibilityJob, job_dir: Path) -> Path:
        if job.inputCsvPath:
            return Path(job.inputCsvPath)
        csv_name = job.zipcheck.outputCsv or (f"zipcheck_{job.zip}.csv" if job.zip else None)
        if not csv_name:
            raise ValueError("Job has no zip checker output CSV")
        return job_dir / csv_name

    def _run_qualifier_only(
        self,
        job_id: str,
        job_dir: Path,
        csv_path: Path,
        start_row: int = 0,
    ) -> None:
        try:
            qualifier_ok = self._run_qualifier(job_id, job_dir, csv_path, start_row=start_row)
            if not qualifier_ok:
                return
            self._update_job(
                job_id,
                lambda job: self._finalize_success(job, csv_path.name),
            )
        except Exception as exc:  # noqa: BLE001 — top-level job guard
            self._fail_job(job_id, str(exc))

    def _run_pipeline(self, job_id: str, job_dir: Path, zip_code: str | None) -> None:
        try:
            self._update_job(
                job_id,
                lambda job: (
                    setattr(job, "status", "running"),
                    setattr(job.zipcheck, "status", "running"),
                    setattr(job.zipcheck, "message", "Starting zip checker…"),
                ),
            )

            csv_path = job_dir / f"zipcheck_{zip_code}.csv"
            qualifier_out_dir = job_dir / csv_path.stem

            self._update_job(
                job_id,
                lambda job: (
                    setattr(job, "inputCsvPath", str(csv_path)),
                    setattr(job, "qualifierOutputDir", str(qualifier_out_dir)),
                ),
            )

            zipcheck_ok = self._run_zipcheck(job_id, job_dir, zip_code, csv_path)
            if not zipcheck_ok:
                return

            self._update_job(
                job_id,
                lambda job: (
                    setattr(job, "phase", "qualifier"),
                    setattr(job.qualifier, "status", "running"),
                    setattr(job.qualifier, "message", "Starting qualifier…"),
                ),
            )

            qualifier_ok = self._run_qualifier(job_id, job_dir, csv_path)
            if not qualifier_ok:
                return

            self._update_job(
                job_id,
                lambda job: self._finalize_success(job, csv_path.name),
            )
        except Exception as exc:  # noqa: BLE001 — top-level job guard
            self._fail_job(job_id, str(exc))

    def _run_zipcheck(self, job_id: str, job_dir: Path, zip_code: str | None, csv_path: Path) -> bool:
        cmd = [
            TOWER_PYTHON,
            str(ZIPCHECK_SCRIPT),
            "--zip",
            zip_code or "",
            "--out",
            str(csv_path),
        ]
        parse_state = ZipCheckParseState()

        def on_line(line: str) -> None:
            parse_zipcheck_line(line, parse_state)

            def apply(job: EligibilityJob) -> None:
                job.zipcheck.progress = parse_state.progress
                job.zipcheck.message = parse_state.message
                if parse_state.address_count is not None:
                    job.zipcheck.addressCount = parse_state.address_count
                if parse_state.output_csv:
                    job.zipcheck.outputCsv = Path(parse_state.output_csv).name
                elif csv_path.exists():
                    job.zipcheck.outputCsv = csv_path.name

            self._update_job(job_id, apply)

        exit_code = self._run_subprocess(job_id, cmd, cwd=BOT_DIR, on_line=on_line, job_dir=job_dir)
        if self._is_cancelled(job_id):
            return False

        if exit_code != 0:
            self._fail_job(job_id, f"Zip checker exited with code {exit_code}", job_id)
            return False

        if not csv_path.exists():
            self._fail_job(job_id, "Zip checker finished but output CSV was not created")
            return False

        address_count = parse_state.address_count
        if address_count is None:
            try:
                import pandas as pd

                address_count = len(pd.read_csv(csv_path, dtype=str))
            except Exception:
                address_count = None

        final_count = address_count

        def complete_zipcheck(job: EligibilityJob) -> None:
            job.zipcheck.status = "completed"
            job.zipcheck.progress = 100
            job.zipcheck.message = "Zip checker complete"
            job.zipcheck.outputCsv = csv_path.name
            if final_count is not None:
                job.zipcheck.addressCount = final_count
                job.qualifier.total = final_count

        self._update_job(job_id, complete_zipcheck)
        return True

    def _run_qualifier(self, job_id: str, job_dir: Path, csv_path: Path, start_row: int = 0) -> bool:
        cmd = [TOWER_PYTHON, str(QUALIFIER_SCRIPT), "--csv", str(csv_path)]
        if start_row > 0:
            cmd.extend(["--start", str(start_row)])
        parse_state = QualifierParseState()

        def on_line(line: str) -> None:
            parse_qualifier_line(line, parse_state)

            def apply(job: EligibilityJob) -> None:
                job.qualifier.progress = parse_state.progress
                job.qualifier.current = parse_state.current
                if parse_state.total > 0:
                    job.qualifier.total = parse_state.total
                job.qualifier.message = parse_state.message
                job.qualifier.counts = parse_state.counts.model_copy(deep=True)

            self._update_job(job_id, apply)

        exit_code = self._run_subprocess(job_id, cmd, cwd=BOT_DIR, on_line=on_line, job_dir=job_dir)
        if self._is_cancelled(job_id):
            return False

        if exit_code not in (0, -15):
            self._fail_job(job_id, f"Qualifier exited with code {exit_code}", job_id)
            return False

        def complete_qualifier(job: EligibilityJob) -> None:
            job.qualifier.status = "completed"
            job.qualifier.progress = 100
            if job.qualifier.total > 0:
                job.qualifier.current = job.qualifier.total
            job.qualifier.message = "Qualifier complete"

        self._update_job(job_id, complete_qualifier)
        return True

    def _finalize_success(self, job: EligibilityJob, csv_name: str) -> None:
        job.status = "completed"
        job.phase = "done"
        job.completedAt = _utc_now()
        job.downloads = {
            key: f"/api/jobs/{job.jobId}/download/{key}"
            for key in ("eligible", "notEligible", "existingCustomer", "futureFiber", "all")
        }

    def _append_log(self, job_id: str, line: str, job_dir: Path | None = None) -> None:
        with self._lock:
            logs = self._job_logs.setdefault(job_id, [])
            logs.append(line)
            if len(logs) > MAX_LOG_LINES:
                del logs[: len(logs) - MAX_LOG_LINES]

        if job_dir is not None:
            log_path = job_dir / "run.log"
            with log_path.open("a", encoding="utf-8") as handle:
                handle.write(line + "\n")

    def _summarize_failure(self, job_id: str, message: str) -> str:
        logs = self._job_logs.get(job_id, [])
        if not logs:
            return message

        interesting: list[str] = []
        for line in logs[-80:]:
            lower = line.lower()
            if any(token in lower for token in ("error", "traceback", "exception", "failed")):
                interesting.append(line.strip())

        if interesting:
            tail = interesting[-5:]
            return message + "\n\n" + "\n".join(tail)

        tail = [line.strip() for line in logs if line.strip()][-3:]
        if tail:
            return message + "\n\n" + "\n".join(tail)
        return message

    def _fail_job(self, job_id: str, message: str, log_job_id: str | None = None) -> None:
        detail = self._summarize_failure(log_job_id or job_id, message)

        def apply(job: EligibilityJob) -> None:
            job.status = "failed"
            job.error = detail
            job.completedAt = _utc_now()
            if job.zipcheck.status == "running":
                job.zipcheck.status = "failed"
            if job.qualifier.status == "running":
                job.qualifier.status = "failed"

        self._update_job(job_id, apply)

    def _is_cancelled(self, job_id: str) -> bool:
        job = self.get_job(job_id)
        return bool(job and job.status == "cancelled")

    def _run_subprocess(
        self,
        job_id: str,
        cmd: list[str],
        cwd: Path,
        on_line: Callable[[str], None],
        job_dir: Path | None = None,
    ) -> int:
        if job_dir is not None:
            self._append_log(job_id, f"$ {' '.join(cmd)}", job_dir)

        proc = subprocess.Popen(
            cmd,
            cwd=str(cwd),
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            encoding="utf-8",
            errors="replace",
            bufsize=1,
        )
        self._processes[job_id] = proc

        assert proc.stdout is not None
        for line in proc.stdout:
            stripped = line.rstrip("\n")
            self._append_log(job_id, stripped, job_dir)
            on_line(stripped)

        return proc.wait()

    def _terminate_process(self, proc: subprocess.Popen[str]) -> None:
        if sys.platform == "win32":
            subprocess.run(
                ["taskkill", "/F", "/T", "/PID", str(proc.pid)],
                capture_output=True,
                check=False,
            )
        else:
            proc.terminate()
            try:
                proc.wait(timeout=5)
            except subprocess.TimeoutExpired:
                proc.kill()


job_manager = JobManager()
