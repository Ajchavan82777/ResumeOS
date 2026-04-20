@echo off
:: Relaunch under cmd /k so the window always stays open
if not "%~1"=="LAUNCHED" (
    start "ResumeOS Deploy" cmd /k ""%~f0" LAUNCHED"
    exit /b
)

setlocal EnableDelayedExpansion
title ResumeOS - Deploy to Vercel via GitHub

set "ROOT=%~dp0"
set "FRONTEND=%ROOT%frontend"

echo.
echo  ==========================================
echo   ResumeOS - Push to GitHub + Vercel
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

:: ── 2. Git check ──────────────────────────────────────────────────────────
git --version >nul 2>&1
if !ERRORLEVEL! NEQ 0 (
    echo  [ERROR] Git not found. Download: https://git-scm.com
    goto :done
)
for /f "tokens=3" %%v in ('git --version') do set GIT_VER=%%v
echo  [OK] Git   !GIT_VER!

:: ── 3. Frontend dependencies ───────────────────────────────────────────────
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
if !ERRORLEVEL! NEQ 0 (
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

:: ── 6. Git push to GitHub ─────────────────────────────────────────────────
echo.
echo  [STEP 4/4] Pushing to GitHub (Vercel will auto-deploy)...
echo.

cd /d "%ROOT%"

:: Check if there are any changes to commit
git status --short > "%TEMP%\git_status.txt" 2>&1
set /p GIT_CHANGES=<"%TEMP%\git_status.txt"
if "!GIT_CHANGES!"=="" (
    echo  [INFO] No changes to commit. Checking if push is needed...
) else (
    :: Ask for commit message
    echo  Changes detected:
    git status --short
    echo.
    set /p COMMIT_MSG=  Enter commit message (or press Enter for default):

    if "!COMMIT_MSG!"=="" (
        :: Default message with date and time
        for /f "tokens=1-3 delims=/ " %%a in ('date /t') do set TODAY=%%c-%%b-%%a
        for /f "tokens=1-2 delims=: " %%a in ('time /t') do set NOW=%%a:%%b
        set COMMIT_MSG=Update: !TODAY! !NOW!
    )

    echo.
    echo  Staging all changes...
    git add -A
    if !ERRORLEVEL! NEQ 0 ( echo  [ERROR] git add failed. & goto :done )

    echo  Committing: "!COMMIT_MSG!"
    git commit -m "!COMMIT_MSG!"
    if !ERRORLEVEL! NEQ 0 ( echo  [ERROR] git commit failed. & goto :done )
    echo  [OK] Committed.
)

:: Push to GitHub
echo.
echo  Pushing to GitHub...
git push
if !ERRORLEVEL! NEQ 0 (
    echo.
    echo  [ERROR] git push failed. Try:
    echo    git remote -v           (check remote is set)
    echo    git push -u origin main (first-time push)
    goto :done
)

echo.
echo  ==========================================
echo   Done! Changes pushed to GitHub.
echo.
echo   Vercel is now auto-deploying your site.
echo   Check progress at:
echo   https://vercel.com/dashboard
echo.
echo   Your repo:
echo   https://github.com/Ajchavan82777/ResumeOS
echo  ==========================================

:done
echo.
echo  Press any key to close...
pause >nul
