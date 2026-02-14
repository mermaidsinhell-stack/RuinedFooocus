# bundle-python.ps1
# Downloads a standalone Python distribution and installs all dependencies
# for packaging with Electron. Run this before `npm run dist:win`.
#
# Usage: powershell -ExecutionPolicy Bypass -File electron/scripts/bundle-python.ps1

$ErrorActionPreference = "Stop"

$PYTHON_VERSION = "3.10.14"
$PYTHON_BUILD_TAG = "20240726"
$PYTHON_URL = "https://github.com/indygreg/python-build-standalone/releases/download/$PYTHON_BUILD_TAG/cpython-$PYTHON_VERSION+$PYTHON_BUILD_TAG-x86_64-pc-windows-msvc-shared-install_only_stripped.tar.gz"

$SCRIPT_DIR = Split-Path -Parent $MyInvocation.MyCommand.Path
$ELECTRON_DIR = Split-Path -Parent $SCRIPT_DIR
$PROJECT_ROOT = Split-Path -Parent $ELECTRON_DIR
$RESOURCES_DIR = Join-Path $ELECTRON_DIR "resources"
$PYTHON_DIR = Join-Path $RESOURCES_DIR "python"

$TORCH_INDEX = "https://download.pytorch.org/whl/cu124"

Write-Host "=== RuinedFooocus Python Bundler ===" -ForegroundColor Cyan
Write-Host ""

# Clean previous build
if (Test-Path $PYTHON_DIR) {
    Write-Host "Removing previous Python build..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force $PYTHON_DIR
}

New-Item -ItemType Directory -Force -Path $RESOURCES_DIR | Out-Null

# Download Python
$ARCHIVE = Join-Path $RESOURCES_DIR "python.tar.gz"
if (-not (Test-Path $ARCHIVE)) {
    Write-Host "Downloading Python $PYTHON_VERSION..." -ForegroundColor Green
    Invoke-WebRequest -Uri $PYTHON_URL -OutFile $ARCHIVE
} else {
    Write-Host "Using cached Python archive." -ForegroundColor Green
}

# Extract
Write-Host "Extracting Python..." -ForegroundColor Green
tar -xzf $ARCHIVE -C $RESOURCES_DIR
# The archive extracts to a "python" directory
if (-not (Test-Path $PYTHON_DIR)) {
    # Some archives extract to "python/install" - adjust if needed
    $extracted = Get-ChildItem $RESOURCES_DIR -Directory | Where-Object { $_.Name -like "python*" -or $_.Name -eq "install" } | Select-Object -First 1
    if ($extracted) {
        Rename-Item $extracted.FullName $PYTHON_DIR
    }
}

$PIP = Join-Path $PYTHON_DIR "python.exe"

# Ensure pip is available
Write-Host "Ensuring pip is available..." -ForegroundColor Green
& $PIP -m ensurepip --default-pip 2>$null
& $PIP -m pip install --upgrade pip

# Install PyTorch with CUDA 12.4
Write-Host "Installing PyTorch (CUDA 12.4)..." -ForegroundColor Green
& $PIP -m pip install torch torchvision --index-url $TORCH_INDEX

# Install project dependencies
Write-Host "Installing project dependencies..." -ForegroundColor Green
$REQUIREMENTS = Join-Path $PROJECT_ROOT "requirements_versions.txt"
if (Test-Path $REQUIREMENTS) {
    & $PIP -m pip install -r $REQUIREMENTS
}

# Install additional modules from pip/modules.txt
$MODULES_FILE = Join-Path $PROJECT_ROOT "pip" "modules.txt"
if (Test-Path $MODULES_FILE) {
    Write-Host "Installing additional modules..." -ForegroundColor Green
    & $PIP -m pip install -r $MODULES_FILE
}

# Cleanup: remove pip cache, __pycache__, .dist-info to reduce size
Write-Host "Cleaning up..." -ForegroundColor Green
Get-ChildItem -Path $PYTHON_DIR -Recurse -Directory -Filter "__pycache__" | Remove-Item -Recurse -Force
Get-ChildItem -Path $PYTHON_DIR -Recurse -Filter "*.pyc" | Remove-Item -Force

# Remove the archive
if (Test-Path $ARCHIVE) {
    Remove-Item $ARCHIVE
}

# Report size
$size = (Get-ChildItem -Path $PYTHON_DIR -Recurse | Measure-Object -Property Length -Sum).Sum / 1GB
Write-Host ""
Write-Host "=== Done ===" -ForegroundColor Cyan
Write-Host "Python directory: $PYTHON_DIR" -ForegroundColor Green
Write-Host "Total size: $([math]::Round($size, 2)) GB" -ForegroundColor Green
