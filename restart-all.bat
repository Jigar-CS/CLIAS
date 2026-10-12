@echo off
title CLIAS Server Restart Utility
echo ===================================================
echo   Restarting CLIAS Platform Services...
echo ===================================================

:: 1. Terminate existing Node/Python processes on Ports 8000, 4000, 3000
echo [*] Freeing Ports 8000, 4000, 3000...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8000 ^| findstr LISTENING') do taskkill /f /pid %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :4000 ^| findstr LISTENING') do taskkill /f /pid %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000 ^| findstr LISTENING') do taskkill /f /pid %%a >nul 2>&1
timeout /t 2 /nobreak >nul

:: 2. Ensure MySQL on Port 3307 is Running
netstat -ano | findstr :3307 | findstr LISTENING >nul 2>&1
if %errorlevel% equ 0 (
    echo [1/4] MySQL is ACTIVE on Port 3307.
) else (
    echo [1/4] Starting MySQL on Port 3307...
    start "CLIAS 1 - MySQL (Port 3307)" cmd /k "color 0A && echo Starting MySQL on Port 3307... && C:\xampp\mysql\bin\mysqld.exe --defaults-file=C:\xampp\mysql\bin\my.ini --console"
    timeout /t 3 /nobreak >nul
)

:: 3. Start FastAPI AI Microservice on Port 8000
echo [2/4] Starting FastAPI AI Service on Port 8000...
start "CLIAS 2 - FastAPI AI Service (Port 8000)" /d "%~dp0apps\ai" cmd /k "color 0B && echo Starting FastAPI Microservice... && python -m uvicorn main:app --host 0.0.0.0 --port 8000"

:: 4. Start NestJS Backend API on Port 4000
echo [3/4] Starting NestJS Backend API on Port 4000...
start "CLIAS 3 - NestJS API (Port 4000)" /d "%~dp0apps\api" cmd /k "color 0E && echo Starting NestJS API... && npm run dev"

:: 5. Start Next.js Frontend on Port 3000
echo [4/4] Starting Next.js Web Frontend on Port 3000...
start "CLIAS 4 - Next.js Web (Port 3000)" /d "%~dp0apps\web" cmd /k "color 0D && echo Starting Next.js Frontend... && npm run dev"

echo ===================================================
echo   All 4 CLIAS services restarted!
echo   - Web Frontend:  http://localhost:3000
echo   - NestJS API:    http://localhost:4000/api/v1
echo   - AI Service:    http://localhost:8000
echo   - MySQL DB:      localhost:3307 (clias_db)
echo ===================================================
timeout /t 4 /nobreak >nul
