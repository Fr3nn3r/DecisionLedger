# Kill stale processes and restart dev servers
param(
    [switch]$BackendOnly,
    [switch]$FrontendOnly
)

$ErrorActionPreference = "Stop"

function Kill-ProcessOnPort {
    param([int]$Port)

    $connections = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
    foreach ($conn in $connections) {
        $proc = Get-Process -Id $conn.OwningProcess -ErrorAction SilentlyContinue
        if ($proc) {
            Write-Host "Killing process $($proc.Name) (PID: $($proc.Id)) on port $Port"
            Stop-Process -Id $proc.Id -Force
        }
    }
}

# Kill stale processes
if (-not $FrontendOnly) {
    Write-Host "Checking port 8000 (backend)..."
    Kill-ProcessOnPort -Port 8000
}

if (-not $BackendOnly) {
    Write-Host "Checking port 5173 (frontend)..."
    Kill-ProcessOnPort -Port 5173
}

Start-Sleep -Seconds 1

# Start servers
if (-not $FrontendOnly) {
    Write-Host "`nStarting backend..."
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; uvicorn src.decision_ledger.api.main:app --reload --port 8000"
}

if (-not $BackendOnly) {
    Write-Host "Starting frontend..."
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev"
}

Write-Host "`nDev servers started!"
Write-Host "Backend: http://localhost:8000"
Write-Host "Frontend: http://localhost:5173"
