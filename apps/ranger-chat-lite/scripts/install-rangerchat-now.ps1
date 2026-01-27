#Requires -Version 5.1
<#
.SYNOPSIS
    RangerChat Lite - One-Command Installer for Windows
.DESCRIPTION
    Works on: Windows 10/11 (PowerShell 5.1+)

    Created: December 4, 2025
    Updated: January 27, 2026 (v1.8.0 - Smart OS detection & auto-install)
    Author: David Keane (IrishRanger) + Claude Code (Ranger)
.PARAMETER Dev
    Run in development mode (npm run dev) - DEFAULT
.PARAMETER Build
    Build production app after install
.PARAMETER NoStart
    Don't start the app after install
.PARAMETER Yes
    Skip confirmation prompts
.EXAMPLE
    # Run from PowerShell:
    irm https://raw.githubusercontent.com/davidtkeane/rangerplex-ai/main/apps/ranger-chat-lite/scripts/install.ps1 | iex

    # Or with options:
    .\install.ps1 -Build
    .\install.ps1 -NoStart
.NOTES
    Rangers lead the way!
#>

param(
    [switch]$Dev,
    [switch]$Build,
    [switch]$NoStart,
    [switch]$Yes
)

# Configuration
$InstallDir = "$env:USERPROFILE\RangerChat-Lite"
$Version = "1.8.0"

# Colors
function Write-Color {
    param([string]$Text, [string]$Color = "White")
    Write-Host $Text -ForegroundColor $Color
}

function Test-Cmd {
    param($cmd)
    try { Get-Command $cmd -ErrorAction Stop | Out-Null; return $true } catch { return $false }
}

function Write-Banner {
    Clear-Host
    Write-Color @"
 ======================================================================
    RANGER  CHAT  LITE
    ██████╗  █████╗ ███╗   ██╗ ██████╗ ███████╗██████╗  ██████╗██╗  ██╗
    ██╔══██╗██╔══██╗████╗  ██║██╔════╝ ██╔════╝██╔══██╗██╔════╝██║  ██║
    ██████╔╝███████║██╔██╗ ██║██║  ███╗█████╗  ██████╔╝██║     ███████║
    ██╔══██╗██╔══██║██║╚██╗██║██║   ██║██╔══╝  ██╔══██╗██║     ██╔══██║
    ██║  ██║██║  ██║██║ ╚████║╚██████╔╝███████╗██║  ██║╚██████╗██║  ██║
    ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝ ╚═════╝ ╚══════╝╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝
                           L    I    T    E
 ======================================================================
            Lightweight Chat for RangerBlock Network
            Version 1.8.0 - One-Command Installer (Windows)
            Created by IrishRanger + Claude Code (Ranger)
 ======================================================================
"@ -Color Cyan
}

function Show-SystemInfo {
    # Windows version and edition
    $osPretty = "Windows"
    try {
        $os = Get-CimInstance Win32_OperatingSystem -ErrorAction Stop
        $osPretty = ($os.Caption -replace "Microsoft ", "")
        try {
            $displayVer = (Get-ItemProperty "HKLM:\SOFTWARE\Microsoft\Windows NT\CurrentVersion" -ErrorAction Stop).DisplayVersion
            if ($displayVer) { $osPretty += " ($displayVer)" }
        } catch {}
    } catch {}

    # Architecture
    $archDisplay = $env:PROCESSOR_ARCHITECTURE
    if ($archDisplay -eq "AMD64") { $archDisplay = "x86_64" }

    # winget
    $pkgDisplay = if (Test-Cmd "winget") { "winget available" } else { "winget not found" }

    # RAM
    $ramDisplay = "Unknown"
    try {
        $totalRAM = [math]::Round((Get-CimInstance Win32_ComputerSystem -ErrorAction Stop).TotalPhysicalMemory / 1GB)
        $ramDisplay = "$totalRAM GB"
    } catch {}

    Write-Host ""
    Write-Host "  +-----------------------------------------------------+" -ForegroundColor Cyan
    Write-Host "  |  " -ForegroundColor Cyan -NoNewline
    Write-Host "System Detected" -ForegroundColor White -NoNewline
    Write-Host "                                    |" -ForegroundColor Cyan

    $fields = @(
        @("OS:", $osPretty),
        @("Arch:", $archDisplay),
        @("Pkg:", $pkgDisplay),
        @("RAM:", $ramDisplay)
    )
    foreach ($f in $fields) {
        $label = $f[0].PadRight(8)
        $value = "$($f[1])"
        if ($value.Length -gt 43) { $value = $value.Substring(0, 40) + "..." }
        $padding = 43 - $value.Length
        if ($padding -lt 0) { $padding = 0 }
        Write-Host "  |  " -ForegroundColor Cyan -NoNewline
        Write-Host "$label" -ForegroundColor DarkGray -NoNewline
        Write-Host "$value" -NoNewline
        Write-Host (" " * $padding) -NoNewline
        Write-Host "|" -ForegroundColor Cyan
    }
    Write-Host "  +-----------------------------------------------------+" -ForegroundColor Cyan
    Write-Host ""
}

