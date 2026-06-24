from __future__ import annotations

import json
import re
import shutil
import subprocess
import sys
import threading
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Callable

from config import BOT_DIR, COUNT_FILES, JOBS_DIR, QUALIFIER_SCRIPT, TOWER_PYTHON, ZIPCHECK_SCRIPT
from log_parser import QualifierParseState, ZipCheckParseState, parse_qualifier_line, parse_zipcheck_line
from models import EligibilityCounts, EligibilityJob, PendingQualifierJob, QualifierPhase, ZipCheckPhase

MAX_LOG_LINES = 10_000
JOB_META_FILENAME = "job.meta.json"
_ZIPCHECK_CSV_RE = re.compile(r"^zipcheck_(\d{5})\.csv$", re.IGNORECASE)


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
        self._backfill_missing_meta_files()

    def get_job(self, job_id: str) -> EligibilityJob | None:
        with self._lock:
            job = self._jobs.get(job_id)
            if job:
                return job.model_copy(deep=True)

        restored = self._restore_job_from_disk(job_id)
        if restored:
            with self._lock:
                self._jobs[job_id] = restored
            return restored.model_copy(deep=True)
        return None

    def list_pending_qualifier(self) -> list[PendingQualifierJob]:
        pending: list[PendingQualifierJob] = []
        seen: set[str] = set()

        with self._lock:
            for job_id, job in self._jobs.items():
                if self._is_pending_qualifier_job(job):
                    entry = self._pending_from_job(job)
                    if entry:
                        pending.append(entry)
                        seen.add(job_id)

        if not JOBS_DIR.exists():
            return sorted(pending, key=lambda item: item.createdAt, reverse=True)

        for job_dir in JOBS_DIR.iterdir():
            if not job_dir.is_dir():
                continue
            job_id = job_dir.name
            if job_id in seen:
                continue
            try:
                entry = self._pending_from_disk(job_dir)
            except OSError:
                continue
            if entry:
                pending.append(entry)

        return sorted(pending, key=lambda item: item.createdAt, reverse=True)

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
            restored = self._restore_job_from_disk(job_id)
            if not restored:
                raise KeyError("Job not found")
            with self._lock:
                self._jobs[job_id] = restored
                job = restored

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
                job_dir = JOBS_DIR / job_id
                if job_dir.is_dir():
                    self._restore_logs_from_disk(job_id, job_dir)
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

    def _is_pending_qualifier_job(self, job: EligibilityJob) -> bool:
        if job.scope != "zip" or not job.zip:
            return False
        if job.status in ("running", "queued", "completed"):
            return False
        if job.zipcheck.status != "completed":
            return False
        return job.qualifier.status != "completed"

    def _pending_from_job(self, job: EligibilityJob) -> PendingQualifierJob | None:
        if not self._is_pending_qualifier_job(job) or not job.zip:
            return None

        qualifier_state: str = "not_started"
        if job.qualifier.status == "failed":
            qualifier_state = "failed"
        elif job.qualifier.current > 0:
            qualifier_state = "partial"

        csv_name = job.zipcheck.outputCsv or f"zipcheck_{job.zip}.csv"
        return PendingQualifierJob(
            jobId=job.jobId,
            zip=job.zip,
            addressCount=job.zipcheck.addressCount,
            csvFileName=csv_name,
            qualifierState=qualifier_state,  # type: ignore[arg-type]
            qualifierProgress=job.qualifier.progress,
            qualifierCurrent=job.qualifier.current,
            createdAt=job.createdAt,
        )

    def _pending_from_disk(self, job_dir: Path) -> PendingQualifierJob | None:
        csv_path = self._find_zipcheck_csv(job_dir)
        if not csv_path:
            return None

        zip_match = _ZIPCHECK_CSV_RE.match(csv_path.name)
        if not zip_match:
            return None

        zip_code = zip_match.group(1)
        if self._qualifier_is_complete(job_dir, csv_path):
            return None

        meta = self._read_job_meta(job_dir)
        address_count = meta.get("addressCount") if meta else None
        if address_count is None:
            address_count = self._count_csv_rows(csv_path)
        qualifier_state, qualifier_progress, qualifier_current = self._infer_qualifier_state(
            job_dir, csv_path, address_count
        )

        created_at = meta.get("createdAt") if meta else None
        if not created_at:
            created_at = datetime.fromtimestamp(job_dir.stat().st_mtime, tz=timezone.utc).isoformat().replace(
                "+00:00", "Z"
            )

        self._write_job_meta(
            job_dir,
            {
                "jobId": job_dir.name,
                "zip": zip_code,
                "csvFileName": csv_path.name,
                "addressCount": address_count,
                "zipcheckStatus": "completed",
                "qualifierStatus": qualifier_state,
                "createdAt": created_at,
            },
        )

        return PendingQualifierJob(
            jobId=job_dir.name,
            zip=zip_code,
            addressCount=address_count,
            csvFileName=csv_path.name,
            qualifierState=qualifier_state,  # type: ignore[arg-type]
            qualifierProgress=qualifier_progress,
            qualifierCurrent=qualifier_current,
            createdAt=created_at,
        )

    def _restore_job_from_disk(self, job_id: str) -> EligibilityJob | None:
        job_dir = JOBS_DIR / job_id
        if not job_dir.is_dir():
            return None

        csv_path = self._find_zipcheck_csv(job_dir)
        if not csv_path or not csv_path.exists():
            return None

        zip_match = _ZIPCHECK_CSV_RE.match(csv_path.name)
        zip_code = zip_match.group(1) if zip_match else None
        address_count = self._count_csv_rows(csv_path)
        out_dir = job_dir / csv_path.stem
        qualifier_complete = self._qualifier_is_complete(job_dir, csv_path)
        qualifier_state, qualifier_progress, qualifier_current = self._infer_qualifier_state(
            job_dir, csv_path, address_count
        )

        created_at = datetime.fromtimestamp(job_dir.stat().st_mtime, tz=timezone.utc).isoformat().replace(
            "+00:00", "Z"
        )

        self._restore_logs_from_disk(job_id, job_dir)

        if qualifier_complete:
            job = EligibilityJob(
                jobId=job_id,
                isp="frontier",
                scope="zip",
                zip=zip_code,
                state=None,
                status="completed",
                phase="done",
                createdAt=created_at,
                completedAt=created_at,
                error=None,
                inputCsvPath=str(csv_path),
                qualifierOutputDir=str(out_dir),
                zipcheck=ZipCheckPhase(
                    status="completed",
                    progress=100,
                    message="Zip checker complete",
                    addressCount=address_count,
                    outputCsv=csv_path.name,
                ),
                qualifier=QualifierPhase(
                    status="completed",
                    progress=100,
                    current=address_count or qualifier_current,
                    total=address_count or qualifier_current,
                    message="Qualifier complete",
                ),
                downloads={
                    key: f"/api/jobs/{job_id}/download/{key}"
                    for key in ("eligible", "notEligible", "existingCopper", "existingFiber", "futureFiber", "all")
                },
            )
            return job

        qualifier_status: str = "idle"
        if qualifier_state == "failed":
            qualifier_status = "failed"
        elif qualifier_state == "partial":
            qualifier_status = "failed"

        job_status: str = "failed"
        error = None
        if qualifier_state == "not_started":
            error = "Zip checker finished — qualifier has not been run yet."

        return EligibilityJob(
            jobId=job_id,
            isp="frontier",
            scope="zip",
            zip=zip_code,
            state=None,
            status=job_status,  # type: ignore[arg-type]
            phase="qualifier",
            createdAt=created_at,
            completedAt=created_at if qualifier_status == "failed" else None,
            error=error,
            inputCsvPath=str(csv_path),
            qualifierOutputDir=str(out_dir),
            zipcheck=ZipCheckPhase(
                status="completed",
                progress=100,
                message="Zip checker complete",
                addressCount=address_count,
                outputCsv=csv_path.name,
            ),
            qualifier=QualifierPhase(
                status=qualifier_status,  # type: ignore[arg-type]
                progress=qualifier_progress,
                current=qualifier_current,
                total=address_count or 0,
                message=(
                    "Qualifier not started"
                    if qualifier_state == "not_started"
                    else f"Qualifier stopped at row {qualifier_current:,}"
                    if qualifier_state == "partial"
                    else "Qualifier failed"
                ),
            ),
        )

    def _find_zipcheck_csv(self, job_dir: Path) -> Path | None:
        meta = self._read_job_meta(job_dir)
        if meta:
            csv_name = meta.get("csvFileName")
            if isinstance(csv_name, str):
                meta_path = job_dir / csv_name
                if meta_path.exists():
                    return meta_path

        matches = sorted(job_dir.glob("zipcheck_*.csv"), key=lambda path: path.stat().st_mtime, reverse=True)
        for path in matches:
            if _ZIPCHECK_CSV_RE.match(path.name):
                return path

        for path in sorted(job_dir.glob("*.csv"), key=lambda item: item.stat().st_mtime, reverse=True):
            if not path.name.lower().startswith("frontier_"):
                return path
        return None

    def _qualifier_output_dirs(self, job_dir: Path, csv_path: Path) -> list[Path]:
        stem = csv_path.stem
        dirs = [job_dir / stem]
        bot_output = BOT_DIR / stem
        if bot_output not in dirs:
            dirs.append(bot_output)
        return dirs

    def _qualifier_is_complete(self, job_dir: Path, csv_path: Path) -> bool:
        for out_dir in self._qualifier_output_dirs(job_dir, csv_path):
            if (out_dir / COUNT_FILES["all"]).exists():
                return True
        return False

    def _infer_qualifier_state(
        self, job_dir: Path, csv_path: Path, address_count: int | None
    ) -> tuple[str, int, int]:
        processed = 0
        saw_output = False

        for out_dir in self._qualifier_output_dirs(job_dir, csv_path):
            if not out_dir.exists() or not any(out_dir.glob("frontier_*.csv")):
                continue
            saw_output = True
            for file_name in COUNT_FILES.values():
                if file_name == COUNT_FILES["all"]:
                    continue
                bucket_path = out_dir / file_name
                if bucket_path.exists():
                    processed += max(0, self._count_csv_rows(bucket_path) or 0)

        if not saw_output:
            return "not_started", 0, 0

        total = address_count or 0
        progress = round(processed / total * 100) if total > 0 else 0
        if total > 0 and processed >= total:
            return "failed", 100, processed
        return "partial", min(100, progress), processed

    def _read_job_meta(self, job_dir: Path) -> dict[str, Any] | None:
        meta_path = job_dir / JOB_META_FILENAME
        if not meta_path.exists():
            return None
        try:
            return json.loads(meta_path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            return None

    def _write_job_meta(self, job_dir: Path, meta: dict[str, Any]) -> None:
        meta_path = job_dir / JOB_META_FILENAME
        existing = self._read_job_meta(job_dir) or {}
        existing.update(meta)
        try:
            meta_path.write_text(json.dumps(existing, indent=2), encoding="utf-8")
        except OSError:
            return

    def _backfill_missing_meta_files(self) -> None:
        if not JOBS_DIR.exists():
            return
        for job_dir in JOBS_DIR.iterdir():
            if not job_dir.is_dir():
                continue
            if (job_dir / JOB_META_FILENAME).exists():
                continue
            self._pending_from_disk(job_dir)

    def count_job_folders(self) -> int:
        if not JOBS_DIR.exists():
            return 0
        return sum(1 for path in JOBS_DIR.iterdir() if path.is_dir())

    def _count_csv_rows(self, path: Path) -> int | None:
        try:
            with path.open("r", encoding="utf-8", errors="replace") as handle:
                line_count = sum(1 for _ in handle)
            return max(0, line_count - 1)
        except OSError:
            return None

    def _restore_logs_from_disk(self, job_id: str, job_dir: Path) -> None:
        log_path = job_dir / "run.log"
        if not log_path.exists():
            return
        with self._lock:
            if self._job_logs.get(job_id):
                return
            try:
                text = log_path.read_text(encoding="utf-8", errors="replace")
            except OSError:
                return
            lines = text.splitlines()
            if len(lines) > MAX_LOG_LINES:
                lines = lines[-MAX_LOG_LINES:]
            self._job_logs[job_id] = lines

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
        self._write_job_meta(
            job_dir,
            {
                "jobId": job_id,
                "zip": zip_code,
                "csvFileName": csv_path.name,
                "addressCount": final_count,
                "zipcheckStatus": "completed",
                "qualifierStatus": "not_started",
                "createdAt": _utc_now(),
            },
        )
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
            for key in ("eligible", "notEligible", "existingCopper", "existingFiber", "futureFiber", "all")
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
