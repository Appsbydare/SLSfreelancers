# Sri Lanka Tasks - Project Setup Script
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Sri Lanka Tasks - Project Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Navigating to project directory..." -ForegroundColor Yellow
Set-Location "C:\Users\Dar_Admin\sri-lanka-tasks"

Write-Host ""
Write-Host "Checking Git status..." -ForegroundColor Yellow
git status

Write-Host ""
Write-Host "Installing dependencies..." -ForegroundColor Yellow
npm install

Write-Host ""
Write-Host "Building project..." -ForegroundColor Yellow
npm run build

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Available commands:" -ForegroundColor White
Write-Host "  npm run dev     - Start development server" -ForegroundColor Gray
Write-Host "  npm run build   - Build for production" -ForegroundColor Gray
Write-Host "  git status      - Check Git status" -ForegroundColor Gray
Write-Host "  git push origin master - Push to GitHub" -ForegroundColor Gray
Write-Host ""
Write-Host "Live site: https://sl-sfreelancers.vercel.app" -ForegroundColor Blue
Write-Host "GitHub: https://github.com/Appsbydare/SLSfreelancers" -ForegroundColor Blue
Write-Host ""
Read-Host "Press Enter to continue"


