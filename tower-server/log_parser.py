from __future__ import annotations

import re
from dataclasses import dataclass, field

from models import EligibilityCounts


@dataclass
class ZipCheckParseState:
    progress: int = 0
    message: str = "Waiting to start zip checker…"
    address_count: int | None = None
    output_csv: str | None = None


@dataclass
class QualifierParseState:
    progress: int = 0
    current: int = 0
    total: int = 0
    message: str = "Waiting for zip checker…"
    counts: EligibilityCounts = field(default_factory=EligibilityCounts)


ZIPCHECK_DOWNLOAD_RE = re.compile(r"^\s*(\d+(?:\.\d+)?)%")
ZIPCHECK_ADDRESS_COUNT_RE = re.compile(r"(\d+)\s+unique addresses for zip")
ZIPCHECK_DONE_ADDRESSES_RE = re.compile(r"Addresses:\s+(\d+)")
ZIPCHECK_SAVED_RE = re.compile(r"Saved to:\s+(\S+)")
CHECKER_ROW_RE = re.compile(r"\[(\d+)/(\d+)\]")
CHECKER_PROGRESS_RE = re.compile(r"── Progress:\s+(\d+)/(\d+)\s+──")
CHECKER_COUNT_RE = {
    "eligible": re.compile(r"Eligible:\s+(\d+)"),
    "futureFiber": re.compile(r"Future Fiber:\s+(\d+)"),
    "existingCopper": re.compile(r"Existing Copper:\s+(\d+)"),
    "existingFiber": re.compile(r"Existing Fiber:\s+(\d+)"),
    "notEligible": re.compile(r"Not Eligible:\s+(\d+)"),
    "skipped": re.compile(r"Skipped:\s+(\d+)"),
}
CHECKER_LOADED_RE = re.compile(r"Loaded\s+(\d+)\s+addresses from")
LOG_PREFIX_RE = re.compile(r"^\d{2}:\d{2}:\d{2}\s+\w+\s+")


def _clean_log_line(line: str) -> str:
    return LOG_PREFIX_RE.sub("", line.strip())


def parse_zipcheck_line(line: str, state: ZipCheckParseState) -> None:
    stripped = _clean_log_line(line)
    if not stripped:
        return

    download_match = ZIPCHECK_DOWNLOAD_RE.match(stripped)
    if download_match:
        state.progress = min(35, int(float(download_match.group(1)) * 0.35))
        state.message = f"Downloading OpenAddresses archive… {download_match.group(1)}%"
        return

    if "Downloading OpenAddresses" in stripped:
        state.progress = max(state.progress, 5)
        state.message = stripped
        return

    if "Scanning archive for zip" in stripped:
        state.progress = max(state.progress, 40)
        state.message = stripped
        return

    if "CSV files in archive" in stripped:
        state.progress = max(state.progress, 50)
        state.message = stripped
        return

    if "Found — stopping scan early" in stripped or "unique addresses for zip" in stripped:
        count_match = ZIPCHECK_ADDRESS_COUNT_RE.search(stripped)
        if count_match:
            state.address_count = int(count_match.group(1))
        state.progress = max(state.progress, 90)
        state.message = stripped
        return

    saved_match = ZIPCHECK_SAVED_RE.search(stripped)
    if saved_match:
        state.output_csv = saved_match.group(1)
        state.progress = 100
        state.message = "Zip checker complete"
        return

    done_addresses = ZIPCHECK_DONE_ADDRESSES_RE.search(stripped)
    if done_addresses:
        state.address_count = int(done_addresses.group(1))
        state.progress = 100
        state.message = "Zip checker complete"
        return

    if "DONE" in stripped:
        state.progress = max(state.progress, 95)


def parse_qualifier_line(line: str, state: QualifierParseState) -> None:
    stripped = _clean_log_line(line)
    if not stripped:
        return

    loaded_match = CHECKER_LOADED_RE.search(stripped)
    if loaded_match:
        state.total = int(loaded_match.group(1))
        state.message = f"Loaded {state.total:,} addresses"
        return

    if "Starting browser" in stripped:
        state.message = "Starting browser…"
        return

    if "Getting initial cookies" in stripped:
        state.message = "Getting Frontier session cookies…"
        return

    if "Serviceability check" in stripped:
        state.message = "Checking addresses via Frontier API…"

    row_match = CHECKER_ROW_RE.search(stripped)
    if row_match:
        state.current = int(row_match.group(1))
        state.total = int(row_match.group(2))
        if state.total > 0:
            state.progress = min(99, int(state.current / state.total * 100))
        state.message = "Checking addresses via Frontier API…"
        return

    progress_match = CHECKER_PROGRESS_RE.search(stripped)
    if progress_match:
        state.current = int(progress_match.group(1))
        if state.total <= 0:
            state.total = int(progress_match.group(2))
        if state.total > 0:
            state.progress = min(99, int(state.current / state.total * 100))
        state.message = "Checking addresses via Frontier API…"
        return

    for key, pattern in CHECKER_COUNT_RE.items():
        count_match = pattern.search(stripped)
        if count_match:
            setattr(state.counts, key, int(count_match.group(1)))
