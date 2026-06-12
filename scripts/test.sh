#!/usr/bin/env bash
# Führt alle Unit-Tests für Backend und Frontend aus.
# Aufruf: ./scripts/test.sh [--coverage]

set -euo pipefail

COVERAGE=""
if [[ "${1:-}" == "--coverage" ]]; then
  COVERAGE=":coverage"
fi

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

RED='\033[0;31m'
GREEN='\033[0;32m'
BOLD='\033[1m'
RESET='\033[0m'

echo ""
echo -e "${BOLD}============================================${RESET}"
echo -e "${BOLD}  Home Inventory — Test Suite${RESET}"
echo -e "${BOLD}============================================${RESET}"
echo ""

BACKEND_OK=0
FRONTEND_OK=0

# --- Backend ---
echo -e "${BOLD}▶  Backend (Vitest / Node)${RESET}"
echo "--------------------------------------------"
if cd "$ROOT_DIR/backend" && npm run "test${COVERAGE}" -- --reporter=verbose; then
  BACKEND_OK=1
fi

echo ""

# --- Frontend ---
echo -e "${BOLD}▶  Frontend (Vitest / jsdom)${RESET}"
echo "--------------------------------------------"
if cd "$ROOT_DIR/frontend" && npm run "test${COVERAGE}" -- --reporter=verbose; then
  FRONTEND_OK=1
fi

echo ""
echo -e "${BOLD}============================================${RESET}"
echo -e "${BOLD}  Ergebnis${RESET}"
echo -e "${BOLD}============================================${RESET}"

if [[ $BACKEND_OK -eq 1 ]]; then
  echo -e "  Backend:  ${GREEN}✓ bestanden${RESET}"
else
  echo -e "  Backend:  ${RED}✗ fehlgeschlagen${RESET}"
fi

if [[ $FRONTEND_OK -eq 1 ]]; then
  echo -e "  Frontend: ${GREEN}✓ bestanden${RESET}"
else
  echo -e "  Frontend: ${RED}✗ fehlgeschlagen${RESET}"
fi

echo ""

if [[ $BACKEND_OK -eq 1 && $FRONTEND_OK -eq 1 ]]; then
  echo -e "${GREEN}${BOLD}Alle Tests bestanden.${RESET}"
  exit 0
else
  echo -e "${RED}${BOLD}Mindestens eine Test-Suite ist fehlgeschlagen.${RESET}"
  exit 1
fi
