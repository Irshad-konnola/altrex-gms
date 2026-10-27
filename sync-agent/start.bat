@echo off
TITLE Altrex GMS - Biometric Sync Agent
COLOR 0A

echo ======================================================================
echo           ALTREX GMS - BIOMETRIC TERMINAL SYNC AGENT
echo ======================================================================
echo.
echo Starting local background sync...
echo Make sure this computer is connected to the Gym Wi-Fi.
echo.

node index.js

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Sync Agent stopped with an error.
    echo Check the messages above or verify your .env file.
    pause
)
