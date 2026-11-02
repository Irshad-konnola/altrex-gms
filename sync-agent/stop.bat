@echo off
TITLE Stop Altrex Biometric Agent
COLOR 0C

echo ======================================================================
echo           STOPPING ALTREX GMS BIOMETRIC SYNC AGENT
echo ======================================================================
echo.

taskkill /F /IM node.exe >nul 2>nul

echo [SUCCESS] Biometric sync agent stopped.
echo.
pause
