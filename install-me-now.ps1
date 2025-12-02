# RangerPlex AI Installer for Windows (PowerShell)
# Version: 2.5.33
# One-command setup for Windows. Installs Node.js 22, PM2, npm deps, and guides API key setup.
#
# USAGE: Right-click PowerShell -> Run as Administrator (if needed)
#        Or: Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy Bypass
#        Then: .\install-me-now.ps1

$ErrorActionPreference = "Continue"
$Host.UI.RawUI.WindowTitle = "RangerPlex AI Installer"

# Colors
function Write-Step { param($msg) Write-Host "[>] " -ForegroundColor Cyan -NoNewline; Write-Host $msg }
function Write-Ok { param($msg) Write-Host "[OK] " -ForegroundColor Green -NoNewline; Write-Host $msg }
function Write-Warn { param($msg) Write-Host "[!] " -ForegroundColor Yellow -NoNewline; Write-Host $msg }
function Write-Fail { param($msg) Write-Host "[X] " -ForegroundColor Red -NoNewline; Write-Host $msg }

function Show-Banner {
    $cyan = "Cyan"
    $green = "Green"
    $yellow = "Yellow"

    Write-Host ""
    Write-Host "=======================================================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  RANGERPLEX AI - Multi-AI Command Center" -ForegroundColor Green
    Write-Host ""
    Write-Host "       Gemini - Claude - GPT - Grok - Perplexity" -ForegroundColor DarkGray
    Write-Host "       Ollama - LM Studio - HuggingFace - Brave" -ForegroundColor DarkGray
    Write-Host ""
    Write-Host "=======================================================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Thank you for downloading RangerPlex AI!" -ForegroundColor Green
    Write-Host ""
    Write-Host "This installer will guide you through:" -ForegroundColor DarkGray
    Write-Host "  * Node.js 22.x setup (via winget or manual)" -ForegroundColor Cyan
    Write-Host "  * PM2 process manager (zero-downtime updates!)" -ForegroundColor Cyan
    Write-Host "  * Docker Desktop (WordPress hosting + containers!)" -ForegroundColor Cyan
    Write-Host "  * Ollama & LM Studio (optional local AI)" -ForegroundColor Cyan
    Write-Host "  * API key collection for cloud providers" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Documentation:" -ForegroundColor Yellow
    Write-Host "  * Type /manual in chat for the complete user guide" -ForegroundColor Cyan
    Write-Host "  * Or read: rangerplex_manual.md in project folder" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Let's get started!" -ForegroundColor Green
    Write-Host ""
}

