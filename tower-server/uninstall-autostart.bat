@echo off
setlocal

set TASK_NAME=YFM Tower Live
set SHORTCUT=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\YFM Tower Live.lnk

schtasks /Delete /TN "%TASK_NAME%" /F >nul 2>&1
if errorlevel 1 (
  echo No scheduled task found ^(%TASK_NAME%^).
) else (
  echo Removed scheduled task: %TASK_NAME%
)

if exist "%SHORTCUT%" (
  del "%SHORTCUT%"
  echo Removed startup shortcut.
) else (
  echo No startup shortcut found.
)

pause
endlocal
