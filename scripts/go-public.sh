#!/usr/bin/env bash
# Publish the notebook: make this repository public, turn on GitHub Pages
# (built by .github/workflows/pages.yml), deploy, then play the live site.
#
# Run once, by the repository owner, from the repository root:
#
#   scripts/go-public.sh
#
# To undo the visibility change:
#
#   gh repo edit miethe/bottega --visibility private --accept-visibility-change-consequences
set -euo pipefail

REPO="miethe/bottega"
URL="https://nick.miethe.dev/bottega/"

echo "1/4 visibility: public"
gh repo edit "$REPO" --visibility public --accept-visibility-change-consequences

echo "2/4 pages: build from the workflow"
if ! gh api "repos/$REPO/pages" >/dev/null 2>&1; then
  gh api -X POST "repos/$REPO/pages" -f build_type=workflow >/dev/null
fi

echo "3/4 deploy"
gh workflow run pages -R "$REPO"

echo "    waiting for $URL"
code=000
for _ in $(seq 1 60); do
  code=$(curl -s -o /dev/null -w '%{http_code}' "$URL" || true)
  if [ "$code" = "200" ] && [ "$(curl -s "$URL" | grep -c "Bottega")" -gt 0 ]; then break; fi
  code=000
  sleep 10
done
if [ "$code" != "200" ]; then
  echo "The page did not answer within ten minutes. Check: gh run list -R $REPO" >&2
  exit 1
fi

echo "4/4 play the live pages"
npm run e2e:live

echo "Live: $URL"
