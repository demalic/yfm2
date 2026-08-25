@echo off
setlocal
cd /d "%~dp0"

set SHORTCUT=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\YFM Tower Live.lnk
set TARGET=%~dp0start-tower-live-auto.bat

powershell -NoProfile -Command "$s=(New-Object -ComObject WScript.Shell).CreateShortcut('%SHORTCUT%'); $s.TargetPath='%TARGET%'; $s.WorkingDirectory='%~dp0'; $s.WindowStyle=7; $s.Description='YFM2 tower API + Tailscale funnel'; $s.Save()"

if /i not "%~1"=="silent" (
  echo Startup shortcut created:
  echo   %SHORTCUT%
  pause
)
endlocal
