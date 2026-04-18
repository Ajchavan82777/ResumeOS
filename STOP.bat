@echo off
title ResumeOS - Stop Servers

echo.
echo  ╔══════════════════════════════════════╗
echo  ║     ResumeOS - Stopping Servers     ║
echo  ╚══════════════════════════════════════╝
echo.

echo  Stopping processes on ports 3000 and 5000...
echo.

:: Kill port 3000 (Next.js frontend)
for /f "tokens=5" %%a in ('netstat -aon ^| find "0.0.0.0:3000 "') do (
    taskkill /F /PID %%a >nul 2>&1
    echo  ✅ Stopped frontend (port 3000, PID %%a)
)

:: Kill port 5000 (Express backend)
for /f "tokens=5" %%a in ('netstat -aon ^| find "0.0.0.0:5000 "') do (
    taskkill /F /PID %%a >nul 2>&1
    echo  ✅ Stopped backend (port 5000, PID %%a)
)

echo.
echo  ✅ All ResumeOS servers stopped.
echo.
timeout /t 2 /nobreak >nul
