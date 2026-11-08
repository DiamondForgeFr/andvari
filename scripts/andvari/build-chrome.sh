#!/usr/bin/env bash
# Builds the GPL variant of the Andvari browser extension for Chrome (MV3),
# checks it carries no commercial code, and zips it.
#
# Usage: scripts/andvari/build-chrome.sh
# Output: apps/browser/build/ (load unpacked) and dist/andvari-chrome-<version>.zip
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
BROWSER="$ROOT/apps/browser"
BUILD="$BROWSER/build"

cd "$BROWSER"
rm -rf "$BUILD"
NODE_ENV=production npm run build:chrome

# GPL variant only: nothing from bitwarden_license/, never the commercial SDK.
if grep -rIl --exclude='*.map' -e 'bitwarden_license' -e 'commercial-sdk-internal' "$BUILD" >/dev/null; then
  echo "✗ The build contains commercial code:" >&2
  grep -rIl --exclude='*.map' -e 'bitwarden_license' -e 'commercial-sdk-internal' "$BUILD" >&2
  exit 1
fi

VERSION="$(node -p "require('$BUILD/manifest.json').version")"
EXTENSION_ID="$(node "$ROOT/scripts/andvari/extension-id.js" "$BUILD/manifest.json")"

mkdir -p "$ROOT/dist"
ZIP="$ROOT/dist/andvari-chrome-$VERSION.zip"
rm -f "$ZIP"
(cd "$BUILD" && zip -qr -X "$ZIP" . -x '*.map')

echo "✓ Andvari $VERSION for Chrome"
echo "  unpacked:     $BUILD"
echo "  zip:          $ZIP"
echo "  extension ID: $EXTENSION_ID"
