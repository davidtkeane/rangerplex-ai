# RangerPlex AI Installer for Windows (PowerShell)
# Version: 2.5.34
# One-command setup for Windows. Installs Node.js 22, PM2, npm deps, and guides API key setup.
#
# USAGE: Right-click PowerShell -> Run as Administrator
#        Or: .\install-me-now.ps1 (will auto-elevate if needed)

$ErrorActionPreference = "Continue"
$Host.UI.RawUI.WindowTitle = "RangerPlex AI Installer"

# Check if running as Administrator and offer to elevate
function Test-AdminEarly {
    $currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

if (-not (Test-AdminEarly)) {
    Write-Host ""
    Write-Host "============================================================" -ForegroundColor Yellow
    Write-Host "  NOT RUNNING AS ADMINISTRATOR" -ForegroundColor Yellow
    Write-Host "============================================================" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "This installer works best with Administrator privileges." -ForegroundColor Cyan
    Write-Host "nvm-windows requires admin to switch Node versions." -ForegroundColor Cyan
    Write-Host ""

    $elevate = Read-Host "Restart as Administrator? (Y/n)"
    if ($elevate -notmatch "^[Nn]") {
        Write-Host ""
        Write-Host "Restarting as Administrator..." -ForegroundColor Green

        # Get the script path
        $scriptPath = $PSCommandPath
        if (-not $scriptPath) {
            $scriptPath = $MyInvocation.MyCommand.Path
        }
        if (-not $scriptPath) {
            $scriptPath = Join-Path (Get-Location) "install-me-now.ps1"
        }

        # Relaunch as admin
        Start-Process powershell.exe -ArgumentList "-ExecutionPolicy Bypass -File `"$scriptPath`"" -Verb RunAs
        Write-Host ""
        Write-Host "A new Administrator window should open." -ForegroundColor Cyan
        Write-Host "Please continue the installation there." -ForegroundColor Cyan
        Write-Host ""
        exit 0
    } else {
        Write-Host ""
        Write-Warn "Continuing without admin. Some features may fail."
        Write-Host ""
    }
}

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

function Refresh-Path {
    # Refresh PATH from registry
    $machinePath = [System.Environment]::GetEnvironmentVariable("Path", "Machine")
    $userPath = [System.Environment]::GetEnvironmentVariable("Path", "User")
    $env:Path = "$machinePath;$userPath"

    # Also add common nvm-windows paths directly
    $nvmHome = "$env:APPDATA\nvm"
    $nvmSymlink = "$env:ProgramFiles\nodejs"

    if ($nvmHome -and ($env:Path -notlike "*$nvmHome*")) {
        $env:Path = "$nvmHome;$env:Path"
    }
    if ($nvmSymlink -and ($env:Path -notlike "*$nvmSymlink*")) {
        $env:Path = "$nvmSymlink;$env:Path"
    }

    # Set NVM_HOME and NVM_SYMLINK if not set
    if (-not $env:NVM_HOME) {
        $env:NVM_HOME = $nvmHome
    }
    if (-not $env:NVM_SYMLINK) {
        $env:NVM_SYMLINK = $nvmSymlink
    }
}

function Test-NvmWindows {
    # Refresh PATH first
    Refresh-Path

    # Check multiple locations for nvm
    $nvmExe = "$env:APPDATA\nvm\nvm.exe"
    if (Test-Path $nvmExe) {
        return $true
    }

    # Check if nvm command works
    try {
        $nvmOut = & "$env:APPDATA\nvm\nvm.exe" version 2>$null
        if ($nvmOut) { return $true }
    } catch {}

    try {
        $nvmOut = & nvm version 2>$null
        if ($nvmOut) { return $true }
    } catch {}

    return $false
}

function Run-Nvm {
    param($arguments)

    $nvmExe = "$env:APPDATA\nvm\nvm.exe"
    if (Test-Path $nvmExe) {
        $argArray = $arguments -split ' '
        & $nvmExe $argArray
        return $LASTEXITCODE -eq 0
    }

    # Fallback to nvm in PATH
    try {
        $argArray = $arguments -split ' '
        & nvm $argArray
        return $LASTEXITCODE -eq 0
    } catch {
        return $false
    }
}

function Install-NvmWindows {
    Write-Host ""
    Write-Host "============================================================" -ForegroundColor Cyan
    Write-Host "  Installing nvm-windows (Node Version Manager)" -ForegroundColor Cyan
    Write-Host "============================================================" -ForegroundColor Cyan
    Write-Host ""

    if (-not (Test-Command "winget")) {
        Write-Fail "winget is not available!"
        Write-Host ""
        Write-Host "Please install nvm-windows manually:" -ForegroundColor Yellow
        Write-Host "  1. Download from: https://github.com/coreybutler/nvm-windows/releases/latest" -ForegroundColor Cyan
        Write-Host "  2. Run nvm-setup.exe" -ForegroundColor Cyan
        Write-Host "  3. Close and reopen PowerShell" -ForegroundColor Cyan
        Write-Host "  4. Re-run this script" -ForegroundColor Cyan
        Write-Host ""
        Start-Process "https://github.com/coreybutler/nvm-windows/releases/latest"
        Read-Host "Press ENTER to exit"
        exit 1
    }

    Write-Step "Installing nvm-windows via winget..."
    & winget install CoreyButler.NVMforWindows --accept-package-agreements --accept-source-agreements

    # Wait for install to complete
    Start-Sleep -Seconds 3

    # Refresh PATH
    Refresh-Path

    # Check if it worked
    if (Test-NvmWindows) {
        Write-Ok "nvm-windows installed successfully!"
        return $true
    } else {
        Write-Warn "nvm-windows installed but not in PATH yet."
        return $false
    }
}

function Test-Admin {
    $currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

function Install-Node22-Via-Nvm {
    Write-Host ""
    Write-Step "Installing Node.js 22 via nvm..."

    # Check if running as admin (required for nvm use to create symlinks)
    $isAdmin = Test-Admin
    if (-not $isAdmin) {
        Write-Warn "Not running as Administrator!"
        Write-Host "  nvm use requires admin privileges to create symlinks." -ForegroundColor DarkGray
        Write-Host "  Will attempt anyway, but may need to restart as Admin." -ForegroundColor DarkGray
        Write-Host ""
    }

    # Try to run nvm install 22
    $nvmExe = "$env:APPDATA\nvm\nvm.exe"

    if (Test-Path $nvmExe) {
        Write-Host "  Found nvm at: $nvmExe" -ForegroundColor DarkGray
        Write-Host ""

        Write-Host "  Running: nvm install 22" -ForegroundColor Cyan
        $installOutput = & $nvmExe install 22 2>&1
        Write-Host $installOutput
        Start-Sleep -Seconds 3

        Write-Host ""
        Write-Host "  Running: nvm use 22" -ForegroundColor Cyan
        $useOutput = & $nvmExe use 22 2>&1
        Write-Host $useOutput
        Start-Sleep -Seconds 2

        # Check if nvm use failed due to permissions
        if ($useOutput -match "exit status 1|Access is denied|permission") {
            Write-Warn "nvm use failed - need Administrator privileges!"
            Write-Host ""

            if (-not $isAdmin) {
                Write-Host "Restarting script as Administrator..." -ForegroundColor Yellow
                $scriptPath = $PSCommandPath
                if (-not $scriptPath) {
                    $scriptPath = Join-Path (Get-ProjectRoot) "install-me-now.ps1"
                }

                Start-Process powershell.exe -ArgumentList "-ExecutionPolicy Bypass -File `"$scriptPath`"" -Verb RunAs
                Write-Host ""
                Write-Host "A new Administrator window should open." -ForegroundColor Cyan
                Write-Host "Please continue the installation there." -ForegroundColor Cyan
                Write-Host ""
                Read-Host "Press ENTER to exit this window"
                exit 0
            }
        }

        # Refresh PATH to pick up new Node
        Refresh-Path

        # Also try to find node in nvm's directory
        $nvmNodePath = "$env:APPDATA\nvm\v22*"
        $nodeDirs = Get-ChildItem -Path "$env:APPDATA\nvm" -Directory -Filter "v22*" -ErrorAction SilentlyContinue
        if ($nodeDirs) {
            $latestNode22 = $nodeDirs | Sort-Object Name -Descending | Select-Object -First 1
            $nodeExePath = Join-Path $latestNode22.FullName "node.exe"
            if (Test-Path $nodeExePath) {
                $nodeVer = & $nodeExePath -v 2>$null
                if ($nodeVer -match "^v22\.") {
                    Write-Ok "Node.js $nodeVer installed!"

                    # Make sure this is the active version
                    & $nvmExe use 22 2>$null

                    # Update PATH to include this version
                    $env:Path = "$($latestNode22.FullName);$env:Path"

                    return $true
                }
            }
        }

        # Standard check
        $nodeVer = & node -v 2>$null
        if ($nodeVer -match "^v22\.") {
            Write-Ok "Node.js $nodeVer installed and active!"
            return $true
        }
    }

    # If direct exe didn't work, try nvm command
    try {
        Write-Host "  Trying nvm from PATH..." -ForegroundColor DarkGray
        & nvm install 22
        Start-Sleep -Seconds 2
        & nvm use 22
        Start-Sleep -Seconds 2
        Refresh-Path

        $nodeVer = & node -v 2>$null
        if ($nodeVer -match "^v22\.") {
            Write-Ok "Node.js $nodeVer installed and active!"
            return $true
        }
    } catch {
        Write-Host "  nvm command not available in PATH" -ForegroundColor DarkGray
    }

    return $false
}

