@echo off
setlocal
cd /d "%~dp0"

echo.
echo  YFM2 Tower - go live
echo  ===================
echo.

REM Update tower-server from GitHub only if this install is a git clone.
if exist "%~dp0..\.git" (
  echo Pulling latest code from GitHub...
  git -C "%~dp0.." pull origin main
  if errorlevel 1 (
    echo Git pull failed - continuing with files already on disk.
  )
) else if exist "%~dp0.git" (
  echo Pulling latest code from GitHub...
  git pull origin main
  if errorlevel 1 (
    echo Git pull failed - continuing with files already on disk.
  )
) else (
  echo Not a git clone - skipping git pull. Rely on Google Drive sync instead.
)

echo.
echo Starting tower API ^(keep this window open^)...
start "YFM Tower API" cmd /k call "%~dp0start.bat"

echo Waiting for API to bind port 8787...
timeout /t 3 /nobreak >nul

echo Starting Tailscale funnel ^(keep this window open^)...
start "Tailscale Funnel" cmd /k tailscale funnel 8787

echo.
echo Done. Two windows should be open:
echo   1. YFM Tower API     - python main.py
echo   2. Tailscale Funnel  - copy the HTTPS URL into Vercel VITE_TOWER_API_URL
echo.
echo Local health check: http://localhost:8787/health
echo Bot scripts still come from G:\My Drive\bot\ ^(not updated by git pull^).
echo.
pause
