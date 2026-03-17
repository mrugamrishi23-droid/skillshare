# SkillShare - Start All Services
# Run: .\start.ps1

Write-Host "Starting SkillShare..." -ForegroundColor Cyan
Write-Host ""

# Start Backend in new window
Write-Host "Starting Backend (FastAPI)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "cd '$PWD\backend'; .\venv\Scripts\Activate.ps1; Write-Host 'Backend starting at http://localhost:8000' -ForegroundColor Green; python main.py"
) -WindowStyle Normal

Start-Sleep -Seconds 2

# Start Frontend in new window
Write-Host "Starting Frontend (Next.js)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "cd '$PWD\frontend'; Write-Host 'Frontend starting at http://localhost:3000' -ForegroundColor Green; npm run dev"
) -WindowStyle Normal

Start-Sleep -Seconds 3

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  SkillShare is starting!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Frontend:  http://localhost:3000" -ForegroundColor Cyan
Write-Host "  API Docs:  http://localhost:8000/api/docs" -ForegroundColor Cyan
Write-Host ""
Write-Host "Opening browser..." -ForegroundColor Gray
Start-Sleep -Seconds 4
Start-Process "http://localhost:3000"
