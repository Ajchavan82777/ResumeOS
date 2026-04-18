@echo off
setlocal EnableDelayedExpansion
title ResumeOS - First-Time Setup Wizard

echo.
echo  ╔══════════════════════════════════════════════════════════╗
echo  ║          ResumeOS - First-Time Setup Wizard             ║
echo  ╚══════════════════════════════════════════════════════════╝
echo.

set "ROOT=%~dp0"
set "BACKEND=%ROOT%backend"
set "FRONTEND=%ROOT%frontend"

:: ── Step 1: Check Node ────────────────────────────────────────────────────────
echo  ┌─────────────────────────────────────────┐
echo  │  STEP 1: Check Prerequisites            │
echo  └─────────────────────────────────────────┘
node --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo  ❌ Node.js not installed.
    echo.
    echo  Install Node.js v18+ from: https://nodejs.org/en/download
    echo.
    pause & exit /b 1
)
for /f "tokens=*" %%i in ('node --version') do set NODE_VER=%%i
echo  ✅ Node.js %NODE_VER%
echo.

:: ── Step 2: Configure Backend .env ───────────────────────────────────────────
echo  ┌─────────────────────────────────────────┐
echo  │  STEP 2: Configure Backend (.env)       │
echo  └─────────────────────────────────────────┘

if not exist "%BACKEND%\.env" (
    copy "%BACKEND%\.env.example" "%BACKEND%\.env" >nul
)

echo.
echo  Please enter your Supabase credentials.
echo  (Find them at: https://app.supabase.com → your project → Settings → API)
echo.

set /p SUPABASE_URL="  Supabase Project URL (https://xxxx.supabase.co): "
set /p SUPABASE_ANON="  Supabase Anon Key: "
set /p SUPABASE_SVC="  Supabase Service Role Key: "

:: Write backend .env (no Anthropic key - managed via Admin panel now)
(
echo PORT=5000
echo NODE_ENV=development
echo.
echo # Supabase
echo SUPABASE_URL=%SUPABASE_URL%
echo SUPABASE_ANON_KEY=%SUPABASE_ANON%
echo SUPABASE_SERVICE_KEY=%SUPABASE_SVC%
echo.
echo # JWT
echo JWT_SECRET=resumeos-jwt-%RANDOM%%RANDOM%-%RANDOM%
echo JWT_EXPIRES_IN=7d
echo.
echo # Frontend
echo FRONTEND_URL=http://localhost:3000
echo RATE_LIMIT_WINDOW_MS=900000
echo RATE_LIMIT_MAX=100
echo.
echo # AI API Key - NOT required here!
echo # Configure AI via Admin Panel: http://localhost:3000/admin
echo # AI is disabled by default - enable it in Admin Panel after setup
echo ANTHROPIC_API_KEY=
) > "%BACKEND%\.env"

echo  ✅ backend\.env created.
echo.

:: Write frontend .env.local
(
echo NEXT_PUBLIC_API_URL=http://localhost:5000
echo NEXT_PUBLIC_SUPABASE_URL=%SUPABASE_URL%
echo NEXT_PUBLIC_SUPABASE_ANON_KEY=%SUPABASE_ANON%
echo NEXT_PUBLIC_APP_URL=http://localhost:3000
) > "%FRONTEND%\.env.local"
echo  ✅ frontend\.env.local created.
echo.

:: ── Step 3: Database Schema ───────────────────────────────────────────────────
echo  ┌─────────────────────────────────────────┐
echo  │  STEP 3: Set Up Database                │
echo  └─────────────────────────────────────────┘
echo.
echo  You need to run TWO SQL files in Supabase:
echo.
echo  FILE 1 (Main schema - run this first):
echo     %BACKEND%\src\db\schema.sql
echo.
echo  FILE 2 (AI settings table - run this second):
echo     %BACKEND%\src\db\ai_settings_migration.sql
echo.
echo  Steps:
echo    1. Go to: https://app.supabase.com
echo    2. Open your project
echo    3. Click "SQL Editor" in sidebar
echo    4. Paste and run schema.sql first
echo    5. Then paste and run ai_settings_migration.sql
echo.

set /p DB_DONE="  Have you run BOTH SQL files? (y/n): "
if /i "%DB_DONE%" NEQ "y" (
    echo.
    echo  ⚠️  Please run both SQL files before continuing.
    start "" "https://app.supabase.com"
    start "" "%BACKEND%\src\db\schema.sql"
    echo  Opening Supabase and schema file. Press any key when done...
    pause >nul
)
echo.

:: ── Step 4: Install npm packages ─────────────────────────────────────────────
echo  ┌─────────────────────────────────────────┐
echo  │  STEP 4: Install npm Packages           │
echo  └─────────────────────────────────────────┘
echo.
echo  📦 Installing backend packages...
echo     (using: @anthropic-ai/sdk, @supabase/supabase-js, axios, docx, etc.)
echo.
cd /d "%BACKEND%"
call npm install --prefer-offline 2>nul || call npm install
if %ERRORLEVEL% NEQ 0 (
    echo  ❌ Backend npm install failed!
    echo.
    echo  Try manually: cd backend ^&^& npm install
    pause & exit /b 1
)
echo  ✅ Backend packages installed.
echo.

echo  📦 Installing frontend packages...
echo.
cd /d "%FRONTEND%"
call npm install --prefer-offline 2>nul || call npm install
if %ERRORLEVEL% NEQ 0 (
    echo  ❌ Frontend npm install failed!
    pause & exit /b 1
)
echo  ✅ Frontend packages installed.
echo.

:: ── Step 5: Seed Admin ────────────────────────────────────────────────────────
echo  ┌─────────────────────────────────────────┐
echo  │  STEP 5: Create Admin User              │
echo  └─────────────────────────────────────────┘
echo.
cd /d "%BACKEND%"
node src/db/seed.js
echo.

:: ── Done ─────────────────────────────────────────────────────────────────────
echo  ╔══════════════════════════════════════════════════════════╗
echo  ║           🎉  Setup Complete! Ready to Launch           ║
echo  ╠══════════════════════════════════════════════════════════╣
echo  ║                                                          ║
echo  ║  Admin Login:                                            ║
echo  ║    Email    : admin@resumeos.com                         ║
echo  ║    Password : Admin@123456                               ║
echo  ║                                                          ║
echo  ║  To configure AI features:                               ║
echo  ║    1. Run START.bat                                      ║
echo  ║    2. Login as admin                                     ║
echo  ║    3. Go to /admin → AI Settings tab                    ║
echo  ║    4. Pick provider, paste API key, enable AI            ║
echo  ║                                                          ║
echo  ╚══════════════════════════════════════════════════════════╝
echo.

set /p LAUNCH="  Launch the app now? (y/n): "
if /i "%LAUNCH%"=="y" (
    cd /d "%ROOT%"
    call START.bat
) else (
    echo  Run START.bat whenever you're ready.
    pause
)
