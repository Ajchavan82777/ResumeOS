#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────────────────────
# ResumeOS - Full Stack Launcher (macOS / Linux)
# Usage: bash start.sh
# ──────────────────────────────────────────────────────────────────────────────
set -e

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND="$ROOT/backend"
FRONTEND="$ROOT/frontend"

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'
BOLD='\033[1m'; RESET='\033[0m'

log_ok()   { echo -e "  ${GREEN}✅  $1${RESET}"; }
log_warn() { echo -e "  ${YELLOW}⚠️   $1${RESET}"; }
log_step() { echo -e "\n${BOLD}▶  $1${RESET}"; }

echo ""
echo -e "${CYAN}╔══════════════════════════════════════════════════════════╗${RESET}"
echo -e "${CYAN}║           ResumeOS - Full Stack Application             ║${RESET}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════════╝${RESET}"

log_step "[1/6] Checking Node.js..."
if ! command -v node &>/dev/null; then
  echo "  ❌ Node.js not found. Install from https://nodejs.org (v18+)"
  exit 1
fi
log_ok "Node.js $(node --version)"

log_step "[2/6] Checking project structure..."
[ -f "$BACKEND/package.json" ] || { echo "  ❌ Backend not found"; exit 1; }
[ -f "$FRONTEND/package.json" ] || { echo "  ❌ Frontend not found"; exit 1; }
log_ok "Project structure OK"

log_step "[3/6] Environment files..."
if [ ! -f "$BACKEND/.env" ]; then
  cp "$BACKEND/.env.example" "$BACKEND/.env"
  echo -e "\n${YELLOW}  ╔══════════════════════════════════════════════════════╗"
  echo -e "  ║  ⚠️  Fill in backend/.env with your Supabase keys    ║"
  echo -e "  ║  Also run schema.sql in Supabase SQL Editor first!   ║"
  echo -e "  ║  AI key is configured via Admin Panel, not .env!      ║"
  echo -e "  ╚══════════════════════════════════════════════════════╝${RESET}\n"
  echo -e "  Press Enter after editing backend/.env..."
  read -r
else
  log_ok "backend/.env exists"
fi

if [ ! -f "$FRONTEND/.env.local" ]; then
  cp "$FRONTEND/.env.example" "$FRONTEND/.env.local"
  log_ok "frontend/.env.local created"
else
  log_ok "frontend/.env.local exists"
fi

log_step "[4/6] Installing packages..."
if [ ! -d "$BACKEND/node_modules" ]; then
  echo "  📦 Backend packages..."
  cd "$BACKEND" && npm install --prefer-offline 2>/dev/null || npm install
  log_ok "Backend installed"
else
  log_ok "Backend already installed"
fi

if [ ! -d "$FRONTEND/node_modules" ]; then
  echo "  📦 Frontend packages..."
  cd "$FRONTEND" && npm install --prefer-offline 2>/dev/null || npm install
  log_ok "Frontend installed"
else
  log_ok "Frontend already installed"
fi

log_step "[5/6] Seeding admin user..."
cd "$BACKEND"
if node src/db/seed.js; then
  log_ok "Admin user seeded"
else
  log_warn "Seed failed — check Supabase keys. Run manually: cd backend && node src/db/seed.js"
fi

log_step "[6/6] Starting servers..."

launch() {
  local title="$1"; local cmd="$2"
  if command -v osascript &>/dev/null; then
    osascript -e "tell app \"Terminal\" to do script \"$cmd\"" &>/dev/null
  elif command -v gnome-terminal &>/dev/null; then
    gnome-terminal --title="$title" -- bash -c "$cmd; exec bash" &
  elif command -v xterm &>/dev/null; then
    xterm -title "$title" -e "bash -c '$cmd; exec bash'" &
  else
    bash -c "$cmd" &
    echo "  Running in background (PID: $!)"
  fi
}

launch "ResumeOS Backend" "cd '$BACKEND' && npm run dev"
sleep 2
launch "ResumeOS Frontend" "cd '$FRONTEND' && npm run dev"

echo "  ⏳ Waiting 12 seconds..."
sleep 12

command -v xdg-open &>/dev/null && xdg-open "http://localhost:3000" &
command -v open &>/dev/null && open "http://localhost:3000"

echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════════╗${RESET}"
echo -e "${GREEN}║              ✅  ResumeOS is Running!                   ║${RESET}"
echo -e "${GREEN}╠══════════════════════════════════════════════════════════╣${RESET}"
echo -e "${GREEN}║  🌐 App    http://localhost:3000                         ║${RESET}"
echo -e "${GREEN}║  ⚙️  API    http://localhost:5000                         ║${RESET}"
echo -e "${GREEN}║                                                          ║${RESET}"
echo -e "${GREEN}║  🔐 Email    : admin@resumeos.com                        ║${RESET}"
echo -e "${GREEN}║     Password : Admin@123456                              ║${RESET}"
echo -e "${GREEN}║                                                          ║${RESET}"
echo -e "${GREEN}║  🤖 Enable AI: Login → /admin → AI Settings tab         ║${RESET}"
echo -e "${GREEN}║     No API key needed to start — AI is OFF by default   ║${RESET}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════╝${RESET}"
echo ""
