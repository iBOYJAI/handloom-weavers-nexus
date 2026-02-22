@echo off
echo Handloom Weavers Nexus - Environment Setup
echo =========================================
echo Student: Selvanayaki G ^| Gobi Arts ^& Science College, Gobichettipalayam
echo.
echo [1/3] Installing dependencies...
call npm install
echo.
echo [2/3] Setting up database...
echo Caution: This will recreate the database and reset all data.
set /p confirm="Do you want to initialize/reset the database? (y/n): "
if /i "%confirm%"=="y" (
    npm run setup-db
)
echo.
echo [3/3] Setup complete!
echo You can now use start.bat to launch the application.
pause
