@echo off
TITLE Altrex GMS - Biometric Sync Agent
COLOR 0A

:loop
echo ======================================================================
echo           ALTREX GMS - BIOMETRIC TERMINAL SYNC AGENT
echo ======================================================================
echo.
echo [INFO] Starting local biometric sync daemon...
echo [INFO] Computer connected to Gym Wi-Fi.
echo.

node index.js

echo.
echo ======================================================================
echo [WARNING] Agent process stopped or crashed.
echo [AUTO-RECOVERY] Restarting automatically in 10 seconds...
echo ======================================================================
timeout /t 10
goto loop
