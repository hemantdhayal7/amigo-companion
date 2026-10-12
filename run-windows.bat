@echo off
echo ========================================================
echo   🥬 AMIGO STUDY DATE COMPANION - START ON WINDOWS
echo ========================================================
echo.

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is required. Download at https://nodejs.org
    pause
    exit /b 1
)

echo Starting backend server and desktop frontend...
start "Amigo Backend" cmd /k "node server.js"
start "Amigo App" cmd /k "npm run tauri dev"
