#
# RangerBlock Relay Setup Script for Windows
# ==========================================
# Lightweight relay server for Windows PCs
# Works on Windows 10/11 with PowerShell
#
# Created: November 30, 2025
# Author: David Keane (IrishRanger) + Claude Code (Ranger)
#
# Usage:
#   1. Open PowerShell as Administrator
#   2. Run: Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
#   3. Run: irm https://raw.githubusercontent.com/davidtkeane/rangerplex-ai/main/rangerblock/server-only/setup-windows-relay.ps1 | iex
#
# Options:
#   -WithNgrok      Install ngrok for internet access
#   -NgrokToken     Your ngrok authtoken
#   -MachineName    Name for this machine (e.g., "LenovoWin11", "MSIVector")
#
# Rangers lead the way!

param(
    [switch]$WithNgrok,
    [string]$NgrokToken = "",
    [string]$MachineName = "WindowsPC"
)

$ErrorActionPreference = "Stop"

# Colors for output
function Write-Color {
    param([string]$Text, [string]$Color = "White")
    Write-Host $Text -ForegroundColor $Color
}

# Banner
Clear-Host
Write-Color @"

 ======================================================================
       RANGERBLOCK RELAY SERVER SETUP - WINDOWS EDITION
 ======================================================================
       Lightweight P2P Blockchain Relay Server
       Created by IrishRanger + Claude Code
 ======================================================================

"@ "Cyan"

# =====================================================================
# CHECK NODE.JS
# =====================================================================

Write-Color "`n[1/5] Checking Node.js..." "Yellow"

$nodeVersion = $null
try {
    $nodeVersion = node --version 2>$null
} catch {}

if ($nodeVersion) {
    Write-Color "Node.js already installed: $nodeVersion" "Green"
} else {
    Write-Color "Node.js not found. Installing via winget..." "Yellow"

    try {
        winget install OpenJS.NodeJS.LTS --accept-package-agreements --accept-source-agreements
        Write-Color "Node.js installed! Please restart PowerShell and run this script again." "Green"
        exit 0
    } catch {
        Write-Color "Could not install Node.js automatically." "Red"
        Write-Color "Please download from: https://nodejs.org/" "Yellow"
        exit 1
    }
}

# Check for SoX (voice chat)
Write-Color "`n[1.5/5] Checking SoX (for voice chat)..." "Yellow"

$soxVersion = $null
try {
    $soxVersion = sox --version 2>$null
} catch {}

if ($soxVersion) {
    Write-Color "SoX already installed (voice chat ready)" "Green"
} else {
    Write-Color "SoX not found. Installing via winget..." "Yellow"
    try {
        winget install sox.sox --accept-package-agreements --accept-source-agreements
        Write-Color "SoX installed! Voice chat ready." "Green"
    } catch {
        Write-Color "Could not install SoX automatically." "Yellow"
        Write-Color "For voice chat, download from: https://sox.sourceforge.net/" "Yellow"
        Write-Color "Or run: choco install sox" "Yellow"
    }
}

# Check for ffmpeg (video chat)
Write-Color "`n[1.6/5] Checking ffmpeg (for video chat)..." "Yellow"

$ffmpegVersion = $null
try {
    $ffmpegVersion = ffmpeg -version 2>$null
} catch {}

if ($ffmpegVersion) {
    Write-Color "ffmpeg already installed (video chat ready)" "Green"
} else {
    Write-Color "ffmpeg not found. Installing via winget..." "Yellow"
    try {
        winget install Gyan.FFmpeg --accept-package-agreements --accept-source-agreements
        Write-Color "ffmpeg installed! Video chat ready." "Green"
    } catch {
        Write-Color "Could not install ffmpeg automatically." "Yellow"
        Write-Color "For video chat, download from: https://ffmpeg.org/download.html" "Yellow"
        Write-Color "Or run: choco install ffmpeg" "Yellow"
    }
}

# =====================================================================
# SETUP DIRECTORY
# =====================================================================

Write-Color "`n[2/5] Setting up directory..." "Yellow"

$InstallDir = "$env:USERPROFILE\rangerblock-server"
if (-not (Test-Path $InstallDir)) {
    New-Item -ItemType Directory -Path $InstallDir -Force | Out-Null
}
if (-not (Test-Path "$InstallDir\.personal")) {
    New-Item -ItemType Directory -Path "$InstallDir\.personal" -Force | Out-Null
}

Set-Location $InstallDir
Write-Color "Created: $InstallDir" "Green"

# =====================================================================
# DOWNLOAD FILES
# =====================================================================

Write-Color "`n[3/5] Downloading server files..." "Yellow"

$RepoUrl = "https://raw.githubusercontent.com/davidtkeane/rangerplex-ai/main/rangerblock"

