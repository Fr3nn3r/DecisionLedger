# Bump version in both backend and frontend
param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("major", "minor", "patch")]
    [string]$BumpType,

    [switch]$DryRun
)

$ErrorActionPreference = "Stop"

# Read current version from backend pyproject.toml
$pyprojectPath = "backend/pyproject.toml"
$pyproject = Get-Content $pyprojectPath -Raw
$match = [regex]::Match($pyproject, 'version\s*=\s*"(\d+\.\d+\.\d+)"')

if (-not $match.Success) {
    Write-Error "Could not find version in $pyprojectPath"
    exit 1
}

$currentVersion = $match.Groups[1].Value

# Parse version
$parts = $currentVersion.Split(".")
$major = [int]$parts[0]
$minor = [int]$parts[1]
$patch = [int]$parts[2]

# Bump
switch ($BumpType) {
    "major" { $major++; $minor = 0; $patch = 0 }
    "minor" { $minor++; $patch = 0 }
    "patch" { $patch++ }
}

$newVersion = "$major.$minor.$patch"

Write-Host "Version: $currentVersion -> $newVersion" -ForegroundColor Cyan

if ($DryRun) {
    Write-Host "(Dry run - no changes made)" -ForegroundColor Yellow
    exit 0
}

# Update backend/pyproject.toml
$pyproject = $pyproject -replace 'version\s*=\s*"\d+\.\d+\.\d+"', "version = `"$newVersion`""
Set-Content $pyprojectPath $pyproject -NoNewline
Write-Host "Updated $pyprojectPath" -ForegroundColor Green

# Update backend/__init__.py
$initPath = "backend/src/decision_ledger/__init__.py"
$init = Get-Content $initPath -Raw
$init = $init -replace '__version__\s*=\s*"\d+\.\d+\.\d+"', "__version__ = `"$newVersion`""
Set-Content $initPath $init -NoNewline
Write-Host "Updated $initPath" -ForegroundColor Green

# Update frontend/package.json
$packagePath = "frontend/package.json"
$packageJson = Get-Content $packagePath -Raw | ConvertFrom-Json
$packageJson.version = $newVersion
$packageJson | ConvertTo-Json -Depth 100 | Set-Content $packagePath
Write-Host "Updated $packagePath" -ForegroundColor Green

Write-Host "`nVersion bumped to $newVersion" -ForegroundColor Green
Write-Host "Don't forget to commit the changes!" -ForegroundColor Yellow
