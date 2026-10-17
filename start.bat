@echo off
echo ===================================================
echo Starting HotelHub Application Environment
echo ===================================================

echo [1/3] Starting PostgreSQL 18...
start "" "C:\Program Files\PostgreSQL\18\data\bin\postgres.exe" -D "C:\Users\Suganya\pgdata_18"
timeout /t 2 /nobreak >nul

echo [2/3] Starting Backend API Server (Port 5000)...
start "HotelHub Backend API" cmd /k "cd /d %~dp0server && npm start"
timeout /t 2 /nobreak >nul

echo [3/3] Starting Frontend React Client (Port 3000)...
start "HotelHub Frontend Client" cmd /k "cd /d %~dp0client && npm run dev"

echo ===================================================
echo Done! Open your browser at: http://localhost:3000
echo ===================================================
