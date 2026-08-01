# Build portable exe using electron-packager output
$ErrorActionPreference = "Stop"

$appDir = "dist\Mixer Visuals-win32-x64"
$outExe = "dist\Mixer Visuals.exe"

if (-not (Test-Path $appDir)) {
    npx electron-packager . "Mixer Visuals" --platform=win32 --arch=x64 --icon=assets/icons/app.ico --out=dist --overwrite --no-prune
}

# Create a simple launcher script
@"
@echo off
start "" "%~dp0Mixer Visuals.exe"
"@ | Out-File -FilePath "dist\launcher.bat" -Encoding ASCII

Write-Host "=== Build ready ==="
Write-Host "App directory: $appDir"
Write-Host "Run: $appDir\Mixer Visuals.exe"
