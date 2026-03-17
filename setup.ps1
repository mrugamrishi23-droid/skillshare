# SkillShare - Full Setup Script for Windows PowerShell
# Run: .\setup.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  SkillShare Setup Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check prerequisites
function Check-Command($cmd) {
    return (Get-Command $cmd -ErrorAction SilentlyContinue) -ne $null
}

Write-Host "Checking prerequisites..." -ForegroundColor Yellow

if (-not (Check-Command "python")) {
    Write-Host "ERROR: Python not found. Please install Python 3.11+ from https://python.org" -ForegroundColor Red
    exit 1
}
Write-Host "  [OK] Python found" -ForegroundColor Green

if (-not (Check-Command "node")) {
    Write-Host "ERROR: Node.js not found. Please install Node.js 18+ from https://nodejs.org" -ForegroundColor Red
    exit 1
}
Write-Host "  [OK] Node.js found" -ForegroundColor Green

if (-not (Check-Command "npm")) {
    Write-Host "ERROR: npm not found." -ForegroundColor Red
    exit 1
}
Write-Host "  [OK] npm found" -ForegroundColor Green

# Check PostgreSQL
$pgRunning = $false
try {
    $result = psql -U postgres -c "SELECT 1" 2>$null
    $pgRunning = $true
    Write-Host "  [OK] PostgreSQL found" -ForegroundColor Green
} catch {
    Write-Host "  [WARN] PostgreSQL not detected. Make sure it's running." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Setting up Backend..." -ForegroundColor Yellow

# Backend setup
Set-Location backend

# Create virtual environment
if (-not (Test-Path "venv")) {
    Write-Host "  Creating virtual environment..." -ForegroundColor Gray
    python -m venv venv
}

# Activate venv
$activateScript = "venv\Scripts\Activate.ps1"
if (Test-Path $activateScript) {
    & $activateScript
} else {
    Write-Host "  [WARN] Could not find venv activate script" -ForegroundColor Yellow
}

# Install deps
Write-Host "  Installing Python dependencies..." -ForegroundColor Gray
pip install -r requirements.txt --quiet

# Create .env if not exists
if (-not (Test-Path ".env")) {
    Write-Host "  Creating .env file..." -ForegroundColor Gray
    Copy-Item ".env.example" ".env"
    Write-Host "  [!] Please edit backend/.env with your database credentials" -ForegroundColor Yellow
}

Set-Location ..

Write-Host ""
Write-Host "Setting up Frontend..." -ForegroundColor Yellow

Set-Location frontend

# Install deps
Write-Host "  Installing Node.js dependencies..." -ForegroundColor Gray
npm install --legacy-peer-deps --silent

# Create .env.local if not exists
if (-not (Test-Path ".env.local")) {
    Copy-Item ".env.local.example" ".env.local"
}

Set-Location ..

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Make sure PostgreSQL is running" -ForegroundColor White
Write-Host "2. Create the database:" -ForegroundColor White
Write-Host "   psql -U postgres -c ""CREATE USER skillshare WITH PASSWORD 'skillshare123';"" " -ForegroundColor Gray
Write-Host "   psql -U postgres -c ""CREATE DATABASE skillshare OWNER skillshare;"" " -ForegroundColor Gray
Write-Host ""
Write-Host "3. Start the backend:" -ForegroundColor White
Write-Host "   cd backend && venv\Scripts\activate && python main.py" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Seed the database (first time only):" -ForegroundColor White
Write-Host "   Open http://localhost:8000/api/docs -> POST /api/skills/seed" -ForegroundColor Gray
Write-Host ""
Write-Host "5. Start the frontend (new terminal):" -ForegroundColor White
Write-Host "   cd frontend && npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "6. Open http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
