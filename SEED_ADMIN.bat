@echo off
title ResumeOS - Seed Admin User

echo.
echo  ╔══════════════════════════════════════════════════════════╗
echo  ║            ResumeOS - Seed Admin User                   ║
echo  ╚══════════════════════════════════════════════════════════╝
echo.
echo  This will create/update the admin user in your Supabase database.
echo.
echo  Admin Credentials:
echo    Email    : admin@resumeos.com
echo    Password : Admin@123456
echo    Plan     : Pro (all features)
echo.
echo  ─────────────────────────────────────────────────────────────
echo  ⚠️  IMPORTANT: If you see a "unique constraint" error, first
echo  run this SQL file in Supabase SQL Editor:
echo.
echo    backend\src\db\patch_fix_constraints.sql
echo.
echo  Then run this bat file again.
echo  ─────────────────────────────────────────────────────────────
echo.

set "ROOT=%~dp0"
set "BACKEND=%ROOT%backend"

if not exist "%BACKEND%\.env" (
    echo  ❌ backend\.env not found.
    echo     Copy backend\.env.example to backend\.env and fill in Supabase keys first.
    echo.
    pause
    exit /b 1
)

if not exist "%BACKEND%\node_modules" (
    echo  📦 Installing backend packages first...
    cd /d "%BACKEND%"
    call npm install --prefer-offline 2>nul || call npm install
    echo.
)

cd /d "%BACKEND%"
echo  Running seed script...
echo.
node src/db/seed.js

echo.
if %ERRORLEVEL% EQU 0 (
    echo  ╔══════════════════════════════════════════════════════════╗
    echo  ║                  ✅  Seed Complete!                     ║
    echo  ║                                                          ║
    echo  ║  Login at: http://localhost:3000/auth/login              ║
    echo  ║  Email   : admin@resumeos.com                            ║
    echo  ║  Password: Admin@123456                                  ║
    echo  ║                                                          ║
    echo  ║  Enable AI: /admin → AI Settings tab                    ║
    echo  ╚══════════════════════════════════════════════════════════╝
) else (
    echo  ╔══════════════════════════════════════════════════════════╗
    echo  ║                  ❌  Seed Failed                        ║
    echo  ╠══════════════════════════════════════════════════════════╣
    echo  ║                                                          ║
    echo  ║  Common fixes:                                           ║
    echo  ║                                                          ║
    echo  ║  1. Run this SQL in Supabase SQL Editor:                 ║
    echo  ║     backend\src\db\patch_fix_constraints.sql             ║
    echo  ║     Then run this file again.                            ║
    echo  ║                                                          ║
    echo  ║  2. Check backend\.env has correct:                      ║
    echo  ║     SUPABASE_URL                                         ║
    echo  ║     SUPABASE_SERVICE_KEY (service_role key, not anon)    ║
    echo  ║                                                          ║
    echo  ║  3. Make sure you ran schema.sql in Supabase first!      ║
    echo  ║                                                          ║
    echo  ╚══════════════════════════════════════════════════════════╝
)

echo.
pause
