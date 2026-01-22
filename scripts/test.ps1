# Run tests with proper flags
param(
    [switch]$Backend,
    [switch]$Frontend,
    [switch]$E2E,
    [switch]$Coverage,
    [string]$Filter
)

$ErrorActionPreference = "Stop"

$runBackend = $Backend -or (-not $Frontend -and -not $E2E)
$runFrontend = $Frontend -or (-not $Backend -and -not $E2E)
$runE2E = $E2E

if ($runBackend) {
    Write-Host "`n=== Running Backend Tests ===" -ForegroundColor Cyan
    Push-Location backend

    $args = @("tests/unit/")

    if (-not $Coverage) {
        $args += "--no-cov"
    }

    if ($Filter) {
        $args += "-k"
        $args += $Filter
    }

    $args += "--tb=short"
    $args += "-q"

    python -m pytest @args

    Pop-Location
}

if ($runFrontend) {
    Write-Host "`n=== Running Frontend Tests ===" -ForegroundColor Cyan
    Push-Location frontend

    if ($Coverage) {
        npm run test:coverage
    } else {
        npm run test
    }

    Pop-Location
}

if ($runE2E) {
    Write-Host "`n=== Running E2E Tests ===" -ForegroundColor Cyan
    Push-Location frontend

    npx playwright test

    Pop-Location
}

Write-Host "`n=== Tests Complete ===" -ForegroundColor Green
