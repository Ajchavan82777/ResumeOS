@echo off
title ResumeOS DEBUG

set "ROOT=%~dp0"
set "BACKEND=%ROOT%backend"
set "FRONTEND=%ROOT%frontend"

echo.
echo  ResumeOS DEBUG - Backend Test
echo  ==============================
echo  This runs the backend directly so you can see any errors.
echo.

if not exist "%BACKEND%\.env" (
    echo  ERROR: backend\.env not found!
    pause & exit /b 1
)

cd /d "%BACKEND%"

echo  Node version:
node --version

echo.
echo  Checking .env values (not showing keys):
node -e "require('dotenv').config(); const v=process.env; console.log('SUPABASE_URL:', v.SUPABASE_URL ? 'SET' : 'MISSING'); console.log('SUPABASE_ANON_KEY:', v.SUPABASE_ANON_KEY ? 'SET' : 'MISSING'); console.log('SUPABASE_SERVICE_KEY:', v.SUPABASE_SERVICE_KEY ? 'SET' : 'MISSING'); console.log('PORT:', v.PORT || '5000');"

echo.
echo  Starting backend (errors will show here)...
echo  Press Ctrl+C to stop.
echo.
node src/index.js
echo.
echo  Backend stopped.
pause