function Show-NodeManualInstructions {
    Write-Host ""
    Write-Host "============================================================" -ForegroundColor Cyan
    Write-Host "        MANUAL NODE.JS VERSION MANAGEMENT (Windows)" -ForegroundColor Cyan
    Write-Host "============================================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Using nvm-windows (RECOMMENDED):" -ForegroundColor Yellow
    Write-Host "  # Install nvm-windows first from:" -ForegroundColor DarkGray
    Write-Host "  # https://github.com/coreybutler/nvm-windows/releases" -ForegroundColor Green
    Write-Host ""
    Write-Host "  nvm install 22          # Install Node 22" -ForegroundColor Cyan
    Write-Host "  nvm use 22              # Switch to Node 22" -ForegroundColor Cyan
    Write-Host "  nvm list                # See installed versions" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "To return to Node 25 later:" -ForegroundColor Yellow
    Write-Host "  nvm install 25          # Install Node 25 (if not installed)" -ForegroundColor Cyan
    Write-Host "  nvm use 25              # Switch back to Node 25" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Alternative - Direct Download:" -ForegroundColor Yellow
    Write-Host "  Node 22: https://nodejs.org/dist/v22.11.0/node-v22.11.0-x64.msi" -ForegroundColor Green
    Write-Host "  Node 25: https://nodejs.org/dist/v25.0.0/node-v25.0.0-x64.msi" -ForegroundColor Green
    Write-Host ""
    Write-Host "============================================================" -ForegroundColor Cyan
    Write-Host ""
}

