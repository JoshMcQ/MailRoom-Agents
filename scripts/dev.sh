#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
REPO_ROOT=$(cd "$SCRIPT_DIR/.." && pwd)

if ! command -v supabase >/dev/null; then
  echo "Supabase CLI is required. Install via https://supabase.com/docs/guides/cli" >&2
  exit 1
fi

cd "$REPO_ROOT"

supabase start
supabase db reset --non-interactive || true
npx turbo run dev --parallel