# Download relay server (from core - doesn't need identity)
Write-Color "  Downloading relay-server-bridge.cjs..." "Gray"
Invoke-WebRequest -Uri "$RepoUrl/core/relay-server-bridge.cjs" -OutFile "relay-server.cjs"

# Download chat client (from just-chat - has security features v4.1.0)
Write-Color "  Downloading blockchain-chat.cjs (v4.1.0 with signatures)..." "Gray"
Invoke-WebRequest -Uri "$RepoUrl/just-chat/blockchain-chat.cjs" -OutFile "blockchain-chat.cjs"

# Download ping tool
Write-Color "  Downloading blockchain-ping.cjs..." "Gray"
Invoke-WebRequest -Uri "$RepoUrl/core/blockchain-ping.cjs" -OutFile "blockchain-ping.cjs"

# Download voice chat (from just-chat - uses shared identity)
Write-Color "  Downloading voice-chat.cjs..." "Gray"
Invoke-WebRequest -Uri "$RepoUrl/just-chat/voice-chat.cjs" -OutFile "voice-chat.cjs"

# Download video chat
Write-Color "  Downloading video-chat.cjs..." "Gray"
Invoke-WebRequest -Uri "$RepoUrl/core/video-chat.cjs" -OutFile "video-chat.cjs"

# Download identity registration tool
Write-Color "  Downloading register-identity.cjs..." "Gray"
Invoke-WebRequest -Uri "$RepoUrl/just-chat/register-identity.cjs" -OutFile "register-identity.cjs"

# Download security library (lib folder)
Write-Color "`n[3.5/5] Downloading security library..." "Yellow"
New-Item -ItemType Directory -Path "lib" -Force | Out-Null

Write-Color "  Downloading lib/identity-service.cjs..." "Gray"
Invoke-WebRequest -Uri "$RepoUrl/lib/identity-service.cjs" -OutFile "lib/identity-service.cjs"

Write-Color "  Downloading lib/crypto-utils.cjs..." "Gray"
Invoke-WebRequest -Uri "$RepoUrl/lib/crypto-utils.cjs" -OutFile "lib/crypto-utils.cjs"

Write-Color "  Downloading lib/hardware-id.cjs..." "Gray"
Invoke-WebRequest -Uri "$RepoUrl/lib/hardware-id.cjs" -OutFile "lib/hardware-id.cjs"

Write-Color "  Downloading lib/storage-utils.cjs..." "Gray"
Invoke-WebRequest -Uri "$RepoUrl/lib/storage-utils.cjs" -OutFile "lib/storage-utils.cjs"

Write-Color "  Downloading lib/auth-server.cjs..." "Gray"
Invoke-WebRequest -Uri "$RepoUrl/lib/auth-server.cjs" -OutFile "lib/auth-server.cjs"

Write-Color "Security library downloaded (v5.1.0)" "Green"

# Create package.json
$packageJson = @"
{
  "name": "rangerblock-server",
  "version": "5.1.0",
  "description": "RangerBlock P2P Relay Server - Windows Edition with Security, Voice & Video Chat",
  "main": "relay-server.cjs",
  "scripts": {
    "relay": "node relay-server.cjs",
    "chat": "node blockchain-chat.cjs",
    "voice": "node voice-chat.cjs",
    "video": "node video-chat.cjs",
    "ping": "node blockchain-ping.cjs",
    "register": "node register-identity.cjs",
    "auth": "node lib/auth-server.cjs",
    "ngrok": "ngrok tcp 5555"
  },
  "dependencies": {
    "ws": "^8.18.0",
    "express": "^4.21.0"
  },
  "author": "David Keane (IrishRanger) + Claude Code",
  "license": "MIT"
}
"@
$packageJson | Out-File -FilePath "package.json" -Encoding utf8

# Create node identity
$nodeId = "$MachineName-" + (Get-Random -Maximum 9999).ToString("D4")
$identity = @"
{
  "node_id": "$nodeId",
  "node_type": "peer",
  "node_name": "$MachineName RangerBlock Node",
  "platform": {
    "system": "Windows",
    "machine": "$env:COMPUTERNAME",
    "processor": "$env:PROCESSOR_IDENTIFIER"
  },
  "network": {
    "relay_port": 5555,
    "dashboard_port": 5556
  },
  "created_at": "$(Get-Date -Format 'yyyy-MM-ddTHH:mm:ss')Z",
  "philosophy": "One foot in front of the other",
  "mission": "RangerBlock P2P Network Node"
}
"@
$identity | Out-File -FilePath ".personal\node_identity.json" -Encoding utf8