# ============================================================
# MAIN SCRIPT
# ============================================================

Write-Banner
Show-SystemInfo

# ============================================================
# STEP 1: Check/Install Node.js
# ============================================================
Write-Color "`n------------------------------------------------------------" -Color Cyan
Write-Color "Step 1: Checking Node.js" -Color White
Write-Color "------------------------------------------------------------" -Color Cyan

$wingetAvailable = Test-Cmd "winget"

$nodeInstalled = $false
try {
    $nodeVersion = node -v 2>$null
    if ($nodeVersion) {
        Write-Color "[OK] Node.js found: $nodeVersion" -Color Green
        $nodeInstalled = $true
    }
} catch {
    $nodeInstalled = $false
}

if (-not $nodeInstalled) {
    Write-Color "Node.js not found. Installing..." -Color Yellow

    if ($wingetAvailable) {
        Write-Color "Installing Node.js LTS via winget..." -Color Blue
        & winget install OpenJS.NodeJS.LTS --accept-package-agreements --accept-source-agreements

        # Refresh PATH
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
    } else {
        Write-Color "Installing via direct download..." -Color Blue

        # Download Node.js 22 installer
        $nodeUrl = "https://nodejs.org/dist/v22.11.0/node-v22.11.0-x64.msi"
        $installerPath = "$env:TEMP\node-installer.msi"

        Write-Color "Downloading Node.js 22 LTS..." -Color Blue
        [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
        Invoke-WebRequest -Uri $nodeUrl -OutFile $installerPath -UseBasicParsing

        Write-Color "Running installer (may require admin)..." -Color Blue
        Start-Process msiexec.exe -ArgumentList "/i", $installerPath, "/quiet", "/norestart" -Wait

        # Refresh PATH
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

        # Cleanup
        Remove-Item $installerPath -Force -ErrorAction SilentlyContinue
    }

    # Verify installation
    try {
        $nodeVersion = node -v 2>$null
        if ($nodeVersion) {
            Write-Color "[OK] Node.js installed: $nodeVersion" -Color Green
        } else {
            throw "Node.js installation failed"
        }
    } catch {
        Write-Color "ERROR: Node.js installation failed!" -Color Red
        Write-Color "Please install Node.js manually from: https://nodejs.org" -Color Yellow
        Write-Color "Then run this script again." -Color Yellow
        exit 1
    }
}

# Check npm
$npmInstalled = $false
try {
    $npmVersion = npm -v 2>$null
    if ($npmVersion) {
        Write-Color "[OK] npm found: v$npmVersion" -Color Green
        $npmInstalled = $true
    }
} catch {}

if (-not $npmInstalled) {
    Write-Color "npm not found." -Color Red
    Write-Color "npm should be included with Node.js. Try reinstalling Node.js." -Color Yellow
    Write-Color "  Download: https://nodejs.org/dist/v22.11.0/node-v22.11.0-x64.msi" -Color Cyan
    exit 1
}

# Check git
$gitInstalled = $false
try {
    $gitVersion = git --version 2>$null
    if ($gitVersion) {
        Write-Color "[OK] $gitVersion" -Color Green
        $gitInstalled = $true
    }
} catch {
    $gitInstalled = $false
}

if (-not $gitInstalled) {
    Write-Color "Git not found. Installing..." -Color Yellow

    if ($wingetAvailable) {
        Write-Color "Installing Git via winget..." -Color Blue
        & winget install Git.Git --accept-package-agreements --accept-source-agreements
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

        # Verify
        try {
            $gitVersion = git --version 2>$null
            if ($gitVersion) {
                Write-Color "[OK] $gitVersion" -Color Green
            } else {
                throw "still not found"
            }
        } catch {
            Write-Color "Git installed but not in PATH. Restart PowerShell and re-run." -Color Yellow
            exit 1
        }
    } else {
        Write-Color "ERROR: Please install Git from: https://git-scm.com/download/win" -Color Red
        exit 1
    }
}

# ============================================================
# STEP 2: Download RangerChat Lite
# ============================================================
Write-Color "`n------------------------------------------------------------" -Color Cyan
Write-Color "Step 2: Downloading RangerChat Lite" -Color White
Write-Color "------------------------------------------------------------" -Color Cyan

if (Test-Path $InstallDir) {
    Write-Color "RangerChat Lite already exists at: $InstallDir" -Color Yellow

    if (-not $Yes) {
        $response = Read-Host "Update existing installation? (y/n)"
        if ($response -ne 'y' -and $response -ne 'Y') {
            Write-Color "Skipping download, using existing files..." -Color Yellow
        } else {
            Write-Color "Updating..." -Color Blue
            Set-Location $InstallDir
            git pull 2>$null
        }
    }
} else {
    Write-Color "Cloning repository..." -Color Blue

    # Clone with sparse checkout
    $tempDir = "$InstallDir-temp"
    git clone --filter=blob:none --sparse https://github.com/davidtkeane/rangerplex-ai.git $tempDir
    Set-Location $tempDir
    git sparse-checkout set apps/ranger-chat-lite rangerblock/lib

    # Move to final location
    New-Item -ItemType Directory -Force -Path $InstallDir | Out-Null
    Copy-Item -Path "apps\ranger-chat-lite\*" -Destination $InstallDir -Recurse -Force

    # Copy rangerblock lib if needed
    $rangerblockDir = Split-Path $InstallDir -Parent
    $libDir = "$rangerblockDir\rangerblock"
    New-Item -ItemType Directory -Force -Path $libDir | Out-Null
    if (Test-Path "rangerblock\lib") {
        Copy-Item -Path "rangerblock\lib" -Destination $libDir -Recurse -Force
    }

    # Cleanup temp
    Set-Location $env:USERPROFILE
    Remove-Item $tempDir -Recurse -Force -ErrorAction SilentlyContinue

    Write-Color "[OK] Downloaded to: $InstallDir" -Color Green
}

# ============================================================
# STEP 3: Install Dependencies
# ============================================================
Write-Color "`n------------------------------------------------------------" -Color Cyan
Write-Color "Step 3: Installing Dependencies" -Color White
Write-Color "------------------------------------------------------------" -Color Cyan

Set-Location $InstallDir
Write-Color "Running npm install (this may take a minute)..." -Color Blue
npm install

Write-Color "[OK] Dependencies installed" -Color Green

# ============================================================
# STEP 4: Create Helper Scripts
# ============================================================
Write-Color "`n------------------------------------------------------------" -Color Cyan
Write-Color "Step 4: Creating Helper Scripts" -Color White
Write-Color "------------------------------------------------------------" -Color Cyan

# Create start script (batch file)
@"
@echo off
cd /d "%~dp0"
echo Starting RangerChat Lite...
npm run dev
"@ | Out-File -FilePath "$InstallDir\start-chat.bat" -Encoding ASCII

# Create build script (batch file)
@"
@echo off
cd /d "%~dp0"
echo Building RangerChat Lite...
npm run build
echo Build complete! Check the 'release' folder.
pause
"@ | Out-File -FilePath "$InstallDir\build-app.bat" -Encoding ASCII

# Create PowerShell start script
@"
Set-Location `$PSScriptRoot
Write-Host "Starting RangerChat Lite..." -ForegroundColor Cyan
npm run dev
"@ | Out-File -FilePath "$InstallDir\start-chat.ps1" -Encoding UTF8

Write-Color "[OK] Helper scripts created" -Color Green
Write-Color "  - start-chat.bat - Double-click to start" -Color Cyan
Write-Color "  - start-chat.ps1 - PowerShell start script" -Color Cyan
Write-Color "  - build-app.bat  - Build distributable" -Color Cyan

# ============================================================
# INSTALLATION COMPLETE
# ============================================================
Write-Color "`n------------------------------------------------------------" -Color Cyan
Write-Color "[OK] INSTALLATION COMPLETE!" -Color Green
Write-Color "------------------------------------------------------------" -Color Cyan

Write-Color "`nRangerChat Lite has been installed to:" -Color White
Write-Color "  $InstallDir" -Color Cyan

Write-Color "`nTo start the app:" -Color Yellow
Write-Color "  Double-click: start-chat.bat" -Color White
Write-Color "  Or run: cd $InstallDir; npm run dev" -Color White

# Auto-start if requested
if (-not $NoStart) {
    Write-Color "`n------------------------------------------------------------" -Color Cyan
    Write-Color "Starting RangerChat Lite..." -Color White
    Write-Color "------------------------------------------------------------" -Color Cyan

    if ($Build) {
        Write-Color "Building production app..." -Color Blue
        npm run build
        Write-Color "[OK] Build complete! Check the 'release' folder for the app." -Color Green
    } else {
        Write-Color "Starting development server..." -Color Blue
        Write-Color "Press Ctrl+C to stop`n" -Color Yellow
        npm run dev
    }
}

Write-Color "`n===============================================================" -Color Magenta
Write-Color "  Thank you for installing RangerChat Lite!" -Color Green
Write-Color "  Join the RangerBlock network and start chatting." -Color Green
Write-Color "===============================================================" -Color Magenta
Write-Color "  Rangers lead the way!" -Color Cyan
Write-Color ""
