# Publish Release Script for Notafacil
# Automates: build, git tag, GitHub release upload

param(
    [Parameter(Mandatory=$true)]
    [string]$Version,
    
    [Parameter(Mandatory=$false)]
    [string]$ReleaseNotes = "Release version $Version"
)

$ErrorActionPreference = "Stop"

Write-Host "Release Publisher v1.0" -ForegroundColor Cyan

# Validate version format
if ($Version -notmatch '^\d+\.\d+\.\d+$') {
    Write-Host "Invalid version format. Use: 0.2.0" -ForegroundColor Red
    exit 1
}

$ProjectRoot = Get-Location
Write-Host "Project root: $ProjectRoot" -ForegroundColor Yellow

# Check git status
Write-Host "`nChecking git status..." -ForegroundColor Cyan
$gitStatus = git status --porcelain
if ($gitStatus) {
    Write-Host "Uncommitted changes found:" -ForegroundColor Red
    Write-Host $gitStatus
    exit 1
}
Write-Host "Git working directory clean" -ForegroundColor Green

# Update package.json version
Write-Host "`nUpdating package.json to version $Version..." -ForegroundColor Cyan
$packageJsonPath = Join-Path $ProjectRoot "package.json"
$packageJson = Get-Content $packageJsonPath -Raw | ConvertFrom-Json
$oldVersion = $packageJson.version
$packageJson.version = $Version
$packageJson | ConvertTo-Json -Depth 10 | Set-Content $packageJsonPath
Write-Host "Updated: $oldVersion -> $Version" -ForegroundColor Green

# Commit version update
Write-Host "Committing version bump..." -ForegroundColor Cyan
git add package.json
git commit -m "chore: bump version to $Version"

# Build frontend
Write-Host "Building frontend..." -ForegroundColor Cyan
npm run build:web
if ($LASTEXITCODE -ne 0) {
    Write-Host "Frontend build failed" -ForegroundColor Red
    exit 1
}

# Generate installer
Write-Host "Generating Windows installer..." -ForegroundColor Cyan
npx electron-builder --win --publish=never --config.npmRebuild=false
if ($LASTEXITCODE -ne 0) {
    Write-Host "Installer build failed" -ForegroundColor Red
    exit 1
}

# Verify installer
$installerPath = Join-Path $ProjectRoot "dist" "Notafacil Setup $Version.exe"
$blockmapPath = "$installerPath.blockmap"

if (-not (Test-Path $installerPath)) {
    Write-Host "Installer not found at: $installerPath" -ForegroundColor Red
    exit 1
}
Write-Host "Installer verified: $installerPath" -ForegroundColor Green

# Create git tag and push
Write-Host "Creating git tag and pushing..." -ForegroundColor Cyan
git tag -a "v$Version" -m "Release v$Version"
git push origin main
git push origin "v$Version"

if ($LASTEXITCODE -ne 0) {
    Write-Host "Git push failed" -ForegroundColor Red
    exit 1
}

Write-Host "Pushed to GitHub" -ForegroundColor Green

# Final instructions
Write-Host "`n================================" -ForegroundColor Cyan
Write-Host "Release process complete!" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Go to: https://github.com/movelaromoveis-dot/App-Notinha/releases"
Write-Host "2. Click 'Create a new release'"
Write-Host "3. Select tag: v$Version"
Write-Host "4. Title: Notafacil v$Version"
Write-Host "5. Description: $ReleaseNotes"
Write-Host "6. Attach files:"
Write-Host "   - $installerPath"
Write-Host "   - $blockmapPath"
Write-Host "7. Publish release"
Write-Host ""
Write-Host "Files ready at:"
Write-Host "  $installerPath"
Write-Host "  $blockmapPath"
Write-Host ""