# Create relay config
$relayConfig = @"
{
  "relay": {
    "name": "$MachineName",
    "port": 5555,
    "dashboardPort": 5556,
    "region": "local"
  },
  "bridge": {
    "enabled": true,
    "reconnectInterval": 5000,
    "heartbeatInterval": 30000,
    "peers": [
      {
        "name": "ngrok-ireland",
        "host": "2.tcp.eu.ngrok.io",
        "port": 12232,
        "enabled": true,
        "comment": "M3Pro Genesis via ngrok"
      },
      {
        "name": "kali-cloud",
        "host": "34.26.30.249",
        "port": 5555,
        "enabled": true,
        "comment": "Google Cloud 24/7 relay"
      }
    ]
  }
}
"@
$relayConfig | Out-File -FilePath "relay-config.json" -Encoding utf8

# Install dependencies
Write-Color "`n  Installing npm dependencies..." "Gray"
npm install --production 2>$null

Write-Color "Files downloaded and configured!" "Green"

# =====================================================================
# INSTALL NGROK (OPTIONAL)
# =====================================================================

if ($WithNgrok) {
    Write-Color "`n[4/5] Installing ngrok..." "Yellow"

    $ngrokPath = Get-Command ngrok -ErrorAction SilentlyContinue
    if ($ngrokPath) {
        Write-Color "ngrok already installed" "Green"
    } else {
        try {
            winget install ngrok.ngrok --accept-package-agreements --accept-source-agreements
            Write-Color "ngrok installed!" "Green"
        } catch {
            Write-Color "Could not install ngrok automatically." "Yellow"
            Write-Color "Download from: https://ngrok.com/download" "Yellow"
        }
    }

    if ($NgrokToken) {
        Write-Color "Configuring ngrok authtoken..." "Cyan"
        ngrok config add-authtoken $NgrokToken
        Write-Color "ngrok configured!" "Green"
    } else {
        Write-Color "Note: Run 'ngrok config add-authtoken YOUR_TOKEN' to configure" "Yellow"
        Write-Color "Get your token at: https://dashboard.ngrok.com/get-started/your-authtoken" "Yellow"
    }
} else {
    Write-Color "`n[4/5] Skipping ngrok (use -WithNgrok to install)" "Yellow"
}

# =====================================================================
# CREATE SHORTCUTS
# =====================================================================

Write-Color "`n[5/5] Creating shortcuts..." "Yellow"

# Create batch files for easy launching
@"
@echo off
cd /d "%~dp0"
echo Starting RangerBlock Relay Server...
node relay-server.cjs
pause
"@ | Out-File -FilePath "Start-Relay.bat" -Encoding ascii

@"
@echo off
cd /d "%~dp0"
echo Starting RangerBlock Chat Client...
node blockchain-chat.cjs
pause
"@ | Out-File -FilePath "Start-Chat.bat" -Encoding ascii

@"
@echo off
cd /d "%~dp0"
echo Starting RangerBlock Voice Chat...
echo Requires SoX - install via: winget install sox.sox
echo.
node voice-chat.cjs
pause
"@ | Out-File -FilePath "Start-Voice.bat" -Encoding ascii

@"
@echo off
cd /d "%~dp0"
echo Starting RangerBlock Video Chat...
echo Requires ffmpeg - install via: winget install Gyan.FFmpeg
echo Requires SoX for audio - install via: winget install sox.sox
echo.
node video-chat.cjs
pause
"@ | Out-File -FilePath "Start-Video.bat" -Encoding ascii

if ($WithNgrok) {
@"
@echo off
cd /d "%~dp0"
echo Starting ngrok tunnel...
echo Your public URL will appear below
ngrok tcp 5555
"@ | Out-File -FilePath "Start-ngrok.bat" -Encoding ascii
}

Write-Color "Shortcuts created!" "Green"

# =====================================================================
# DONE!
# =====================================================================

$externalIP = (Invoke-WebRequest -Uri "https://ifconfig.me" -UseBasicParsing).Content.Trim()

Write-Color @"

 ======================================================================
                    SETUP COMPLETE!
 ======================================================================

  Machine Name: $MachineName
  Node ID:      $nodeId
  Install Dir:  $InstallDir
  External IP:  $externalIP

  COMMANDS:
    npm run relay     - Start relay server
    npm run chat      - Terminal chat client
    npm run voice     - Voice chat (requires SoX)
    npm run video     - Video chat (requires ffmpeg + SoX)
    npm run ping      - Test connectivity

  BATCH FILES:
    Start-Relay.bat   - Double-click to start relay
    Start-Chat.bat    - Double-click to start chat
    Start-Voice.bat   - Double-click for voice chat
    Start-Video.bat   - Double-click for video chat

  FIREWALL (run as Administrator):
    netsh advfirewall firewall add rule name="RangerBlock" dir=in action=allow protocol=TCP localport=5555,5556

"@ "Cyan"

if ($WithNgrok) {
    Write-Color @"
  NGROK:
    npm run ngrok     - Start ngrok tunnel
    Start-ngrok.bat   - Double-click to start tunnel

"@ "Yellow"
}

Write-Color "  Rangers lead the way!" "Green"
Write-Color ""
