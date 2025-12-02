# RangerPlex Shutdown Script (PowerShell)
# Windows-compatible version of shutdown.sh

Write-Host "🛑 Shutting down RangerPlex servers..." -ForegroundColor Yellow

# Update PM2 if installed
if (Get-Command pm2 -ErrorAction SilentlyContinue) {
    pm2 update 2>&1 | Out-Null
}

# Define ports to check and kill
$PORTS = @(3000, 5173, 5555, 5005)

foreach ($PORT in $PORTS) {
    # Find process on this port (Windows method)
    $processInfo = netstat -ano | Select-String ":$PORT " | Select-String "LISTENING"

    if ($processInfo) {
        # Extract PID from netstat output (last column)
        $ProcessId = ($processInfo -split '\s+')[-1]

        if ($ProcessId -and $ProcessId -match '^\d+$') {
            Write-Host "   Killing process on port $PORT (PID: $ProcessId)" -ForegroundColor Cyan
            Stop-Process -Id $ProcessId -Force -ErrorAction SilentlyContinue
        }
    }
}

# Kill any lingering node processes related to rangerplex
Get-Process -Name node -ErrorAction SilentlyContinue | Where-Object {
    $_.CommandLine -match "(proxy_server|rangerplex|relay-server)"
} | Stop-Process -Force -ErrorAction SilentlyContinue

# Kill PM2 processes if running
if (Get-Command pm2 -ErrorAction SilentlyContinue) {
    pm2 delete rangerplex-proxy 2>&1 | Out-Null
    pm2 delete rangerplex-vite 2>&1 | Out-Null
    pm2 delete all 2>&1 | Out-Null
}

Write-Host "✅ All RangerPlex servers stopped" -ForegroundColor Green
Write-Host ""
Write-Host "Ports checked: $($PORTS -join ', ')"

# Verify ports are free
Write-Host ""
Write-Host "Port status:" -ForegroundColor Yellow
foreach ($PORT in $PORTS) {
    $inUse = netstat -ano | Select-String ":$PORT " | Select-String "LISTENING"

    if ($inUse) {
        Write-Host "   ⚠️  Port $PORT is still in use" -ForegroundColor Red
    } else {
        Write-Host "   ✅ Port $PORT is free" -ForegroundColor Green
    }
}
