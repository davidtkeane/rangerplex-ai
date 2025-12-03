#
# RangerChat Lite Installer for Windows
# https://github.com/davidtkeane/rangerplex-ai
#
# Usage: irm https://raw.githubusercontent.com/davidtkeane/rangerplex-ai/main/apps/ranger-chat-lite/scripts/install.ps1 | iex
#

$ErrorActionPreference = "Stop"

$REPO = "davidtkeane/rangerplex-ai"
$APP_NAME = "RangerChat Lite"

# ASCII Art Header
Write-Host @"

 ╔════════════════════════════════════════════════════════════╗
 ║                                                            ║
 ║   ██████╗  █████╗ ███╗   ██╗ ██████╗ ███████╗██████╗       ║
 ║   ██╔══██╗██╔══██╗████╗  ██║██╔════╝ ██╔════╝██╔══██╗      ║
 ║   ██████╔╝███████║██╔██╗ ██║██║  ███╗█████╗  ██████╔╝      ║
 ║   ██╔══██╗██╔══██║██║╚██╗██║██║   ██║██╔══╝  ██╔══██╗      ║
 ║   ██║  ██║██║  ██║██║ ╚████║╚██████╔╝███████╗██║  ██║      ║
 ║   ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝ ╚═════╝ ╚══════╝╚═╝  ╚═╝      ║
 ║                                                            ║
 ║                    CHAT LITE INSTALLER                     ║
 ║                                                            ║
 ╚════════════════════════════════════════════════════════════╝

"@ -ForegroundColor Cyan

Write-Host "Detecting system..." -ForegroundColor Yellow
Write-Host "  OS: Windows"
Write-Host "  Architecture: x64"

# Get latest release
Write-Host "`nFetching latest release..." -ForegroundColor Yellow

try {
    $releases = Invoke-RestMethod -Uri "https://api.github.com/repos/$REPO/releases"

    # Find ranger-chat-lite release
    $latestRelease = $releases | Where-Object { $_.tag_name -like "ranger-chat-lite-v*" } | Select-Object -First 1

    if (-not $latestRelease) {
        $latestRelease = $releases | Select-Object -First 1
    }

    if (-not $latestRelease) {
        throw "No releases found"
    }

    $VERSION = $latestRelease.tag_name -replace "ranger-chat-lite-v", ""
    Write-Host "  Latest version: $VERSION"
} catch {
    Write-Host "Error: Could not fetch release information" -ForegroundColor Red
    Write-Host "Please visit https://github.com/$REPO/releases to download manually."
    exit 1
}

# Find Windows installer asset
$installerAsset = $latestRelease.assets | Where-Object { $_.name -like "*win*x64*.exe" -and $_.name -notlike "*portable*" } | Select-Object -First 1

if (-not $installerAsset) {
    # Try portable version
    $installerAsset = $latestRelease.assets | Where-Object { $_.name -like "*win*.exe" } | Select-Object -First 1
}

if (-not $installerAsset) {
    Write-Host "Error: Could not find Windows installer in release" -ForegroundColor Red
    Write-Host "Please visit https://github.com/$REPO/releases to download manually."
    exit 1
}

$DOWNLOAD_URL = $installerAsset.browser_download_url
$DOWNLOAD_FILE = $installerAsset.name

Write-Host "`nDownloading $DOWNLOAD_FILE..." -ForegroundColor Yellow

# Create temp directory
$TEMP_DIR = Join-Path $env:TEMP "RangerChatLiteInstall"
New-Item -ItemType Directory -Force -Path $TEMP_DIR | Out-Null
$INSTALLER_PATH = Join-Path $TEMP_DIR $DOWNLOAD_FILE

try {
    # Download with progress
    $webClient = New-Object System.Net.WebClient
    $webClient.DownloadFile($DOWNLOAD_URL, $INSTALLER_PATH)

    Write-Host "Download complete!" -ForegroundColor Green
} catch {
    Write-Host "Error: Download failed" -ForegroundColor Red
    Write-Host $_.Exception.Message
    exit 1
}

# Verify download
if (-not (Test-Path $INSTALLER_PATH)) {
    Write-Host "Error: Downloaded file not found" -ForegroundColor Red
    exit 1
}

$fileSize = (Get-Item $INSTALLER_PATH).Length / 1MB
Write-Host "  Downloaded: $([math]::Round($fileSize, 2)) MB"

# Run installer
Write-Host "`nLaunching installer..." -ForegroundColor Yellow
Write-Host "Please follow the installation prompts."

try {
    Start-Process -FilePath $INSTALLER_PATH -Wait
    Write-Host "`nInstallation complete!" -ForegroundColor Green
} catch {
    Write-Host "Error: Installation failed" -ForegroundColor Red
    Write-Host $_.Exception.Message
    exit 1
}

# Cleanup
Write-Host "`nCleaning up..." -ForegroundColor Yellow
Remove-Item -Recurse -Force $TEMP_DIR -ErrorAction SilentlyContinue

Write-Host @"

═══════════════════════════════════════════════════════════════
"@ -ForegroundColor Cyan

Write-Host "Thank you for installing RangerChat Lite!" -ForegroundColor Green
Write-Host "You can find it in your Start Menu or Desktop."
Write-Host "Join the RangerPlex network and start chatting."

Write-Host @"
═══════════════════════════════════════════════════════════════
"@ -ForegroundColor Cyan

# Offer to launch
$launch = Read-Host "`nWould you like to launch RangerChat Lite now? (Y/n)"
if ($launch -ne "n" -and $launch -ne "N") {
    $appPath = Join-Path $env:LOCALAPPDATA "Programs\RangerChat Lite\RangerChat Lite.exe"
    if (Test-Path $appPath) {
        Start-Process $appPath
    } else {
        # Try common install locations
        $possiblePaths = @(
            "C:\Program Files\RangerChat Lite\RangerChat Lite.exe",
            "C:\Program Files (x86)\RangerChat Lite\RangerChat Lite.exe",
            "$env:LOCALAPPDATA\RangerChat Lite\RangerChat Lite.exe"
        )
        foreach ($path in $possiblePaths) {
            if (Test-Path $path) {
                Start-Process $path
                break
            }
        }
    }
}
