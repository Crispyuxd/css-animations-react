#!/usr/bin/env bash
# Build the widget-demos handover bundle from src/.
#
# Output:
#   widget-demos-handover/    Clean source folder (gitignored)
#   widget-demos-v<VER>.zip   Zip artifact ready to send to consumers
#
# Bump VERSION below when shipping a new drop. Tag the matching git
# commit (`git tag widget-demos-v1.0.0 && git push --tags`) so the
# zip is reproducible from the repo.

set -euo pipefail

VERSION="1.1.0"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/widget-demos-handover"
ZIP="$ROOT/widget-demos-v${VERSION}.zip"

echo "▶ Cleaning previous build..."
rm -rf "$OUT" "$ZIP"
mkdir -p "$OUT"/{components,hooks,lib,demos,styles,icons}

echo "▶ Copying source..."
cp -r "$ROOT/src/components/." "$OUT/components/"
cp "$ROOT/src/hooks/useTimeline.ts" "$OUT/hooks/"
cp "$ROOT/src/lib/"*.ts "$OUT/lib/"
cp "$ROOT/src/app/globals.css" "$OUT/styles/tokens.css"
# Components import inline-SVG icons from `@/icons` — must ship them or
# every consumer build breaks with TS2307 on `@/icons` and at runtime
# on the missing module. Bundled as a folder mirroring the src layout.
cp -r "$ROOT/src/icons/." "$OUT/icons/"

for d in escalation calendar shopify slack tavily custom-actions stripe leads forms button suggested-messages; do
  if [ -d "$ROOT/src/app/demos/$d" ]; then
    cp -r "$ROOT/src/app/demos/$d" "$OUT/demos/"
  fi
done

echo "▶ Writing package.json + README + INTEGRATION.md + index.ts..."
# These four files are not regenerated automatically — they live in
# scripts/handover-templates/ and get copied verbatim. Edit them there
# if you need to update the public API surface or docs.
cp "$ROOT/scripts/handover-templates/index.ts"        "$OUT/index.ts"
cp "$ROOT/scripts/handover-templates/package.json"    "$OUT/package.json"
cp "$ROOT/scripts/handover-templates/README.md"       "$OUT/README.md"
cp "$ROOT/scripts/handover-templates/INTEGRATION.md"  "$OUT/INTEGRATION.md"

echo "▶ Zipping..."
cd "$ROOT"
if command -v powershell >/dev/null 2>&1; then
  powershell -NoProfile -Command "Compress-Archive -Path '$OUT/*' -DestinationPath '$ZIP' -Force"
else
  cd "$OUT" && zip -rq "$ZIP" . && cd "$ROOT"
fi

SIZE=$(du -h "$ZIP" | cut -f1)
echo "✓ Built $ZIP ($SIZE)"
