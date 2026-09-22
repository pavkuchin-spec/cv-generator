#!/usr/bin/env bash
# Compatibility wrapper. The Node implementation is cross-platform and owns
# workspace selection plus variant inference.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
exec node "$ROOT/scripts/rebuild.mjs" "$@"
