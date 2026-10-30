#!/usr/bin/env bash
# Called by mac.sh and linux.sh on every launch. Re-runs setup-llama.sh when an installed
# llama.cpp backend is older than the release pinned in setup-llama.sh, so existing installs
# pick up backend fixes without a full repair. Never blocks launch: failures only warn.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$(dirname "$SCRIPT_DIR")")"
LLM_ROOT="$ROOT_DIR/app/llm-backend"

REQUIRED="${LLAMA_RELEASE:-$(sed -n 's/^RELEASE="\${LLAMA_RELEASE:-\([^}]*\)}"$/\1/p' "$SCRIPT_DIR/setup-llama.sh" | head -n 1)}"
[[ -n "$REQUIRED" && -d "$LLM_ROOT" ]] || exit 0

STALE=""
while IFS= read -r server; do
  dir="$(dirname "$server")"
  installed="$(cat "$dir/.llama-release" 2>/dev/null || true)"
  if [[ "$installed" != "$REQUIRED" ]]; then
    STALE="$dir (${installed:-unknown})"
    break
  fi
done < <(find "$LLM_ROOT" -mindepth 3 -maxdepth 3 -name llama-server -type f 2>/dev/null)

[[ -n "$STALE" ]] || exit 0

echo ""
echo "  Updating the llama.cpp text backend to $REQUIRED (installed: $STALE)..."
if bash "$SCRIPT_DIR/setup-llama.sh"; then
  echo "  llama.cpp text backend updated."
else
  echo "  [WARN] Could not update the llama.cpp backend (offline?). Continuing with the installed version." >&2
fi
exit 0
