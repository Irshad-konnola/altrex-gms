@echo off
TITLE Enable Auto-Start on Windows Boot
COLOR 0B

echo ======================================================================
echo    INSTALL ALTREX SYNC AGENT AUTO-START (WINDOWS BOOT)
echo ======================================================================
echo.

set SCRIPT_DIR=%~dp0
set TARGET_VBS=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\AltrexSyncAgent.vbs

echo Set WshShell = CreateObject("WScript.Shell") > "%TARGET_VBS%"
echo WshShell.CurrentDirectory = "%SCRIPT_DIR%" >> "%TARGET_VBS%"
echo WshShell.Run "cmd /c """ ^& "%SCRIPT_DIR%start.bat""" ^& """", 0, False >> "%TARGET_VBS%"

echo [SUCCESS] Auto-start has been configured!
echo The sync agent will now automatically launch in the background
echo whenever this computer powers on or restarts.
echo.
echo [INFO] Starting the sync agent now in the background...
wscript.exe "%TARGET_VBS%"
echo [SUCCESS] Sync agent is now actively running in the background!
echo (You will see "node.exe" in Task Manager under Background Processes)
echo.
pause
