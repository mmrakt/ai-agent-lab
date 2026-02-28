#!/usr/bin/env bash
# ------------------------------------------------------------------
# enforce-pnpm.sh
# Copilot hook (PreToolUse) – block npm / yarn / bun / npx commands.
# Only pnpm (including pnpm dlx) is allowed in this monorepo.
# ------------------------------------------------------------------
set -euo pipefail

INPUT=$(cat)

TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // empty')

# Only inspect terminal-related tools
case "$TOOL_NAME" in
  run_in_terminal|runInTerminal|terminal|shell)
    ;;
  *)
    # Not a terminal tool – allow unconditionally
    echo '{}'
    exit 0
    ;;
esac

# Extract the command string from tool_input
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')
if [ -z "$COMMAND" ]; then
  echo '{}'
  exit 0
fi

# ---------------------------------------------------------------
# Pattern: match npm / npx / yarn / bun at a word boundary when
# used as a standalone command (not inside a larger word like pnpm).
#
# Allowed:  pnpm install, pnpm dlx, pnpm exec …
# Blocked:  npm install, npx create-react-app, yarn add, bun add …
#
# We also catch prefixed invocations such as:
#   sudo npm …, command npm …, env npm …
# ---------------------------------------------------------------
# Strip leading whitespace, env/sudo/command prefixes for detection
STRIPPED=$(echo "$COMMAND" | sed -E 's/^[[:space:]]*(sudo|command|env)[[:space:]]+//')

# Check if the (stripped) command starts with a forbidden package manager
if echo "$STRIPPED" | grep -qE '^(npm|npx|yarn|bun)(\s|$)'; then
  # Verify it's NOT pnpm (pnpm starts with 'p', so the regex above won't match,
  # but double-check for safety)
  if echo "$STRIPPED" | grep -qE '^pnpm(\s|$)'; then
    echo '{}'
    exit 0
  fi

  # Determine which manager was detected (for the message)
  DETECTED=$(echo "$STRIPPED" | grep -oE '^(npm|npx|yarn|bun)')

  cat <<EOF
{
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "permissionDecision": "deny",
    "permissionDecisionReason": "⛔ '${DETECTED}' is not allowed in this repository. Use 'pnpm' instead (or 'pnpm dlx' instead of 'npx')."
  }
}
EOF
  exit 0
fi

# Also catch piped / chained usages:  … && npm install, … | npm …
if echo "$COMMAND" | grep -qE '(;|&&|\|\|?)\s*(sudo\s+)?(npm|npx|yarn|bun)(\s|$)'; then
  DETECTED=$(echo "$COMMAND" | grep -oE '(npm|npx|yarn|bun)' | head -1)
  cat <<EOF
{
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "permissionDecision": "deny",
    "permissionDecisionReason": "⛔ '${DETECTED}' is not allowed in this repository. Use 'pnpm' instead (or 'pnpm dlx' instead of 'npx')."
  }
}
EOF
  exit 0
fi

# All checks passed – allow the command
echo '{}'
exit 0
