# 🎖️ Antigravity Migration - Windows Restore Script
# PowerShell script to restore Antigravity data on MSI Windows laptop

Write-Host "🎖️ ANTIGRAVITY MIGRATION - WINDOWS RESTORE" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "⚠️  WARNING: Not running as Administrator" -ForegroundColor Yellow
    Write-Host "Some operations may fail. Consider running as Admin." -ForegroundColor Yellow
    Write-Host ""
}

# Set backup location
$BackupArchive = "$env:USERPROFILE\Downloads\MSI-Migration-*.tar.gz"
$BackupFolder = "$env:USERPROFILE\Desktop\MSI-Migration-Restored"

Write-Host "📦 Step 1: Locating backup archive..." -ForegroundColor Green
$ArchiveFile = Get-ChildItem -Path "$env:USERPROFILE\Downloads" -Filter "MSI-Migration-*.tar.gz" | Select-Object -First 1

if (-not $ArchiveFile) {
    Write-Host "❌ ERROR: No backup archive found in Downloads!" -ForegroundColor Red
    Write-Host "Please copy MSI-Migration-YYYYMMDD.tar.gz to Downloads folder" -ForegroundColor Yellow
    exit 1
}

Write-Host "   ✅ Found: $($ArchiveFile.Name)" -ForegroundColor Green
Write-Host ""

# Extract backup
Write-Host "📂 Step 2: Extracting backup..." -ForegroundColor Green
if (Test-Path $BackupFolder) {
    Remove-Item -Recurse -Force $BackupFolder
}
New-Item -ItemType Directory -Path $BackupFolder -Force | Out-Null

# Use tar (built into Windows 10+)
tar -xzf $ArchiveFile.FullName -C "$env:USERPROFILE\Desktop"
Write-Host "   ✅ Extracted to Desktop" -ForegroundColor Green
Write-Host ""

# Restore Antigravity
Write-Host "🤖 Step 3: Restoring Antigravity data..." -ForegroundColor Green

# Check if Antigravity is running
$antigravityProcess = Get-Process -Name "Antigravity" -ErrorAction SilentlyContinue
if ($antigravityProcess) {
    Write-Host "   ⚠️  Antigravity is running! Attempting to close..." -ForegroundColor Yellow
    Stop-Process -Name "Antigravity" -Force
    Start-Sleep -Seconds 2
}

$AntigravitySource = Get-ChildItem -Path "$env:USERPROFILE\Desktop\MSI-Migration-*\Antigravity" -Directory | Select-Object -First 1
$AntigravityDest = "$env:APPDATA\Antigravity"

if ($AntigravitySource) {
    # Backup existing data
    if (Test-Path $AntigravityDest) {
        Write-Host "   📦 Backing up existing Antigravity data..." -ForegroundColor Yellow
        Move-Item -Path $AntigravityDest -Destination "$env:APPDATA\Antigravity.backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')" -Force
    }
    
    # Copy Mac data
    Copy-Item -Path $AntigravitySource.FullName -Destination $AntigravityDest -Recurse -Force
    Write-Host "   ✅ Antigravity data restored" -ForegroundColor Green
    
    # Get size
    $size = (Get-ChildItem -Path $AntigravityDest -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB
    Write-Host "   📊 Data size: $([math]::Round($size, 2)) MB" -ForegroundColor Cyan
} else {
    Write-Host "   ⚠️  Antigravity backup not found in archive" -ForegroundColor Yellow
}
Write-Host ""

# Restore RangerPlex
Write-Host "🎖️  Step 4: Restoring RangerPlex data..." -ForegroundColor Green

$RangerPlexSource = Get-ChildItem -Path "$env:USERPROFILE\Desktop\MSI-Migration-*\RangerPlex" -Directory -ErrorAction SilentlyContinue | Select-Object -First 1

if ($RangerPlexSource) {
    Write-Host "   📝 RangerPlex backup found!" -ForegroundColor Cyan
    Write-Host "   📍 Database: $($RangerPlexSource.FullName)\rangerplex.db" -ForegroundColor Cyan
    Write-Host "   📍 Config: $($RangerPlexSource.FullName)\env-backup.txt" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "   ℹ️  Manual steps required:" -ForegroundColor Yellow
    Write-Host "      1. Clone RangerPlex: git clone https://github.com/davidtkeane/rangerplex-ai.git" -ForegroundColor White
    Write-Host "      2. Copy rangerplex.db to: rangerplex-ai\data\" -ForegroundColor White
    Write-Host "      3. Copy env-backup.txt to: rangerplex-ai\.env" -ForegroundColor White
    Write-Host "      4. Run: npm install" -ForegroundColor White
    Write-Host "      5. Run: npm run pm2:start" -ForegroundColor White
} else {
    Write-Host "   ⚠️  RangerPlex backup not found" -ForegroundColor Yellow
}
Write-Host ""

# Summary
Write-Host "✅ MIGRATION COMPLETE!" -ForegroundColor Green
Write-Host "=====================" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Next steps:" -ForegroundColor Cyan
Write-Host "   1. Start Antigravity app" -ForegroundColor White
Write-Host "   2. Verify conversations are present" -ForegroundColor White
Write-Host "   3. Install RangerPlex (see manual steps above)" -ForegroundColor White
Write-Host ""
Write-Host "🛡️  Safety:" -ForegroundColor Yellow
Write-Host "   - Original data backed up to: $env:APPDATA\Antigravity.backup-*" -ForegroundColor White
Write-Host "   - Keep M3 Pro data until verified working" -ForegroundColor White
Write-Host ""
Write-Host "🎖️  Rangers lead the way!" -ForegroundColor Cyan
