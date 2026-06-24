from __future__ import annotations

from fastapi import Depends, FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse

from config import API_KEY, BOT_DIR, CORS_ORIGINS, HOST, JOBS_DIR, PORT, QUALIFIER_SCRIPT, TOWER_PYTHON, ZIPCHECK_SCRIPT
from job_manager import job_manager
from models import EligibilityJob, ISPsResponse, JobLogsResponse, PendingQualifierListResponse, StartJobRequest, StartJobResponse, TowerISPInfo

app = FastAPI(title="YFM Tower API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def require_api_key(x_tower_key: str | None = Header(default=None)) -> None:
    if API_KEY and x_tower_key != API_KEY:
        raise HTTPException(status_code=401, detail="Invalid or missing X-Tower-Key header")


@app.get("/health")
def health() -> dict:
    pending_jobs = job_manager.list_pending_qualifier()
    return {
        "ok": True,
        "apiVersion": "1.1.0",
        "features": {
            "pendingQualifier": True,
        },
        "botDir": str(BOT_DIR),
        "jobsDir": str(JOBS_DIR),
        "jobFolderCount": job_manager.count_job_folders(),
        "pendingQualifierCount": len(pending_jobs),
        "python": TOWER_PYTHON,
        "scripts": {
            "zipChecker": ZIPCHECK_SCRIPT.exists(),
            "qualifier": QUALIFIER_SCRIPT.exists(),
        },
    }


@app.get("/api/isps", response_model=ISPsResponse)
def list_isps(_: None = Depends(require_api_key)) -> ISPsResponse:
    return ISPsResponse(
        isps=[
            TowerISPInfo(id="frontier", name="Frontier", enabled=True),
            TowerISPInfo(id="spectrum", name="Spectrum", enabled=False, comingSoon=True),
            TowerISPInfo(id="att", name="AT&T", enabled=False, comingSoon=True),
            TowerISPInfo(id="xfinity", name="Xfinity", enabled=False, comingSoon=True),
        ]
    )


@app.post("/api/jobs", response_model=StartJobResponse)
def start_job(body: StartJobRequest, _: None = Depends(require_api_key)) -> StartJobResponse:
    try:
        job = job_manager.start_job(body.isp, body.scope, body.zip, body.state)
        return StartJobResponse(jobId=job.jobId)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.get("/api/jobs/pending-qualifier", response_model=PendingQualifierListResponse)
def list_pending_qualifier(_: None = Depends(require_api_key)) -> PendingQualifierListResponse:
    return PendingQualifierListResponse(jobs=job_manager.list_pending_qualifier())


@app.get("/api/jobs/{job_id}", response_model=EligibilityJob)
def get_job(job_id: str, _: None = Depends(require_api_key)) -> EligibilityJob:
    job = job_manager.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


@app.get("/api/jobs/{job_id}/logs", response_model=JobLogsResponse)
def get_job_logs(job_id: str, offset: int = 0, _: None = Depends(require_api_key)) -> JobLogsResponse:
    try:
        lines, total = job_manager.get_job_logs(job_id, offset)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail="Job not found") from exc
    return JobLogsResponse(lines=lines, total=total, offset=offset)


@app.post("/api/jobs/{job_id}/retry-qualifier", response_model=EligibilityJob)
def retry_qualifier(job_id: str, _: None = Depends(require_api_key)) -> EligibilityJob:
    try:
        return job_manager.retry_qualifier(job_id)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail="Job not found") from exc
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc


@app.delete("/api/jobs/{job_id}", response_model=EligibilityJob)
def cancel_job(job_id: str, _: None = Depends(require_api_key)) -> EligibilityJob:
    try:
        return job_manager.cancel_job(job_id)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail="Job not found") from exc


@app.get("/api/jobs/{job_id}/download/{bucket}")
def download_results(job_id: str, bucket: str, _: None = Depends(require_api_key)) -> FileResponse:
    try:
        path = job_manager.resolve_download(job_id, bucket)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc

    return FileResponse(path, filename=path.name, media_type="text/csv")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host=HOST, port=PORT, reload=False)
