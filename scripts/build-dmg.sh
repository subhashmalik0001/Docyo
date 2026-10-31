#!/bin/bash
set -euo pipefail
# Packages dist/Docyo.app into a compressed macOS .dmg with an Applications drag-install link.
cd "$(dirname "$0")/.."

APP_PATH="${1:-$PWD/dist/Docyo.app}"
OUT_DMG="${2:-$PWD/dist/Docyo-macOS.dmg}"

if [[ ! -d "$APP_PATH" ]]; then
  echo "Error: $APP_PATH not found. Run ./scripts/build-app.sh first." >&2
  exit 1
fi

STAGE_DIR="$(mktemp -d "${TMPDIR:-/tmp}/docyo-dmg.XXXXXX")"
trap 'rm -rf "$STAGE_DIR"' EXIT

ditto "$APP_PATH" "$STAGE_DIR/Docyo.app"
ln -s /Applications "$STAGE_DIR/Applications"

rm -f "$OUT_DMG"
hdiutil create \
  -volname "Docyo" \
  -srcfolder "$STAGE_DIR" \
  -ov \
  -format UDZO \
  "$OUT_DMG"

# Optional Apple Developer ID signing + Notarization + Stapling (eliminates Gatekeeper prompt for all users)
if [[ -n "${DEVELOPER_ID_APPLICATION:-}" ]]; then
  codesign --force --timestamp --sign "$DEVELOPER_ID_APPLICATION" "$OUT_DMG"
  if [[ -n "${NOTARY_KEYCHAIN_PROFILE:-}" ]]; then
    xcrun notarytool submit "$OUT_DMG" --keychain-profile "$NOTARY_KEYCHAIN_PROFILE" --wait
    xcrun stapler staple "$OUT_DMG"
  fi
fi

printf 'Packaged %s\n' "$OUT_DMG"

