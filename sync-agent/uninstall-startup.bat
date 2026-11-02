@echo off
TITLE Disable Auto-Start on Windows Boot
COLOR 0E

set TARGET_VBS=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\AltrexSyncAgent.vbs

if exist "%TARGET_VBS%" (
  del /f /q "%TARGET_VBS%"
  echo [SUCCESS] Auto-start on Windows boot has been disabled.
) else (
  echo [INFO] Auto-start was not enabled.
)
echo.
pause
