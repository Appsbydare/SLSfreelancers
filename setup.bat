@echo off
echo ========================================
echo Sri Lanka Tasks - Project Setup
echo ========================================
echo.

echo Navigating to project directory...
cd /d "C:\Users\Dar_Admin\sri-lanka-tasks"

echo.
echo Checking Git status...
git status

echo.
echo Installing dependencies...
npm install

echo.
echo Building project...
npm run build

echo.
echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo Available commands:
echo   npm run dev     - Start development server
echo   npm run build   - Build for production
echo   git status      - Check Git status
echo   git push origin master - Push to GitHub
echo.
echo Live site: https://sl-sfreelancers.vercel.app
echo GitHub: https://github.com/Appsbydare/SLSfreelancers
echo.
pause
