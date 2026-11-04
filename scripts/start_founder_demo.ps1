# ==============================================================================
# SALMAN DRIVER - SECURE REMOTE FOUNDER DEMONSTRATION LAUNCHER
# "Your Car. Your Journey. Your Driver."
# ==============================================================================

Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host "🚗 SALMAN DRIVER - FOUNDER DEMO LAUNCHER" -ForegroundColor Cyan
Write-Host "=======================================================" -ForegroundColor Cyan

# 1. Directory verification
$expectedPath = "C:\Users\Athiya\Documents\antigravity\silly-oppenheimer\driver-rental-app"
if ((Get-Location).Path -ne $expectedPath) {
    if (Test-Path $expectedPath) {
        Write-Host "ℹ️ Navigating to project directory: $expectedPath" -ForegroundColor Yellow
        Set-Location $expectedPath
    } else {
        Write-Host "❌ Error: Project directory not found at $expectedPath" -ForegroundColor Red
        Exit 1
    }
}
Write-Host "✅ Active Project Directory: $((Get-Location).Path)" -ForegroundColor Green

# 2. Check Node.js and NPM
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Error: Node.js is not found in PATH." -ForegroundColor Red
    Exit 1
}
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Error: npm is not found in PATH." -ForegroundColor Red
    Exit 1
}
Write-Host "✅ Node.js $(node --version) and npm $(npm --version) available" -ForegroundColor Green

# 3. Production Frontend Build
Write-Host "`n🔨 Compiling production frontend bundle (vite build)..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Frontend compilation failed. Aborting demo launch." -ForegroundColor Red
    Exit 1
}

# 4. Verify dist/index.html
if (-not (Test-Path "dist/index.html")) {
    Write-Host "❌ Error: dist/index.html was not generated." -ForegroundColor Red
    Exit 1
}
Write-Host "✅ Production bundle verified (dist/index.html exists)" -ForegroundColor Green

# 5. Security Notices & Instructions
Write-Host "`n=======================================================" -ForegroundColor Magenta
Write-Host "🔒 SECURITY NOTICE & DEMO ACCESS GUARDS:" -ForegroundColor Magenta
Write-Host "1. Staging demo accounts use SYNTHETIC test data only." -ForegroundColor White
Write-Host "2. Admin accounts MUST NOT be exposed via public tunnels without restriction." -ForegroundColor White
Write-Host "3. Financial transactions run in direct UPI/cash simulation mode (₹0 real charges)." -ForegroundColor White
Write-Host "4. Always terminate public tunnels immediately after demo sessions." -ForegroundColor White
Write-Host "=======================================================" -ForegroundColor Magenta

Write-Host "`n🚀 Starting Express Full-Stack Server on Port 5000..." -ForegroundColor Green
Write-Host "Local Health Probe: http://localhost:5000/health" -ForegroundColor Cyan
Write-Host "Local API Probe:    http://localhost:5000/api/health" -ForegroundColor Cyan
Write-Host "Local Web App:      http://localhost:5000/" -ForegroundColor Cyan

Write-Host "`n📡 TO GENERATE SALMAN'S PUBLIC HTTPS LINK:" -ForegroundColor Yellow
Write-Host "Open a SECOND PowerShell window and run:" -ForegroundColor White
Write-Host "   cloudflared tunnel --url http://localhost:5000" -ForegroundColor Green
Write-Host "Or email-restricted for Salman only:" -ForegroundColor White
Write-Host "   cloudflared tunnel --url http://localhost:5000 --allowed-mail salman@example.com" -ForegroundColor Green

Write-Host "`nPress Ctrl+C in this terminal when finished to stop the server." -ForegroundColor Yellow
Write-Host "=======================================================`n" -ForegroundColor Cyan

# Start server process
node server/index.js
