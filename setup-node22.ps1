# RangerPlex Node Setup Helper
# Run this after restarting PowerShell

Write-Host "Setting up Node.js 22 via nvm..." -ForegroundColor Cyan
nvm install 22
nvm use 22
Write-Host ""
Write-Host "Verifying Node version..." -ForegroundColor Cyan
node -v
Write-Host ""
Write-Host "If you see v22.x.x above, run:" -ForegroundColor Green
Write-Host "  .\install-me-now.ps1" -ForegroundColor Yellow
