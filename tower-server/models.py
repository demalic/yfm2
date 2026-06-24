from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

PhaseStatus = Literal["idle", "queued", "running", "completed", "failed"]
JobStatus = Literal["queued", "running", "completed", "failed", "cancelled"]
JobPhase = Literal["zipcheck", "qualifier", "done"]
EligibilityScope = Literal["zip", "state"]
EligibilityCountKey = Literal[
    "eligible",
    "notEligible",
    "existingCustomer",
    "futureFiber",
    "skipped",
]


class EligibilityCounts(BaseModel):
    eligible: int = 0
    notEligible: int = 0
    existingCustomer: int = 0
    futureFiber: int = 0
    skipped: int = 0


class ZipCheckPhase(BaseModel):
    status: PhaseStatus = "idle"
    progress: int = 0
    message: str = ""
    addressCount: int | None = None
    outputCsv: str | None = None


class QualifierPhase(BaseModel):
    status: PhaseStatus = "idle"
    progress: int = 0
    current: int = 0
    total: int = 0
    message: str = ""
    counts: EligibilityCounts = Field(default_factory=EligibilityCounts)


class StartJobRequest(BaseModel):
    isp: str
    scope: EligibilityScope
    zip: str | None = None
    state: str | None = None


class StartJobResponse(BaseModel):
    jobId: str


class EligibilityJob(BaseModel):
    jobId: str
    isp: str
    scope: EligibilityScope
    zip: str | None
    state: str | None
    status: JobStatus
    phase: JobPhase
    zipcheck: ZipCheckPhase
    qualifier: QualifierPhase
    createdAt: str
    completedAt: str | None = None
    error: str | None = None
    downloads: dict[str, str] | None = None
    inputCsvPath: str | None = None
    qualifierOutputDir: str | None = None


class TowerISPInfo(BaseModel):
    id: str
    name: str
    enabled: bool
    comingSoon: bool | None = None


class ISPsResponse(BaseModel):
    isps: list[TowerISPInfo]


class JobLogsResponse(BaseModel):
    lines: list[str]
    total: int
    offset: int
