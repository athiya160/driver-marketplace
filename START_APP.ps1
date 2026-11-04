# Sarathi Driver Platform - PowerShell Runner
Write-Host "==============================================================================" -ForegroundColor Cyan
Write-Host "  SARATHI: ON-DEMAND PERSONAL DRIVER MARKETPLACE (INDIA)" -ForegroundColor Cyan
Write-Host "  'Your Car. Your Journey. Your Driver.'" -ForegroundColor Cyan
Write-Host "==============================================================================" -ForegroundColor Cyan

# Set directory to script folder
Set-Location $PSScriptRoot

# Check Node.js
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "`n[ERROR] Node.js is NOT installed on this computer!" -ForegroundColor Red
    Write-Host "Please download and install Node.js from https://nodejs.org/" -ForegroundColor Yellow
    Read-Host "Press Enter to exit..."
    Exit 1
}

Write-Host "[OK] Node.js $(node --version) detected." -ForegroundColor Green

# Check node_modules
if (-not (Test-Path "$PSScriptRoot\node_modules")) {
    Write-Host "[INFO] Installing dependencies..." -ForegroundColor Yellow
    npm install --omit=dev
}

Write-Host "`n[INFO] Launching Browser to http://localhost:5000..." -ForegroundColor Green
Start-Process "http://localhost:5000/"

Write-Host "`nServer is running on http://localhost:5000" -ForegroundColor Green
Write-Host "Customer Portal: http://localhost:5000/" -ForegroundColor White
Write-Host "Driver Portal:   http://localhost:5000/driver" -ForegroundColor White
Write-Host "Admin Portal:    http://localhost:5000/admin" -ForegroundColor White
Write-Host "`nKeep this window open. Press Ctrl+C to stop.`n" -ForegroundColor Yellow

node server/index.js
