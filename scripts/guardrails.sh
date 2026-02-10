#!/usr/bin/env bash
set -euo pipefail

# scripts/guardrails.sh — repo hygiene checks for CI.

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if ! command -v rg >/dev/null 2>&1; then
  echo "error: ripgrep (rg) is required for guardrails" >&2
  exit 2
fi

run_rg() {
  rg --no-heading --line-number --with-filename -S \
    --glob '!scripts/guardrails.sh' \
    --glob '!vendor/**' \
    --glob '!packages/native/vendor/**' \
    --glob '!**/node_modules/**' \
    --glob '!**/dist/**' \
    "$@"
}

has_violations=0

print_section() {
  echo
  echo "== $1 =="
}

check_pattern() {
  local label="$1"
  local pattern="$2"
  shift 2

  print_section "${label}"
  local hits
  hits="$(run_rg "${pattern}" "${repo_root}" || true)"
  if [[ -n "${hits}" ]]; then
    echo "${hits}"
    has_violations=1
  else
    echo "ok"
  fi
}

check_pattern "No legacy package scope" "@zireael-ui/"
check_pattern "No legacy product name form" "\\bZireael\\s+UI\\b"
check_pattern "No TODO/FIXME markers" "\\b(TODO|FIXME)\\b"
check_pattern "No AI-generated markers" "AI-generated"

if [[ "${has_violations}" -ne 0 ]]; then
  echo
  echo "guardrails: FAILED" >&2
  exit 1
fi

echo
echo "guardrails: OK"