function Show-PreflightDownloads {
    Write-Host ""
    Write-Host "Preflight Downloads (optional)" -ForegroundColor Cyan
    Write-Host "If you want, download/install these now, then re-run this script:" -ForegroundColor DarkGray
    Write-Host ""
    Write-Host "  * Docker Desktop: " -NoNewline; Write-Host "https://desktop.docker.com/win/main/amd64/Docker%20Desktop%20Installer.exe" -ForegroundColor Green
    Write-Host "  * Ollama:         " -NoNewline; Write-Host "https://ollama.com/download/windows" -ForegroundColor Green
    Write-Host "  * LM Studio:      " -NoNewline; Write-Host "https://lmstudio.ai/download" -ForegroundColor Green
    Write-Host "  * Node.js 22:     " -NoNewline; Write-Host "https://nodejs.org/dist/v22.11.0/node-v22.11.0-x64.msi" -ForegroundColor Green
    Write-Host ""

    $ans = Read-Host "Exit now to install these and rerun the script? (y/N)"
    if ($ans -match "^[Yy]") {
        Write-Host "Opening download pages..." -ForegroundColor DarkGray
        Start-Process "https://nodejs.org/en/download/"
        Start-Process "https://www.docker.com/products/docker-desktop/"
        Start-Process "https://ollama.com/download/windows"
        Write-Host "Okay! Download/install the apps above, then re-run install-me-now.ps1" -ForegroundColor DarkGray
        exit 0
    }
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

function Install-NodeJS {
    Write-Step "Checking Node.js..."

    if (Test-Command "node") {
        $nodeVersion = & node -v 2>$null
        $majorVersion = [int]($nodeVersion -replace 'v(\d+)\..*', '$1')

        if ($majorVersion -eq 22) {
            Write-Ok "Node.js $nodeVersion detected (meets requirement)."
            return $true
        } elseif ($majorVersion -ge 25) {
            Write-Fail "Node.js $nodeVersion detected - TOO NEW!"
            Write-Host "  Node v25+ breaks native modules (better-sqlite3)." -ForegroundColor Red
            Write-Host "  Please downgrade to Node v22." -ForegroundColor DarkGray
        } else {
            Write-Warn "Node.js $nodeVersion detected; v22.x is recommended."
        }
    }

    Write-Host ""
    Write-Host "Node.js 22 is required. Install options:" -ForegroundColor Yellow
    Write-Host "  1. Download from: https://nodejs.org/dist/v22.11.0/node-v22.11.0-x64.msi" -ForegroundColor Cyan
    Write-Host "  2. Use winget: winget install OpenJS.NodeJS.LTS" -ForegroundColor Cyan
    Write-Host "  3. Use nvm-windows: https://github.com/coreybutler/nvm-windows" -ForegroundColor Cyan
    Write-Host ""

    # Try winget if available
    if (Test-Command "winget") {
        $install = Read-Host "Install Node.js 22 via winget? (y/N)"
        if ($install -match "^[Yy]") {
            Write-Step "Installing Node.js via winget..."
            & winget install OpenJS.NodeJS.LTS --accept-package-agreements --accept-source-agreements

            # Refresh PATH
            $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

            if (Test-Command "node") {
                Write-Ok "Node.js installed successfully!"
                return $true
            }
        }
    }

    # Open download page
    $open = Read-Host "Open Node.js download page in browser? (y/N)"
    if ($open -match "^[Yy]") {
        Start-Process "https://nodejs.org/en/download/"
        Write-Host "Please install Node.js 22, then re-run this script." -ForegroundColor DarkGray
        exit 0
    }

    return $false
}

function Install-PM2 {
    Write-Step "Checking PM2..."

    if (Test-Command "pm2") {
        $pm2Version = & pm2 -v 2>$null
        Write-Ok "PM2 already installed (v$pm2Version)."
        return $true
    }

    Write-Warn "PM2 not found. Installing globally..."
    & npm install -g pm2

    if ($LASTEXITCODE -eq 0) {
        Write-Ok "PM2 installed successfully!"
        return $true
    } else {
        Write-Warn "PM2 global install failed. It will be available via npm scripts."
        return $false
    }
}

function Check-Ollama {
    Write-Step "Checking Ollama (optional local AI)..."

    if (Test-Command "ollama") {
        $ollamaVersion = & ollama --version 2>$null
        Write-Ok "Ollama already installed."
        return
    }

    Write-Host ""
    Write-Warn "Ollama not detected. Ollama enables local AI models (Llama, Mistral, etc.)."
    Write-Host "  Ollama is OPTIONAL - RangerPlex works with cloud models too." -ForegroundColor DarkGray
    Write-Host ""

    $install = Read-Host "Install Ollama now? (y/N)"
    if ($install -match "^[Yy]") {
        Write-Host "Opening Ollama download page..." -ForegroundColor DarkGray
        Start-Process "https://ollama.com/download/windows"
        Write-Host "Download and run the installer, then continue." -ForegroundColor DarkGray
    } else {
        Write-Host "Skipped Ollama. Install later from: https://ollama.com" -ForegroundColor DarkGray
    }
}

function Check-Docker {
    Write-Step "Checking Docker (optional container support)..."

    if (Test-Command "docker") {
        $dockerVersion = & docker --version 2>$null
        Write-Ok "Docker already installed ($dockerVersion)."
        return
    }

    Write-Host ""
    Write-Warn "Docker not detected. Docker enables WordPress hosting and containers."
    Write-Host "  Docker is OPTIONAL but HIGHLY RECOMMENDED for WordPress integration." -ForegroundColor DarkGray
    Write-Host ""

    $install = Read-Host "Install Docker Desktop now? (y/N)"
    if ($install -match "^[Yy]") {
        Write-Host "Opening Docker Desktop download page..." -ForegroundColor DarkGray
        Start-Process "https://desktop.docker.com/win/main/amd64/Docker%20Desktop%20Installer.exe"
        Write-Host ""
        Write-Host "Docker Desktop includes:" -ForegroundColor Cyan
        Write-Host "  * Docker Engine (daemon)" -ForegroundColor DarkGray
        Write-Host "  * Docker CLI (docker command)" -ForegroundColor DarkGray
        Write-Host "  * Docker Compose" -ForegroundColor DarkGray
        Write-Host "  * WSL 2 integration" -ForegroundColor DarkGray
        Write-Host ""
        Write-Host "Run the installer, restart if needed, then continue." -ForegroundColor DarkGray
    } else {
        Write-Host "Skipped Docker. Install later from: https://www.docker.com/get-started/" -ForegroundColor DarkGray
    }
}

function Install-Dependencies {
    param($projectRoot)

    Write-Step "Installing npm dependencies..."

    Set-Location $projectRoot

    # Check for existing node_modules
    if (Test-Path "node_modules") {
        $reinstall = Read-Host "Existing node_modules detected. Reinstall? (y/N)"
        if ($reinstall -match "^[Yy]") {
            Write-Host "Removing old node_modules..." -ForegroundColor DarkGray
            Remove-Item -Recurse -Force "node_modules" -ErrorAction SilentlyContinue
        }
    }

    Write-Host "Running npm install (this may take a few minutes)..." -ForegroundColor DarkGray
    & npm install

    if ($LASTEXITCODE -eq 0) {
        Write-Ok "Dependencies installed successfully!"

        # Rebuild native modules
        Write-Step "Rebuilding native modules..."
        & npm rebuild 2>$null
        Write-Ok "Native modules rebuilt."
        return $true
    } else {
        Write-Fail "npm install failed!"
        Write-Host "Try: Remove-Item -Recurse node_modules; npm install" -ForegroundColor DarkGray
        return $false
    }
}

function Collect-APIKeys {
    param($projectRoot)

    $envFile = Join-Path $projectRoot ".env"

    # Backup existing .env
    if (Test-Path $envFile) {
        $backupName = ".env.bak." + (Get-Date -Format "yyyyMMddHHmmss")
        Copy-Item $envFile (Join-Path $projectRoot $backupName)
        Write-Warn "Backed up existing .env to $backupName"
    }

    Write-Host ""
    Write-Host "============================================================" -ForegroundColor Cyan
    Write-Host "           API Dashboard Links (Clickable)" -ForegroundColor White
    Write-Host "============================================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "AI Providers (ESSENTIAL - Need at least ONE):" -ForegroundColor Yellow
    Write-Host "  * Google AI Studio:  https://aistudio.google.com/" -ForegroundColor Green
    Write-Host "  * OpenAI Platform:   https://platform.openai.com/" -ForegroundColor Green
    Write-Host "  * Anthropic Console: https://console.anthropic.com/" -ForegroundColor Green
    Write-Host ""
    Write-Host "Search & Intelligence (OPTIONAL):" -ForegroundColor Yellow
    Write-Host "  * Perplexity:        https://www.perplexity.ai/" -ForegroundColor DarkGray
    Write-Host "  * Brave Search:      https://api-dashboard.search.brave.com/" -ForegroundColor DarkGray
    Write-Host "  * xAI Grok:          https://console.x.ai/" -ForegroundColor DarkGray
    Write-Host ""
    Write-Host "Local AI (NO API KEY NEEDED):" -ForegroundColor Yellow
    Write-Host "  * Ollama:            https://ollama.com/download/windows" -ForegroundColor Green
    Write-Host "  * LM Studio:         https://lmstudio.ai/" -ForegroundColor Green
    Write-Host ""
    Write-Host "============================================================" -ForegroundColor Cyan
    Write-Host ""

    $providers = @(
        @{ Name = "Gemini (Google AI)"; Var = "VITE_GEMINI_API_KEY"; Url = "https://aistudio.google.com/app/apikey"; Priority = "ESSENTIAL" },
        @{ Name = "OpenAI (GPT-4)"; Var = "VITE_OPENAI_API_KEY"; Url = "https://platform.openai.com/api-keys"; Priority = "ESSENTIAL" },
        @{ Name = "Anthropic (Claude)"; Var = "VITE_ANTHROPIC_API_KEY"; Url = "https://console.anthropic.com/settings/keys"; Priority = "ESSENTIAL" },
        @{ Name = "Perplexity"; Var = "VITE_PERPLEXITY_API_KEY"; Url = "https://www.perplexity.ai/settings/api"; Priority = "OPTIONAL" },
        @{ Name = "Brave Search"; Var = "VITE_BRAVE_SEARCH_API_KEY"; Url = "https://api-dashboard.search.brave.com/"; Priority = "OPTIONAL" },
        @{ Name = "Hugging Face"; Var = "VITE_HUGGINGFACE_ACCESS_TOKEN"; Url = "https://huggingface.co/settings/tokens"; Priority = "OPTIONAL" },
        @{ Name = "xAI Grok"; Var = "VITE_GROK_API_KEY"; Url = "https://console.x.ai/"; Priority = "OPTIONAL" },
        @{ Name = "ElevenLabs (Voice)"; Var = "VITE_ELEVENLABS_API_KEY"; Url = "https://elevenlabs.io/app/speech-synthesis"; Priority = "OPTIONAL" }
    )

    Write-Step "API key setup (press ENTER to skip any provider)."
    Write-Host "Tip: At minimum, add ONE of: Gemini, OpenAI, or Claude." -ForegroundColor DarkGray
    Write-Host ""

    $envContent = @()
    if (Test-Path $envFile) {
        $envContent = Get-Content $envFile | Where-Object { $_ -notmatch "^VITE_" }
    }

    foreach ($provider in $providers) {
        Write-Host ""
        if ($provider.Priority -eq "ESSENTIAL") {
            Write-Host "$($provider.Name) [$($provider.Priority)]" -ForegroundColor Green -NoNewline
        } else {
            Write-Host "$($provider.Name) [$($provider.Priority)]" -ForegroundColor White -NoNewline
        }
        Write-Host " - $($provider.Url)" -ForegroundColor DarkGray

        $key = Read-Host "Paste API key for $($provider.Name) (or leave blank to skip)"

        if ($key) {
            $key = $key.Trim().Trim('"').Trim("'")

            # Show masked preview
            $preview = if ($key.Length -le 12) {
                $key.Substring(0,4) + "****" + $key.Substring($key.Length-4)
            } else {
                $key.Substring(0,8) + "..." + $key.Substring($key.Length-4)
            }

            Write-Host "Preview: $preview" -ForegroundColor DarkGray
            $confirm = Read-Host "Is this key correct? (Y/n)"

            if ($confirm -notmatch "^[Nn]") {
                $envContent += "$($provider.Var)=$key"
                Write-Ok "Saved $($provider.Var)"
            } else {
                Write-Warn "Key discarded."
            }
        } else {
            if ($provider.Priority -eq "ESSENTIAL") {
                Write-Warn "Skipped $($provider.Name). You'll need at least one AI provider!"
            } else {
                Write-Host "Skipped $($provider.Name)." -ForegroundColor DarkGray
            }
        }
    }

    # Write .env file
    $envContent | Out-File -FilePath $envFile -Encoding UTF8
    Write-Ok "API keys saved to .env"
}

function Start-RangerPlex {
    param($projectRoot)

    Write-Host ""
    Write-Host "============================================================" -ForegroundColor Green
    Write-Host "      INSTALLATION COMPLETE! RANGERS READY!" -ForegroundColor Green
    Write-Host "============================================================" -ForegroundColor Green
    Write-Host ""
    Write-Ok "RangerPlex AI is ready to deploy!"
    Write-Host ""
    Write-Host "Quick Reference:" -ForegroundColor Yellow
    Write-Host "  * Type /manual in chat for complete user guide" -ForegroundColor Cyan
    Write-Host "  * Read rangerplex_manual.md for detailed documentation" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "PM2 COMMANDS:" -ForegroundColor Cyan
    Write-Host "  npm run pm2:start    -> Start RangerPlex" -ForegroundColor DarkGray
    Write-Host "  npm run pm2:stop     -> Stop all servers" -ForegroundColor DarkGray
    Write-Host "  npm run pm2:status   -> Check server status" -ForegroundColor DarkGray
    Write-Host "  npm run pm2:logs     -> View real-time logs" -ForegroundColor DarkGray
    Write-Host ""
    Write-Host "BROWSER ACCESS:" -ForegroundColor Cyan
    Write-Host "  http://localhost:5173" -ForegroundColor Green
    Write-Host ""

    $startNow = Read-Host "Start RangerPlex now? (Y/n)"

    if ($startNow -notmatch "^[Nn]") {
        Write-Step "Starting RangerPlex with PM2..."
        Set-Location $projectRoot
        & npm run pm2:start

        if ($LASTEXITCODE -eq 0) {
            Write-Host ""
            Write-Host "============================================================" -ForegroundColor Green
            Write-Host "              RANGERPLEX IS LIVE!" -ForegroundColor Green
            Write-Host "============================================================" -ForegroundColor Green
            Write-Host ""
            Write-Ok "Servers are running in background via PM2!"
            Write-Host ""
            Write-Host "Open in browser: " -NoNewline; Write-Host "http://localhost:5173" -ForegroundColor Cyan
            Write-Host ""
            Write-Host "You can close this terminal - servers will keep running!" -ForegroundColor DarkGray
            Write-Host "  View logs: npm run pm2:logs" -ForegroundColor DarkGray
            Write-Host "  Stop servers: npm run pm2:stop" -ForegroundColor DarkGray
            Write-Host ""

            # Try to open browser
            Start-Process "http://localhost:5173"
        } else {
            Write-Warn "PM2 start had issues. Try: npm run pm2:start"
            Write-Host "Or fallback to: npm start" -ForegroundColor DarkGray
        }
    } else {
        Write-Host ""
        Write-Ok "Skipped auto-start. Ready when you are!"
        Write-Host ""
        Write-Host "To start RangerPlex:" -ForegroundColor Yellow
        Write-Host "  npm run pm2:start  (recommended - background daemon)" -ForegroundColor Cyan
        Write-Host ""
    }

    Write-Host ""
    Write-Host "Rangers lead the way!" -ForegroundColor Green
    Write-Host ""
}

# ========================================
# MAIN EXECUTION
# ========================================

Clear-Host
Show-Banner
Show-PreflightDownloads

$projectRoot = Get-ProjectRoot

# Check for package.json
if (-not (Test-Path (Join-Path $projectRoot "package.json"))) {
    Write-Fail "Run this script from the project root (package.json not found)."
    Write-Host "Current directory: $projectRoot" -ForegroundColor DarkGray
    exit 1
}

Write-Host "Project root: $projectRoot" -ForegroundColor DarkGray
Write-Host ""

# Step 1: Node.js
$skipNode = Read-Host "Skip Node.js setup? (y/N)"
if ($skipNode -notmatch "^[Yy]") {
    Install-NodeJS
}

# Step 2: PM2
$skipPM2 = Read-Host "Skip PM2 installation? (y/N)"
if ($skipPM2 -notmatch "^[Yy]") {
    Install-PM2
}

# Step 3: Ollama
$skipOllama = Read-Host "Skip Ollama check? (y/N)"
if ($skipOllama -notmatch "^[Yy]") {
    Check-Ollama
}

# Step 4: Docker
$skipDocker = Read-Host "Skip Docker check? (y/N)"
if ($skipDocker -notmatch "^[Yy]") {
    Check-Docker
}

# Step 5: Dependencies
$skipDeps = Read-Host "Skip dependency installation? (y/N)"
if ($skipDeps -notmatch "^[Yy]") {
    Install-Dependencies -projectRoot $projectRoot
}

# Step 6: API Keys
$skipKeys = Read-Host "Skip API key setup? (y/N)"
if ($skipKeys -notmatch "^[Yy]") {
    Collect-APIKeys -projectRoot $projectRoot
}

# Final: Start
Start-RangerPlex -projectRoot $projectRoot
