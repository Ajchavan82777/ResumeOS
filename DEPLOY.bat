@echo off
:: Relaunch under cmd /k so the window always stays open
if not "%~1"=="LAUNCHED" (
    start "ResumeOS Deploy" cmd /k ""%~f0" LAUNCHED"
    exit /b
)

setlocal EnableDelayedExpansion
title ResumeOS - Deploy to Vercel

set "ROOT=%~dp0"
set "FRONTEND=%ROOT%frontend"

echo.
echo  ==========================================
echo   ResumeOS - Deploy Frontend to Vercel
echo  ==========================================
echo.

:: ── 1. Node check ─────────────────────────────────────────────────────────
node --version >nul 2>&1
if !ERRORLEVEL! NEQ 0 (
    echo  [ERROR] Node.js not found. Download: https://nodejs.org
    goto :done
)
for /f "tokens=*" %%v in ('node --version') do set NODE_VER=%%v
echo  [OK] Node  !NODE_VER!

:: ── 2. Vercel CLI check ────────────────────────────────────────────────────
call vercel --version >nul 2>&1
if !ERRORLEVEL! NEQ 0 goto :install_vercel
for /f "tokens=*" %%v in ('cmd /c vercel --version 2^>nul') do set VER_VER=%%v
echo  [OK] Vercel !VER_VER!
goto :deps

:install_vercel
echo.
echo  [INFO] Vercel CLI not found. Installing globally...
call npm install -g vercel
if !ERRORLEVEL! NEQ 0 (
    echo  [ERROR] Failed to install Vercel CLI.
    echo          Try manually:  npm install -g vercel
    goto :done
)
echo  [OK] Vercel CLI installed.

:: ── 3. Frontend dependencies ───────────────────────────────────────────────
:deps
echo.
echo  [STEP 1/4] Checking frontend dependencies...
cd /d "%FRONTEND%"
if !ERRORLEVEL! NEQ 0 (
    echo  [ERROR] Cannot open folder: %FRONTEND%
    goto :done
)
if not exist "node_modules" (
    echo  Installing packages...
    call npm install
    if !ERRORLEVEL! NEQ 0 ( echo  [ERROR] npm install failed. & goto :done )
)
echo  [OK] Dependencies ready.

:: ── 4. TypeScript — show ALL errors at once ────────────────────────────────
echo.
echo  [STEP 2/4] Type-checking (all errors shown at once)...
echo.
call npx tsc --noEmit 2>&1
set TSC_ERR=!ERRORLEVEL!
if !TSC_ERR! NEQ 0 (
    echo.
    echo  ==========================================
    echo   TYPE ERRORS FOUND - fix all above then
    echo   run DEPLOY.bat again.
    echo  ==========================================
    goto :done
)
echo  [OK] No type errors.

:: ── 5. Production build ────────────────────────────────────────────────────
echo.
echo  [STEP 3/4] Running production build...
echo.
call npm run build
if !ERRORLEVEL! NEQ 0 (
    echo.
    echo  [ERROR] Build failed - see errors above.
    goto :done
)
echo.
echo  [OK] Build passed.

:: ── 6. Vercel deploy ───────────────────────────────────────────────────────
echo.
echo  [STEP 4/4] Deploying to Vercel...
echo.
echo  NOTE: If prompted, log in and select your project.
echo.
call vercel --prod
if !ERRORLEVEL! NEQ 0 (
    echo.
    echo  [ERROR] Deploy failed. Run these first then try again:
    echo    vercel login
    echo    cd frontend ^& vercel link
    goto :done
)

echo.
echo  ==========================================
echo   Deployed successfully!
echo.
echo   Set these in Vercel Dashboard
echo   Project Settings ^> Environment Variables:
echo.
echo     NEXT_PUBLIC_API_URL           your backend URL
echo     NEXT_PUBLIC_SUPABASE_URL
echo     NEXT_PUBLIC_SUPABASE_ANON_KEY
echo     NEXT_PUBLIC_APP_URL           your Vercel domain
echo  ==========================================

:done
echo.
echo  Press any key to close...
pause >nul
