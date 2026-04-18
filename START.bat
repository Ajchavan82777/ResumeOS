@echo off
title ResumeOS

set "ROOT=%~dp0"
set "BACKEND=%ROOT%backend"
set "FRONTEND=%ROOT%frontend"

echo.
echo  ResumeOS Launcher
echo  =================
echo.

:: Node check
node --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo  ERROR: Node.js not found. Download: https://nodejs.org
    pause
    exit /b 1
)
echo  Node: OK

:: .env check
if not exist "%BACKEND%\.env" (
    copy "%BACKEND%\.env.example" "%BACKEND%\.env" >nul
    echo  Created backend\.env
    echo  Open backend\.env and fill in your Supabase keys, then run again.
    notepad "%BACKEND%\.env"
    pause
    exit /b 0
)
echo  Env: OK

:: Install backend
if not exist "%BACKEND%\node_modules" (
    echo  Installing backend...
    cd /d "%BACKEND%"
    npm install
    if %ERRORLEVEL% NEQ 0 ( echo Install failed. & pause & exit /b 1 )
)

:: Install frontend
if not exist "%FRONTEND%\node_modules" (
    echo  Installing frontend...
    cd /d "%FRONTEND%"
    npm install
    if %ERRORLEVEL% NEQ 0 ( echo Install failed. & pause & exit /b 1 )
)

echo  Packages: OK

:: Seed
cd /d "%BACKEND%"
node src/db/seed.js
echo  Seed: done

:: Check nodemon exists, use node directly if not
if exist "%BACKEND%\node_modules\.bin\nodemon.cmd" (
    set "BACKENDCMD=npx nodemon src/index.js"
) else (
    set "BACKENDCMD=node src/index.js"
)

echo.
echo  Starting servers...
echo  (Two windows will open - keep them open)
echo.

:: Start backend - window stays open even on crash
start "ResumeOS Backend :5000" cmd /k "title Backend :5000 && cd /d "%BACKEND%" && echo. && echo Starting backend... && echo. && %BACKENDCMD% || (echo. && echo BACKEND CRASHED - check error above && pause)"

timeout /t 4 /nobreak >nul

:: Start frontend
start "ResumeOS Frontend :3000" cmd /k "title Frontend :3000 && cd /d "%FRONTEND%" && echo. && echo Starting frontend... && echo. && npm run dev || (echo. && echo FRONTEND CRASHED - check error above && pause)"

echo  Waiting for servers...
timeout /t 15 /nobreak >nul

start http://localhost:3000

echo.
echo  ============================================
echo   App:   http://localhost:3000
echo   Email: admin@resumeos.com
echo   Pass:  Admin@123456
echo  ============================================
echo.
echo  Keep the two server windows open.
echo  This window can be closed.
pause
