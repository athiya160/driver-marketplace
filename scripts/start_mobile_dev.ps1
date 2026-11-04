# ==============================================================================
# SARATHI / SALMAN DRIVER - MOBILE DEV TEST HELPER
# Starts the responsive Vite frontend with network access for phone testing.
# "Your Car. Your Journey. Your Driver."
# ==============================================================================

Write-Host "==============================================================================" -ForegroundColor Cyan
Write-Host "  SARATHI: ON-DEMAND PERSONAL CHAUFFEUR MARKETPLACE (MOBILE DEV)" -ForegroundColor Cyan
Write-Host "  'Your Car. Your Journey. Your Driver.'" -ForegroundColor Cyan
Write-Host "==============================================================================" -ForegroundColor Cyan

# 1. Project directory verification
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptDir
Set-Location $projectRoot

Write-Host "`n[1/5] Project Directory: $projectRoot" -ForegroundColor Green

# 2. Verify dependencies
if (-not (Test-Path "$projectRoot\node_modules")) {
    Write-Host "[!] node_modules not detected. Running npm install..." -ForegroundColor Yellow
    npm install
} else {
    Write-Host "[2/5] Dependencies verified (node_modules present)." -ForegroundColor Green
}

# 3. Detect Computer's LAN IPv4 Address
$lanIps = Get-NetIPAddress -AddressFamily IPv4 | Where-Object {
    $_.InterfaceAlias -notmatch "Loopback|vEthernet|WSL" -and 
    $_.IPAddress -notmatch "^127\.|^169\.254\."
} | Select-Object -ExpandProperty IPAddress

$primaryIp = $lanIps | Select-Object -First 1
if (-not $primaryIp) {
    $primaryIp = "YOUR_COMPUTER_IP"
}

Write-Host "[3/5] LAN IPv4 Address Detected: $primaryIp" -ForegroundColor Yellow

# 4. Same Wi-Fi Guidance
Write-Host "`n==============================================================================" -ForegroundColor Magenta
Write-Host "  HOW TO OPEN ON YOUR ANDROID OR IPHONE:" -ForegroundColor Magenta
Write-Host "  1. Make sure your phone and this computer are connected to the SAME Wi-Fi." -ForegroundColor White
Write-Host "  2. Ensure the Backend Server is running in Terminal 1 (npm run server)." -ForegroundColor White
Write-Host "  3. Open Safari or Chrome on your mobile phone." -ForegroundColor White
Write-Host "  4. Type this exact URL into your phone browser:" -ForegroundColor White
Write-Host "`n     http://${primaryIp}:5173/`n" -ForegroundColor Green
Write-Host "  Or for the production build after 'npm run build':" -ForegroundColor White
Write-Host "     http://${primaryIp}:5000/`n" -ForegroundColor Cyan
Write-Host "==============================================================================" -ForegroundColor Magenta

# 5. Troubleshooting Guidance
Write-Host "[4/5] Troubleshooting Tips:" -ForegroundColor Gray
Write-Host "  - If phone says 'Site can't be reached', verify Windows Defender Firewall" -ForegroundColor Gray
Write-Host "    allows Node.js on Private Networks, or set your Wi-Fi profile to 'Private'." -ForegroundColor Gray
Write-Host "  - Keep both Terminal 1 (npm run server) and this Terminal running." -ForegroundColor Gray

# 6. Start Vite Frontend with 0.0.0.0 binding
Write-Host "`n[5/5] Starting Vite Dev Server on host 0.0.0.0:5173..." -ForegroundColor Green
Write-Host "Press Ctrl + C in this terminal to stop Vite.`n" -ForegroundColor Yellow

npm run dev -- --host 0.0.0.0
