@echo off
setlocal EnableDelayedExpansion
cd /d "%~dp0"

set TASK_NAME=YFM Tower Live
set RUN_SCRIPT=%~dp0start-tower-live-auto.bat

REM Use the person logged into Windows (not the admin account used to install).
for /f "tokens=2 delims==" %%U in ('wmic computersystem get username /value ^| find "="') do set LOGON_USER=%%U
if not defined LOGON_USER set LOGON_USER=%USERDOMAIN%\%USERNAME%

echo.
echo  YFM2 - Install auto-start at login
echo  ==================================
echo.
echo  Task name : %TASK_NAME%
echo  User      : %LOGON_USER%
echo  Runs      : %RUN_SCRIPT%
echo.

schtasks /Query /TN "%TASK_NAME%" >nul 2>&1
if not errorlevel 1 (
  echo Removing old task first...
  schtasks /Delete /TN "%TASK_NAME%" /F >nul
)

schtasks /Create ^
  /TN "%TASK_NAME%" ^
  /TR "\"%RUN_SCRIPT%\"" ^
  /SC ONLOGON ^
  /RU "%LOGON_USER%" ^
  /RL LIMITED ^
  /IT ^
  /F

if errorlevel 1 (
  echo.
  echo FAILED. Try: right-click this file -^> Run as administrator
  echo.
  pause
  exit /b 1
)

echo.
echo SUCCESS. Task runs for user: %LOGON_USER%
echo The tower will start after login once Google Drive mounts G:\My Drive.
echo Log file: %~dp0tower-autostart.log
echo.
echo Also adding Startup folder shortcut ^(backup method^)...
call "%~dp0install-autostart-startup.bat" silent

echo.
echo To remove later: run uninstall-autostart.bat
echo.
pause
endlocal
