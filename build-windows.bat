@echo off
echo ========================================================
echo   🥬 AMIGO STUDY DATE COMPANION - WINDOWS BUILDER (.EXE)
echo ========================================================
echo.

:: 1. Check Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed. Please download Node.js from https://nodejs.org
    pause
    exit /b 1
)

:: 2. Check Rust / Cargo
where cargo >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Rust is not installed. Please install Rust from https://rustup.rs
    pause
    exit /b 1
)

echo [1/3] Installing NPM dependencies...
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] npm install failed.
    pause
    exit /b 1
)

echo.
echo [2/3] Building frontend web assets...
call npm run build
if %errorlevel% neq 0 (
    echo [ERROR] frontend build failed.
    pause
    exit /b 1
)

echo.
echo [3/3] Compiling native Windows .exe using Tauri 2...
call npm run tauri build
if %errorlevel% neq 0 (
    echo [ERROR] Tauri build failed.
    pause
    exit /b 1
)

echo.
echo ========================================================
echo   SUCCESS! Your Windows executable has been built:
echo   - Portable EXE: src-tauri\target\release\Amigo.exe
echo   - Installer:    src-tauri\target\release\bundle\nsis\
echo ========================================================
pause