function Install-NodeJS {
    Write-Step "Checking Node.js..."

    # Get project root for messages
    $projectRoot = Get-ProjectRoot

    # Refresh PATH to detect any recently installed tools
    Refresh-Path

    $hasNvm = Test-NvmWindows
    $currentVersion = $null
    $majorVersion = 0

    if (Test-Command "node") {
        $currentVersion = & node -v 2>$null
        $majorVersion = [int]($currentVersion -replace 'v(\d+)\..*', '$1')

        if ($majorVersion -eq 22) {
            Write-Ok "Node.js $currentVersion detected (meets requirement)."
            return $true
        } elseif ($majorVersion -ge 23) {
            Write-Host ""
            Write-Fail "Node.js $currentVersion detected - TOO NEW!"
            Write-Host ""
            Write-Host "  Node v23+ breaks native modules like better-sqlite3." -ForegroundColor Red
            Write-Host "  RangerPlex requires Node.js v22.x (LTS)." -ForegroundColor Red
            Write-Host ""

            # If nvm-windows is available, offer automatic downgrade
            if ($hasNvm) {
                Write-Host "Good news! nvm-windows is installed." -ForegroundColor Green
                Write-Host ""
                $downgrade = Read-Host "Automatically downgrade to Node 22? (Y/n)"

                if ($downgrade -notmatch "^[Nn]") {
                    Write-Step "Installing Node.js 22 via nvm..."
                    & nvm install 22

                    Write-Step "Switching to Node.js 22..."
                    & nvm use 22

                    # Refresh PATH
                    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

                    # Verify
                    Start-Sleep -Seconds 2
                    $newVersion = & node -v 2>$null
                    if ($newVersion -match "^v22\.") {
                        Write-Ok "Successfully downgraded to Node.js $newVersion!"
                        Write-Host ""
                        Write-Host "To return to Node $majorVersion later:" -ForegroundColor Yellow
                        Write-Host "  nvm use $majorVersion" -ForegroundColor Cyan
                        Write-Host ""
                        return $true
                    } else {
                        Write-Warn "nvm switch may require a new terminal."
                        Write-Host "Close PowerShell, reopen, and run: nvm use 22" -ForegroundColor DarkGray
                    }
                }
            } else {
                # nvm not installed - THIS IS REQUIRED to downgrade
                Write-Host ""
                Write-Host "============================================================" -ForegroundColor Red
                Write-Host "  nvm-windows is REQUIRED to downgrade Node.js" -ForegroundColor Red
                Write-Host "============================================================" -ForegroundColor Red
                Write-Host ""
                Write-Host "nvm-windows lets you install and switch between Node versions." -ForegroundColor Cyan
                Write-Host "This is the ONLY way to downgrade from Node $majorVersion to Node 22." -ForegroundColor Yellow
                Write-Host ""
                Write-Host "winget CANNOT downgrade Node - it only upgrades!" -ForegroundColor Red
                Write-Host ""

                # Step 1: Install nvm-windows
                $nvmInstalled = Install-NvmWindows

                if ($nvmInstalled -or (Test-NvmWindows)) {
                    # Step 2: Install Node 22 via nvm
                    if (Install-Node22-Via-Nvm) {
                        return $true
                    }
                }

                # If we get here, nvm installed but Node switch needs restart
                # Create a helper script for after restart
                $helperScript = @"
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
"@
                $helperPath = Join-Path $projectRoot "setup-node22.ps1"
                $helperScript | Out-File -FilePath $helperPath -Encoding UTF8
                Write-Ok "Created helper script: setup-node22.ps1"

                Write-Host ""
                Write-Host "============================================================" -ForegroundColor Yellow
                Write-Host "  RESTART POWERSHELL REQUIRED" -ForegroundColor Yellow
                Write-Host "============================================================" -ForegroundColor Yellow
                Write-Host ""
                Write-Host "nvm-windows was installed but PowerShell needs to restart" -ForegroundColor Cyan
                Write-Host "to recognize the new PATH settings." -ForegroundColor Cyan
                Write-Host ""
                Write-Host "AFTER RESTARTING PowerShell, run:" -ForegroundColor Yellow
                Write-Host ""
                Write-Host "  cd $projectRoot" -ForegroundColor White
                Write-Host "  .\setup-node22.ps1" -ForegroundColor Cyan
                Write-Host ""
                Write-Host "Or manually run:" -ForegroundColor DarkGray
                Write-Host "  nvm install 22" -ForegroundColor DarkGray
                Write-Host "  nvm use 22" -ForegroundColor DarkGray
                Write-Host "  .\install-me-now.ps1" -ForegroundColor DarkGray
                Write-Host ""
                Write-Host "============================================================" -ForegroundColor Yellow
                Write-Host ""
                Read-Host "Press ENTER to exit (then restart PowerShell)"
                exit 0
            }

            # This point should not be reached, but just in case
            return $false

        } else {
            Write-Warn "Node.js $currentVersion detected; v22.x is recommended."
            $upgrade = Read-Host "Upgrade to Node 22? (Y/n)"
            if ($upgrade -notmatch "^[Nn]") {
                if ($hasNvm) {
                    & nvm install 22
                    & nvm use 22
                    Write-Ok "Switched to Node 22!"
                    return $true
                }
            } else {
                return $true
            }
        }
    }

    # No Node.js installed at all
    Write-Host ""
    Write-Host "Node.js is not installed." -ForegroundColor Yellow
    Write-Host ""

    if ($hasNvm) {
        Write-Host "nvm-windows detected! Installing Node 22..." -ForegroundColor Green
        & nvm install 22
        & nvm use 22
        Write-Ok "Node.js 22 installed and activated!"
        return $true
    }

    Write-Host "Install Options:" -ForegroundColor Yellow
    Write-Host "  1. nvm-windows (RECOMMENDED - manage multiple versions)" -ForegroundColor Green
    Write-Host "     https://github.com/coreybutler/nvm-windows/releases" -ForegroundColor DarkGray
    Write-Host ""
    Write-Host "  2. Direct download (single version only)" -ForegroundColor Cyan
    Write-Host "     https://nodejs.org/dist/v22.11.0/node-v22.11.0-x64.msi" -ForegroundColor DarkGray
    Write-Host ""
    Write-Host "  3. winget install OpenJS.NodeJS.LTS" -ForegroundColor Cyan
    Write-Host ""

    $choice = Read-Host "Install via [1] nvm-windows, [2] direct download, [3] winget, or [S]kip? (1/2/3/S)"

    switch ($choice) {
        "1" {
            Install-NvmWindows
            return $false
        }
        "2" {
            Start-Process "https://nodejs.org/dist/v22.11.0/node-v22.11.0-x64.msi"
            Write-Host "Install Node.js 22, then re-run this script." -ForegroundColor DarkGray
            exit 0
        }
        "3" {
            if (Test-Command "winget") {
                Write-Warn "WARNING: winget cannot DOWNGRADE Node.js versions!"
                Write-Host "  If you have Node 23+ installed, winget will NOT work." -ForegroundColor Red
                Write-Host "  Use nvm-windows instead (option 1)." -ForegroundColor Yellow
                Write-Host ""

                $proceed = Read-Host "Try winget anyway? (y/N)"
                if ($proceed -match "^[Yy]") {
                    Write-Step "Installing Node.js via winget..."
                    $wingetOutput = & winget install OpenJS.NodeJS.LTS --accept-package-agreements --accept-source-agreements 2>&1

                    # Check if winget actually changed anything
                    if ($wingetOutput -match "No available upgrade found|No newer package") {
                        Write-Fail "winget could not downgrade Node.js!"
                        Write-Host "  winget only installs/upgrades, it cannot downgrade." -ForegroundColor Red
                        Write-Host "  You MUST use nvm-windows to switch to Node 22." -ForegroundColor Yellow
                        Write-Host ""
                        Write-Host "  Install nvm-windows: winget install CoreyButler.NVMforWindows" -ForegroundColor Cyan
                        Write-Host "  Then: nvm install 22 && nvm use 22" -ForegroundColor Cyan
                        return $false
                    }

                    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

                    # Verify the version is actually 22
                    if (Test-Command "node") {
                        $newVer = & node -v 2>$null
                        if ($newVer -match "^v22\.") {
                            Write-Ok "Node.js $newVer installed!"
                            return $true
                        } else {
                            Write-Fail "Node.js is still $newVer (not v22.x)!"
                            Write-Host "  winget cannot downgrade. Use nvm-windows instead." -ForegroundColor Yellow
                            return $false
                        }
                    }
                }
            } else {
                Write-Fail "winget not available."
            }
        }
        default {
            Write-Warn "Skipping Node.js installation."
            return $false
        }
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
        # Check if installation is incomplete
        $criticalPackages = @("vite", "pm2", "better-sqlite3", "express", "react")
        $missingPackages = @()

        foreach ($pkg in $criticalPackages) {
            if (-not (Test-Path "node_modules\$pkg")) {
                $missingPackages += $pkg
            }
        }

        if ($missingPackages.Count -gt 0) {
            Write-Warn "Incomplete installation detected! Missing: $($missingPackages -join ', ')"
            Write-Host "Will remove and reinstall..." -ForegroundColor Yellow
            Remove-Item -Recurse -Force "node_modules" -ErrorAction SilentlyContinue
            Remove-Item -Force "package-lock.json" -ErrorAction SilentlyContinue
        } else {
            $reinstall = Read-Host "Existing node_modules detected. Reinstall? (y/N)"
            if ($reinstall -match "^[Yy]") {
                Write-Host "Removing old node_modules..." -ForegroundColor DarkGray
                Remove-Item -Recurse -Force "node_modules" -ErrorAction SilentlyContinue
                Remove-Item -Force "package-lock.json" -ErrorAction SilentlyContinue
            }
        }
    }

    # Create .npmrc to skip problematic native modules on Windows
    if (-not (Test-Path ".npmrc")) {
        Write-Step "Creating .npmrc for Windows compatibility..."
        @"
# Skip building node-pty on Windows (requires Visual Studio Build Tools)
# Terminal features will be disabled but app will run
node-pty:ignore-scripts=true
"@ | Out-File -FilePath ".npmrc" -Encoding UTF8
        Write-Ok "Created .npmrc"
    }

    Write-Host "Running npm install (this may take 5-10 minutes)..." -ForegroundColor DarkGray
    Write-Host "Building native modules like better-sqlite3..." -ForegroundColor DarkGray
    Write-Host "Note: Skipping node-pty (requires Visual Studio Build Tools)" -ForegroundColor DarkGray
    & npm install --ignore-scripts

    if ($LASTEXITCODE -eq 0) {
        # Verify critical packages are installed
        $criticalPackages = @("vite", "pm2", "better-sqlite3", "express", "react")
        $missingPackages = @()

        foreach ($pkg in $criticalPackages) {
            if (-not (Test-Path "node_modules\$pkg")) {
                $missingPackages += $pkg
            }
        }

        if ($missingPackages.Count -gt 0) {
            Write-Warn "Installation incomplete! Missing: $($missingPackages -join ', ')"
            Write-Host ""
            Write-Host "Retrying with --force flag..." -ForegroundColor Yellow
            & npm install --force

            # Check again
            $stillMissing = @()
            foreach ($pkg in $missingPackages) {
                if (-not (Test-Path "node_modules\$pkg")) {
                    $stillMissing += $pkg
                }
            }

            if ($stillMissing.Count -gt 0) {
                Write-Fail "Failed to install: $($stillMissing -join ', ')"
                Write-Host "Manual fix needed. See WINDOWS_SETUP.md" -ForegroundColor Red
                return $false
            }
        }

        Write-Ok "Dependencies installed successfully!"

        # Rebuild native modules (Windows-specific)
        Write-Step "Rebuilding native modules for Windows..."
        & npm rebuild better-sqlite3 2>$null
        & npm rebuild node-pty 2>$null
        Write-Ok "Native modules rebuilt."

        # Count installed packages
        $packageCount = (Get-ChildItem "node_modules" -Directory).Count
        Write-Host "Installed $packageCount packages." -ForegroundColor DarkGray

        return $true
    } else {
        Write-Fail "npm install failed!"
        Write-Host ""
        Write-Host "Common Windows issues:" -ForegroundColor Yellow
        Write-Host "  1. Node.js v23+ breaks better-sqlite3 (use v22.x)" -ForegroundColor DarkGray
        Write-Host "  2. Missing Windows Build Tools" -ForegroundColor DarkGray
        Write-Host "  3. Antivirus blocking npm" -ForegroundColor DarkGray
        Write-Host ""
        Write-Host "Try: Remove-Item -Recurse node_modules; npm install" -ForegroundColor Cyan
        Write-Host "See: WINDOWS_SETUP.md for detailed troubleshooting" -ForegroundColor Cyan
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
