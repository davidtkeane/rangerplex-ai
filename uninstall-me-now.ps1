# RangerPlex AI Uninstaller for Windows (PowerShell)
# Version: 1.0.0
# Selectively uninstall RangerPlex components
#
# USAGE: .\uninstall-me-now.ps1

$ErrorActionPreference = "Continue"
$Host.UI.RawUI.WindowTitle = "RangerPlex AI Uninstaller"

# Colors
function Write-Step { param($msg) Write-Host "[>] " -ForegroundColor Cyan -NoNewline; Write-Host $msg }
function Write-Ok { param($msg) Write-Host "[OK] " -ForegroundColor Green -NoNewline; Write-Host $msg }
function Write-Warn { param($msg) Write-Host "[!] " -ForegroundColor Yellow -NoNewline; Write-Host $msg }
function Write-Fail { param($msg) Write-Host "[X] " -ForegroundColor Red -NoNewline; Write-Host $msg }

function Show-Banner {
    Write-Host ""
    Write-Host "=======================================================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "  RANGERPLEX AI - UNINSTALLER" -ForegroundColor Red
    Write-Host ""
    Write-Host "       Selectively remove RangerPlex components" -ForegroundColor DarkGray
    Write-Host ""
    Write-Host "=======================================================================" -ForegroundColor Red
    Write-Host ""
}

function Test-Command {
    param($cmd)
    try {
        Get-Command $cmd -ErrorAction Stop | Out-Null
        return $true
    } catch {
        return $false
    }
}

function Get-ProjectRoot {
    $scriptPath = $PSScriptRoot
    if (-not $scriptPath) {
        $scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
    }
    if (-not $scriptPath) {
        $scriptPath = Get-Location
    }
    return $scriptPath
}

function Show-Menu {
    Write-Host ""
    Write-Host "What would you like to uninstall?" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  [1] node_modules only (keep everything else)" -ForegroundColor Cyan
    Write-Host "      - Removes npm packages (~500MB+)" -ForegroundColor DarkGray
    Write-Host "      - Can reinstall with: npm install" -ForegroundColor DarkGray
    Write-Host ""
    Write-Host "  [2] node_modules + .env (API keys)" -ForegroundColor Cyan
    Write-Host "      - Removes packages AND your API keys" -ForegroundColor DarkGray
    Write-Host "      - You'll need to re-enter API keys on reinstall" -ForegroundColor DarkGray
    Write-Host ""
    Write-Host "  [3] PM2 processes only (stop servers)" -ForegroundColor Cyan
    Write-Host "      - Stops and removes PM2 daemon" -ForegroundColor DarkGray
    Write-Host "      - Keeps all files intact" -ForegroundColor DarkGray
    Write-Host ""
    Write-Host "  [4] PM2 global package" -ForegroundColor Cyan
    Write-Host "      - Uninstalls PM2 from system" -ForegroundColor DarkGray
    Write-Host "      - npm uninstall -g pm2" -ForegroundColor DarkGray
    Write-Host ""
    Write-Host "  [5] Switch Node.js version (nvm)" -ForegroundColor Cyan
    Write-Host "      - Switch between Node versions" -ForegroundColor DarkGray
    Write-Host "      - Useful for testing or reverting" -ForegroundColor DarkGray
    Write-Host ""
    Write-Host "  [6] Clean build artifacts" -ForegroundColor Cyan
    Write-Host "      - Removes dist/, .vite/, build cache" -ForegroundColor DarkGray
    Write-Host "      - Keeps source code and config" -ForegroundColor DarkGray
    Write-Host ""
    Write-Host "  [7] FULL UNINSTALL (node_modules + .env + PM2 + build)" -ForegroundColor Red
    Write-Host "      - Removes everything except source code" -ForegroundColor DarkGray
    Write-Host "      - Complete reset to fresh clone state" -ForegroundColor DarkGray
    Write-Host ""
    Write-Host "  [8] Uninstall nvm-windows" -ForegroundColor Cyan
    Write-Host "      - Remove Node Version Manager" -ForegroundColor DarkGray
    Write-Host ""
    Write-Host "  [9] Uninstall Docker Desktop" -ForegroundColor Cyan
    Write-Host "      - Opens Windows uninstaller" -ForegroundColor DarkGray
    Write-Host ""
    Write-Host "  [10] Uninstall Ollama" -ForegroundColor Cyan
    Write-Host "       - Remove Ollama and models" -ForegroundColor DarkGray
    Write-Host ""
    Write-Host "  [0] Exit (do nothing)" -ForegroundColor Green
    Write-Host ""
}

