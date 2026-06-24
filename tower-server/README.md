# YFM Tower Server

FastAPI wrapper around the Frontier bot scripts on your tower PC. The YFM2 website calls this API — it never runs zip checker or qualifier code itself.

## What it does

1. **POST /api/jobs** — start zip checker → qualifier pipeline for a ZIP code
2. **GET /api/jobs/:id** — live progress (parsed from script logs)
3. **GET /api/isps** — ISP list (matches website registry)
4. **DELETE /api/jobs/:id** — cancel running job
5. **GET /api/jobs/:id/download/:bucket** — download result CSVs
6. **GET /api/jobs/:id/logs?offset=0** — live stdout (for the site terminal view)
7. **POST /api/jobs/:id/retry-qualifier** — re-run qualifier only (reuses zip checker CSV)

See `example-responses.json` for the exact JSON shape the website expects.

## Prerequisites (tower PC)

- Python 3.11+ with the same packages your bot scripts need (`pandas`, `requests`, `selenium`, `undetected-chromedriver`, etc.)
- Scripts at `G:\My Drive\bot\`:
  - `frontier_zipcheck_v2.py`
  - `frontier_checker60.py`
- Chrome + Mullvad (optional, checker uses VPN rotation)

## Setup

```powershell
cd C:\Users\demalicperkins\yfm2\tower-server
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
```

Edit `.env` on the tower (copy from `.env.example`):

```
TOWER_BOT_DIR=G:\My Drive\bot
TOWER_PYTHON=python
TOWER_JOBS_DIR=./jobs
TOWER_PORT=8787
```

**Tower install path:** `G:\My Drive\tower-server` — synced to your tower PC via Google Drive. Run `start.bat` from there.

**Important:** `TOWER_PYTHON` must point to the Python that has your bot packages (`pandas`, `selenium`, etc.) — usually `python` on PATH, **not** the tower-server `.venv` Python.

Optional API key (recommended if exposing over the internet):

```
TOWER_API_KEY=your-secret-key
```

## Run locally

```powershell
cd C:\Users\demalicperkins\yfm2\tower-server
.\.venv\Scripts\Activate.ps1
python main.py
```

Health check: http://localhost:8787/health

## Wire the website

In project root `.env.local`:

```
VITE_TOWER_API_URL=http://localhost:8787
```

Restart `npm run dev`. The Eligibility tab warning should disappear and **Run Pipeline** will work.

For production (Vercel), set the same env var in the Vercel dashboard pointing at your public tower URL (see below).

## Expose tower to the internet

The website runs in the browser, so it must reach your tower over HTTPS (or localhost during dev).

### Option A — Tailscale Funnel (simplest)

1. Install [Tailscale](https://tailscale.com) on the tower PC
2. Enable Funnel for port 8787:
   ```powershell
   tailscale funnel 8787
   ```
3. Use the HTTPS URL Tailscale gives you as `VITE_TOWER_API_URL` in Vercel

### Option B — Cloudflare Tunnel

1. Install `cloudflared` on the tower PC
2. Create a tunnel pointing at `http://localhost:8787`
3. Use the Cloudflare hostname as `VITE_TOWER_API_URL`

### Option C — Same LAN only

If you only use the site locally, `http://<tower-lan-ip>:8787` works. Vercel-hosted site cannot reach LAN IPs — use Funnel/Tunnel for remote access.

## API key + website

If you set `TOWER_API_KEY`, requests need header `X-Tower-Key: your-secret-key`. The website client does not send this yet — leave `TOWER_API_KEY` empty until we add it to `towerApi.ts`, or only use LAN dev without a key.

## Scope notes

- **ZIP scope** — fully supported (zip checker → qualifier)
- **State scope** — not implemented yet; API returns 400. State runs need a statewide CSV workflow on the tower first.

## Job files

Each job writes to `tower-server/jobs/<jobId>/`:

```
jobs/<jobId>/zipcheck_46783.csv          ← zip checker output
jobs/<jobId>/zipcheck_46783/             ← qualifier bucket CSVs
  frontier_ELIGIBLE.csv
  frontier_NOT_ELIGIBLE.csv
  ...
```

OpenAddresses cache stays in `G:\My Drive\bot\oa_cache` (shared across jobs).

## Quick test (PowerShell)

```powershell
# Start server first, then:
Invoke-RestMethod http://localhost:8787/health
$body = @{ isp = "frontier"; scope = "zip"; zip = "46783" } | ConvertTo-Json
$r = Invoke-RestMethod -Method POST -Uri http://localhost:8787/api/jobs -Body $body -ContentType "application/json"
$r.jobId
Invoke-RestMethod "http://localhost:8787/api/jobs/$($r.jobId)"
```

Zip checker on a cached region finishes in seconds; qualifier takes hours for large zips.
