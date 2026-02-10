#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  bash scripts/docs.sh serve
  bash scripts/docs.sh build

Creates/uses a local venv at .venv-docs, installs requirements-docs.txt,
then runs MkDocs.

For build, also generates TypeDoc output and publishes it into out/site/api/reference/.
For both serve/build, TypeDoc is staged under docs/api/reference/ so MkDocs can
link-check it in strict mode, then cleaned up on exit.
EOF
}

if [[ $# -ne 1 ]]; then
  usage
  exit 2
fi

cmd="$1"

python="${PYTHON:-python3}"
venv_dir=".venv-docs"
typedoc_stage_dir="docs/api/reference"
typedoc_stage_marker="${typedoc_stage_dir}/.rezi-typedoc-staged"

if [[ ! -d "${venv_dir}" ]]; then
  "${python}" -m venv "${venv_dir}"
fi

source "${venv_dir}/bin/activate"

python -m pip install --upgrade pip >/dev/null
python -m pip install -r requirements-docs.txt >/dev/null

cleanup() {
  if [[ -f "${typedoc_stage_marker}" ]]; then
    rm -rf "${typedoc_stage_dir}"
  fi
}

trap cleanup EXIT

stage_typedoc() {
  if [[ ! -d out/typedoc ]]; then
    return 0
  fi

  rm -rf "${typedoc_stage_dir}"
  mkdir -p "${typedoc_stage_dir}"
  touch "${typedoc_stage_marker}"
  cp -R out/typedoc/. "${typedoc_stage_dir}/"
}

require_npm() {
  if ! command -v npm >/dev/null 2>&1; then
    echo "error: npm is required to generate TypeDoc for the API reference" >&2
    exit 2
  fi
}

case "${cmd}" in
  serve)
    require_npm
    npm run docs:api
    stage_typedoc
    mkdocs serve
    ;;
  build)
    require_npm
    npm run docs:api
    stage_typedoc
    mkdocs build --strict
    ;;
  *)
    usage
    exit 2
    ;;
esac