function Remove-NodeModules {
    param($projectRoot)

    $nodeModulesPath = Join-Path $projectRoot "node_modules"

    if (Test-Path $nodeModulesPath) {
        Write-Step "Removing node_modules..."

        # Get size before removal
        $size = (Get-ChildItem -Path $nodeModulesPath -Recurse -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum
        $sizeMB = [math]::Round($size / 1MB, 2)

        Write-Host "  Size: $sizeMB MB" -ForegroundColor DarkGray

        $confirm = Read-Host "Remove node_modules? (y/N)"
        if ($confirm -match "^[Yy]") {
            Remove-Item -Recurse -Force $nodeModulesPath -ErrorAction SilentlyContinue
            Write-Ok "node_modules removed! Freed ~$sizeMB MB"
            Write-Host "  Reinstall with: npm install" -ForegroundColor DarkGray
        } else {
            Write-Warn "Skipped node_modules removal."
        }
    } else {
        Write-Warn "node_modules not found (already removed?)."
    }
}

function Remove-EnvFile {
    param($projectRoot)

    $envPath = Join-Path $projectRoot ".env"

    if (Test-Path $envPath) {
        Write-Step "Removing .env file (API keys)..."
        Write-Warn "This will DELETE your API keys!"

        $confirm = Read-Host "Remove .env file? (y/N)"
        if ($confirm -match "^[Yy]") {
            # Backup first
            $backupPath = Join-Path $projectRoot ".env.backup.$(Get-Date -Format 'yyyyMMdd-HHmmss')"
            Copy-Item $envPath $backupPath
            Write-Host "  Backed up to: $backupPath" -ForegroundColor DarkGray

            Remove-Item $envPath -Force
            Write-Ok ".env removed! Backup saved."
        } else {
            Write-Warn "Skipped .env removal."
        }
    } else {
        Write-Warn ".env file not found."
    }
}

function Stop-PM2Processes {
    Write-Step "Stopping PM2 processes..."

    if (Test-Command "pm2") {
        & pm2 stop all 2>$null
        & pm2 delete all 2>$null
        & pm2 kill 2>$null
        Write-Ok "PM2 processes stopped and daemon killed."
    } else {
        Write-Warn "PM2 not found (not installed or not in PATH)."
    }
}

function Uninstall-PM2Global {
    Write-Step "Uninstalling PM2 globally..."

    if (Test-Command "pm2") {
        $confirm = Read-Host "Uninstall PM2 from system? (y/N)"
        if ($confirm -match "^[Yy]") {
            & pm2 kill 2>$null
            & npm uninstall -g pm2
            Write-Ok "PM2 uninstalled globally."
        } else {
            Write-Warn "Skipped PM2 uninstall."
        }
    } else {
        Write-Warn "PM2 not found."
    }
}

function Switch-NodeVersion {
    Write-Host ""
    Write-Host "Node.js Version Switcher" -ForegroundColor Cyan
    Write-Host ""

    # Check for nvm-windows
    $hasNvm = $false
    try {
        $nvmVersion = & nvm version 2>$null
        if ($nvmVersion) { $hasNvm = $true }
    } catch {}

    if (-not $hasNvm) {
        Write-Fail "nvm-windows is not installed."
        Write-Host "Install from: https://github.com/coreybutler/nvm-windows/releases" -ForegroundColor DarkGray
        return
    }

    Write-Host "Current Node versions installed:" -ForegroundColor Yellow
    & nvm list
    Write-Host ""

    $currentNode = & node -v 2>$null
    Write-Host "Currently active: $currentNode" -ForegroundColor Green
    Write-Host ""

    Write-Host "Options:" -ForegroundColor Yellow
    Write-Host "  [1] Switch to Node 22 (LTS - recommended for RangerPlex)" -ForegroundColor Cyan
    Write-Host "  [2] Switch to Node 25 (latest)" -ForegroundColor Cyan
    Write-Host "  [3] Install and switch to a specific version" -ForegroundColor Cyan
    Write-Host "  [0] Cancel" -ForegroundColor Green
    Write-Host ""

    $choice = Read-Host "Select option"

    switch ($choice) {
        "1" {
            Write-Step "Switching to Node 22..."
            & nvm install 22
            & nvm use 22
            Write-Ok "Switched to Node 22!"
            Write-Host ""
            Write-Host "After switching, you may need to:" -ForegroundColor Yellow
            Write-Host "  1. Close and reopen PowerShell" -ForegroundColor DarkGray
            Write-Host "  2. Run: npm rebuild" -ForegroundColor DarkGray
        }
        "2" {
            Write-Step "Switching to Node 25..."
            & nvm install 25
            & nvm use 25
            Write-Ok "Switched to Node 25!"
            Write-Warn "Note: Node 25 may break native modules in RangerPlex!"
        }
        "3" {
            $version = Read-Host "Enter Node version (e.g., 20, 21, 22, 23)"
            if ($version) {
                Write-Step "Installing and switching to Node $version..."
                & nvm install $version
                & nvm use $version
                Write-Ok "Switched to Node $version!"
            }
        }
        default {
            Write-Host "Cancelled." -ForegroundColor DarkGray
        }
    }
}

function Remove-BuildArtifacts {
    param($projectRoot)

    Write-Step "Removing build artifacts..."

    $artifacts = @(
        "dist",
        ".vite",
        "build",
        ".parcel-cache",
        ".turbo",
        "*.tsbuildinfo"
    )

    $removed = 0
    foreach ($artifact in $artifacts) {
        $path = Join-Path $projectRoot $artifact
        if (Test-Path $path) {
            Remove-Item -Recurse -Force $path -ErrorAction SilentlyContinue
            Write-Host "  Removed: $artifact" -ForegroundColor DarkGray
            $removed++
        }
    }

    if ($removed -gt 0) {
        Write-Ok "Removed $removed build artifact(s)."
    } else {
        Write-Warn "No build artifacts found."
    }
}

function Invoke-FullUninstall {
    param($projectRoot)

    Write-Host ""
    Write-Host "============================================================" -ForegroundColor Red
    Write-Host "                    FULL UNINSTALL" -ForegroundColor Red
    Write-Host "============================================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "This will remove:" -ForegroundColor Yellow
    Write-Host "  - node_modules (npm packages)" -ForegroundColor DarkGray
    Write-Host "  - .env (API keys - will be backed up)" -ForegroundColor DarkGray
    Write-Host "  - PM2 processes" -ForegroundColor DarkGray
    Write-Host "  - Build artifacts (dist, .vite, etc.)" -ForegroundColor DarkGray
    Write-Host ""
    Write-Host "Your source code will NOT be deleted." -ForegroundColor Green
    Write-Host ""

    $confirm = Read-Host "Proceed with FULL uninstall? (type 'YES' to confirm)"

    if ($confirm -eq "YES") {
        Write-Host ""
        Stop-PM2Processes
        Remove-BuildArtifacts -projectRoot $projectRoot
        Remove-EnvFile -projectRoot $projectRoot
        Remove-NodeModules -projectRoot $projectRoot

        Write-Host ""
        Write-Host "============================================================" -ForegroundColor Green
        Write-Host "              FULL UNINSTALL COMPLETE" -ForegroundColor Green
        Write-Host "============================================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "To reinstall RangerPlex:" -ForegroundColor Yellow
        Write-Host "  .\install-me-now.ps1" -ForegroundColor Cyan
        Write-Host ""
    } else {
        Write-Warn "Full uninstall cancelled."
    }
}

function Uninstall-NvmWindows {
    Write-Host ""
    Write-Host "Uninstall nvm-windows" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "nvm-windows must be uninstalled via Windows Settings:" -ForegroundColor Yellow
    Write-Host "  1. Open Settings > Apps > Installed Apps" -ForegroundColor DarkGray
    Write-Host "  2. Search for 'NVM for Windows'" -ForegroundColor DarkGray
    Write-Host "  3. Click Uninstall" -ForegroundColor DarkGray
    Write-Host ""
    Write-Host "Or use winget:" -ForegroundColor Yellow
    Write-Host "  winget uninstall CoreyButler.NVMforWindows" -ForegroundColor Cyan
    Write-Host ""

    $open = Read-Host "Open Windows Settings > Apps? (y/N)"
    if ($open -match "^[Yy]") {
        Start-Process "ms-settings:appsfeatures"
    }

    if (Test-Command "winget") {
        $useWinget = Read-Host "Or uninstall via winget now? (y/N)"
        if ($useWinget -match "^[Yy]") {
            & winget uninstall CoreyButler.NVMforWindows
        }
    }
}

function Uninstall-Docker {
    Write-Host ""
    Write-Host "Uninstall Docker Desktop" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Docker Desktop must be uninstalled via Windows Settings:" -ForegroundColor Yellow
    Write-Host "  1. Open Settings > Apps > Installed Apps" -ForegroundColor DarkGray
    Write-Host "  2. Search for 'Docker Desktop'" -ForegroundColor DarkGray
    Write-Host "  3. Click Uninstall" -ForegroundColor DarkGray
    Write-Host ""

    $open = Read-Host "Open Windows Settings > Apps? (y/N)"
    if ($open -match "^[Yy]") {
        Start-Process "ms-settings:appsfeatures"
    }
}

function Uninstall-Ollama {
    Write-Host ""
    Write-Host "Uninstall Ollama" -ForegroundColor Cyan
    Write-Host ""

    # Check if ollama is running
    if (Test-Command "ollama") {
        Write-Host "Stopping Ollama service..." -ForegroundColor DarkGray
        Stop-Process -Name "ollama" -Force -ErrorAction SilentlyContinue
    }

    Write-Host "Ollama must be uninstalled via Windows Settings:" -ForegroundColor Yellow
    Write-Host "  1. Open Settings > Apps > Installed Apps" -ForegroundColor DarkGray
    Write-Host "  2. Search for 'Ollama'" -ForegroundColor DarkGray
    Write-Host "  3. Click Uninstall" -ForegroundColor DarkGray
    Write-Host ""
    Write-Host "To also remove downloaded models:" -ForegroundColor Yellow
    Write-Host "  Delete folder: $env:USERPROFILE\.ollama" -ForegroundColor DarkGray
    Write-Host ""

    $open = Read-Host "Open Windows Settings > Apps? (y/N)"
    if ($open -match "^[Yy]") {
        Start-Process "ms-settings:appsfeatures"
    }

    $removeModels = Read-Host "Also remove Ollama models (~several GB)? (y/N)"
    if ($removeModels -match "^[Yy]") {
        $ollamaPath = Join-Path $env:USERPROFILE ".ollama"
        if (Test-Path $ollamaPath) {
            Remove-Item -Recurse -Force $ollamaPath
            Write-Ok "Ollama models removed."
        } else {
            Write-Warn "Ollama folder not found."
        }
    }
}

# ========================================
# MAIN EXECUTION
# ========================================

Clear-Host
Show-Banner

$projectRoot = Get-ProjectRoot

# Check for package.json
if (-not (Test-Path (Join-Path $projectRoot "package.json"))) {
    Write-Warn "Not in RangerPlex project directory."
    Write-Host "Current directory: $projectRoot" -ForegroundColor DarkGray
    Write-Host ""
    $continue = Read-Host "Continue anyway? (y/N)"
    if ($continue -notmatch "^[Yy]") {
        exit 0
    }
}

$running = $true
while ($running) {
    Show-Menu
    $choice = Read-Host "Select option (0-10)"

    switch ($choice) {
        "1" { Remove-NodeModules -projectRoot $projectRoot }
        "2" {
            Remove-NodeModules -projectRoot $projectRoot
            Remove-EnvFile -projectRoot $projectRoot
        }
        "3" { Stop-PM2Processes }
        "4" { Uninstall-PM2Global }
        "5" { Switch-NodeVersion }
        "6" { Remove-BuildArtifacts -projectRoot $projectRoot }
        "7" { Invoke-FullUninstall -projectRoot $projectRoot }
        "8" { Uninstall-NvmWindows }
        "9" { Uninstall-Docker }
        "10" { Uninstall-Ollama }
        "0" {
            Write-Host ""
            Write-Ok "Exiting uninstaller. Nothing was removed."
            $running = $false
        }
        default {
            Write-Warn "Invalid option. Please select 0-10."
        }
    }

    if ($running -and $choice -ne "0") {
        Write-Host ""
        $another = Read-Host "Uninstall something else? (y/N)"
        if ($another -notmatch "^[Yy]") {
            $running = $false
            Write-Host ""
            Write-Ok "Uninstaller complete. Rangers lead the way!"
        }
    }
}

Write-Host ""
