from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent

BOT_DIR = Path(os.getenv("TOWER_BOT_DIR", r"G:\My Drive\bot")).resolve()
JOBS_DIR = Path(os.getenv("TOWER_JOBS_DIR", BASE_DIR / "jobs")).resolve()
API_KEY = os.getenv("TOWER_API_KEY", "").strip()
HOST = os.getenv("TOWER_HOST", "0.0.0.0")
PORT = int(os.getenv("TOWER_PORT", "8787"))

# Python interpreter that has bot dependencies (pandas, selenium, etc.)
# Defaults to `python` on PATH — NOT the tower-server venv Python.
TOWER_PYTHON = os.getenv("TOWER_PYTHON", "python")

CORS_ORIGINS = [
    origin.strip()
    for origin in os.getenv(
        "TOWER_CORS_ORIGINS",
        "http://localhost:5173,http://localhost:5174,https://yfm2-theta.vercel.app",
    ).split(",")
    if origin.strip()
]

ZIPCHECK_SCRIPT = BOT_DIR / "frontier_zipcheck_v2.py"
QUALIFIER_SCRIPT = BOT_DIR / "frontier_checker53.py"

COUNT_FILES = {
    "eligible": "frontier_ELIGIBLE.csv",
    "notEligible": "frontier_NOT_ELIGIBLE.csv",
    "existingCustomer": "frontier_EXISTING_CUSTOMER.csv",
    "futureFiber": "frontier_FUTURE_FIBER.csv",
    "skipped": "frontier_SKIPPED.csv",
    "all": "frontier_ALL_RESULTS.csv",
}
