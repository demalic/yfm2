@echo off
setlocal
cd /d "%~dp0" 2>nul
if errorlevel 1 (
  call :wait_for_drive
  cd /d "%~dp0" 2>nul
)

set LOG=%~dp0tower-autostart.log
echo [%date% %time%] Auto-start running >> "%LOG%"

REM Wait up to 5 minutes for Google Drive to mount G:\My Drive
call :wait_for_drive

if not exist "%~dp0start.bat" (
  echo [%date% %time%] ERROR: start.bat not found at %~dp0 >> "%LOG%"
  exit /b 1
)

if exist "%~dp0..\.git" (
  git -C "%~dp0.." pull origin main >> "%LOG%" 2>&1
) else if exist "%~dp0.git" (
  git pull origin main >> "%LOG%" 2>&1
)

start "YFM Tower API" cmd /k call "%~dp0start.bat"
timeout /t 5 /nobreak >nul
start "Tailscale Funnel" cmd /k tailscale funnel 8787

echo [%date% %time%] Started API + funnel >> "%LOG%"
endlocal
exit /b 0

:wait_for_drive
set /a TRIES=0
:wait_loop
if exist "G:\My Drive\tower-server\start.bat" exit /b 0
set /a TRIES+=1
if %TRIES% GEQ 60 exit /b 1
timeout /t 5 /nobreak >nul
goto wait_loop
