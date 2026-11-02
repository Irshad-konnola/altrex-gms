@echo off
TITLE Altrex GMS - Biometric Sync Agent
COLOR 0A

cd /d "%~dp0"

where node >nul 2>nul
if %errorlevel% neq 0 (
  echo ======================================================================
  echo [ERROR] Node.js is not found on this computer!
  echo Please download and install Node.js from https://nodejs.org
  echo ======================================================================
  pause
  exit /b 1
)

if not exist ".env" (
  echo ======================================================================
  echo [ERROR] .env configuration file is missing!
  echo Please ensure the .env file is present in this folder.
  echo ======================================================================
  pause
  exit /b 1
)

if not exist "node_modules" (
  echo [INFO] Installing dependencies (first run only)...
  call npm install --no-fund --no-audit
)

:loop
cls
echo ======================================================================
echo           ALTREX GMS - BIOMETRIC TERMINAL SYNC AGENT
echo ======================================================================
echo.
echo [INFO] Running local biometric sync daemon...
echo [INFO] Ensure this PC is connected to the Gym Wi-Fi / Network.
echo.

node index.js

echo.
echo ======================================================================
echo [WARNING] Agent process stopped or crashed.
echo [AUTO-RECOVERY] Restarting automatically in 10 seconds...
echo ======================================================================
timeout /t 10
goto loop
