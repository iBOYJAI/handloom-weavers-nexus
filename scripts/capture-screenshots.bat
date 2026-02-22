@echo off
echo ============================================
echo Screenshot Capture Script
echo Handloom Weavers Nexus
echo ============================================
echo.
echo This script will automatically capture screenshots of all pages.
echo Make sure the server is running on http://localhost:3000
echo.
pause
echo.
echo Installing Puppeteer (if needed)...
call npm install puppeteer --save-dev
echo.
echo Starting screenshot capture...
call npm run capture-screenshots
echo.
pause
