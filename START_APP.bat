@echo off
title Sarathi Driver Platform - Local Runner
color 0A
echo ==============================================================================
echo   SARATHI: ON-DEMAND PERSONAL DRIVER MARKETPLACE (INDIA)
echo   "Your Car. Your Journey. Your Driver."
echo ==============================================================================
echo.

:: 1. Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js is NOT installed on this computer!
    echo.
    echo Node.js is required to run the local server.
    echo Please install Node.js (LTS version) from:
    echo   https://nodejs.org/
    echo (Takes 1-2 minutes to install. After installing, re-open this file.)
    echo.
    pause
    exit /b 1
)

echo [OK] Node.js is detected:
node --version
echo.

:: 2. Set Working Directory to this folder
cd /d "%~dp0"

:: 3. Check if node_modules exists (fallback if unzipped without it)
if not exist "node_modules\" (
    echo [INFO] First time initialization: installing packages...
    call npm install --omit=dev
    if %ERRORLEVEL% neq 0 (
        echo [ERROR] Failed to install packages. Check internet connection.
        pause
        exit /b 1
    )
)

:: 4. Start the Server and open browser
echo [INFO] Starting Sarathi Server on http://localhost:5000 ...
echo.
echo ==============================================================================
echo  Open these links in your browser:
echo  Customer Web & Mobile App: http://localhost:5000/
echo  Chauffeur / Driver App:   http://localhost:5000/driver
echo  Admin Control Center:     http://localhost:5000/admin
echo ==============================================================================
echo.
echo Launching your browser now...
start http://localhost:5000/

echo.
echo Server is actively running!
echo Keep this window open while testing.
echo Press Ctrl + C to stop the server when done.
echo.

node server/index.js
pause
