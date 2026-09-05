#!/usr/bin/env bash
set -e

# ==============================================================================
# Cekcok Kotaku - Multi-Platform MinIO Deployment Script (macOS & Windows)
# ==============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$ROOT_DIR"

VERSION=$(node -p "require('./package.json').version")
echo "🚀 Starting build and MinIO deployment for Cekcok Kotaku v${VERSION}..."

MC_BIN="/opt/homebrew/bin/mc"
if ! command -v "$MC_BIN" &> /dev/null; then
    MC_BIN="mc"
fi

if ! command -v "$MC_BIN" &> /dev/null; then
    echo "❌ MinIO Client (mc) not found. Please install mc or configure PATH."
    exit 1
fi

# Detect which MinIO alias is available (priority: public-minio -> homelab)
TARGET_ALIAS="public-minio"
if ! $MC_BIN ls "$TARGET_ALIAS/cekcok-releases" &> /dev/null; then
    TARGET_ALIAS="homelab"
fi

echo "📦 Target MinIO alias: $TARGET_ALIAS"

# Ensure MinIO bucket exists and is public
echo "📦 Ensuring MinIO bucket '$TARGET_ALIAS/cekcok-releases' exists..."
$MC_BIN mb --ignore-existing "$TARGET_ALIAS/cekcok-releases" 2>/dev/null || true
$MC_BIN anonymous set download "$TARGET_ALIAS/cekcok-releases" 2>/dev/null || true

# Build Tauri application with signing key
KEY_PATH="$ROOT_DIR/cekcok-kotaku.key"
if [ ! -f "$KEY_PATH" ]; then
    echo "❌ Signing key not found at $KEY_PATH."
    exit 1
fi

export TAURI_SIGNING_PRIVATE_KEY="$(cat "$KEY_PATH")"
export TAURI_SIGNING_PRIVATE_KEY_PATH="$KEY_PATH"
export TAURI_SIGNING_PRIVATE_KEY_PASSWORD=""
export TAURI_PRIVATE_KEY="$TAURI_SIGNING_PRIVATE_KEY"
export TAURI_KEY_PASSWORD=""

echo "🔨 Building Web Frontend..."
pnpm run build

echo "🔨 Building Tauri native bundle & updater artifacts..."
pnpm tauri build

BUNDLE_DIR="$ROOT_DIR/src-tauri/target/release/bundle"

echo "📤 Uploading build artifacts to MinIO ($TARGET_ALIAS/cekcok-releases)..."

# Download existing kotaku-latest.json if available to preserve multi-platform manifests
TEMP_MANIFEST="$ROOT_DIR/src-tauri/target/kotaku-latest.json"
$MC_BIN cp "$TARGET_ALIAS/cekcok-releases/kotaku-latest.json" "$TEMP_MANIFEST" 2>/dev/null || echo "{}" > "$TEMP_MANIFEST"

PUB_DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# 1. Handle macOS DMG & Updater Bundle
if [ -d "$BUNDLE_DIR/dmg" ] || [ -d "$BUNDLE_DIR/macos" ]; then
    DMG_FILE=$(find "$BUNDLE_DIR/dmg" -name "*.dmg" 2>/dev/null | head -n 1)
    if [ -n "$DMG_FILE" ] && [ -f "$DMG_FILE" ]; then
        DMG_NAME=$(basename "$DMG_FILE")
        echo "Uploading macOS DMG: $DMG_NAME"
        $MC_BIN cp "$DMG_FILE" "$TARGET_ALIAS/cekcok-releases/$DMG_NAME"
        $MC_BIN cp "$DMG_FILE" "$TARGET_ALIAS/cekcok-releases/CekcokKotaku-macos.dmg"
        $MC_BIN cp "$DMG_FILE" "$TARGET_ALIAS/cekcok-releases/CekcokKotaku.dmg"
    fi

    MACOS_TAR=$(find "$BUNDLE_DIR/macos" -name "*.tar.gz" 2>/dev/null | head -n 1)
    MACOS_SIG=$(find "$BUNDLE_DIR/macos" -name "*.tar.gz.sig" 2>/dev/null | head -n 1)

    if [ -n "$MACOS_TAR" ] && [ -f "$MACOS_TAR" ] && [ -n "$MACOS_SIG" ] && [ -f "$MACOS_SIG" ]; then
        TAR_NAME=$(basename "$MACOS_TAR")
        SIG_CONTENT=$(cat "$MACOS_SIG")

        echo "Uploading macOS Updater Archive: $TAR_NAME"
        $MC_BIN cp "$MACOS_TAR" "$TARGET_ALIAS/cekcok-releases/$TAR_NAME"
        $MC_BIN cp "$MACOS_SIG" "$TARGET_ALIAS/cekcok-releases/${TAR_NAME}.sig"

        ARCH=$(uname -m)
        PLATFORM_KEY="darwin-x86_64"
        if [ "$ARCH" = "arm64" ]; then
            PLATFORM_KEY="darwin-aarch64"
        fi

        export SIG_CONTENT
        node -e "
        const fs = require('fs');
        const p = '$TEMP_MANIFEST';
        let data = {};
        try { data = JSON.parse(fs.readFileSync(p, 'utf8')); } catch(e){}
        data.version = '$VERSION';
        data.notes = 'Cekcok Kotaku v$VERSION update.';
        data.pub_date = '$PUB_DATE';
        data.platforms = data.platforms || {};
        data.platforms['$PLATFORM_KEY'] = {
            signature: process.env.SIG_CONTENT,
            url: 'https://releases.cekcok.my.id/cekcok-releases/$TAR_NAME'
        };
        fs.writeFileSync(p, JSON.stringify(data, null, 2));
        "
    fi
fi

# 2. Handle Windows NSIS / MSI & Updater Bundle
if [ -d "$BUNDLE_DIR/nsis" ]; then
    EXE_FILE=$(find "$BUNDLE_DIR/nsis" -name "*.exe" 2>/dev/null | head -n 1)
    if [ -n "$EXE_FILE" ] && [ -f "$EXE_FILE" ]; then
        EXE_NAME=$(basename "$EXE_FILE")
        echo "Uploading Windows EXE: $EXE_NAME"
        $MC_BIN cp "$EXE_FILE" "$TARGET_ALIAS/cekcok-releases/$EXE_NAME"
        $MC_BIN cp "$EXE_FILE" "$TARGET_ALIAS/cekcok-releases/CekcokKotaku-windows.exe"
        $MC_BIN cp "$EXE_FILE" "$TARGET_ALIAS/cekcok-releases/CekcokKotaku-setup.exe"
    fi

    WIN_SIG=$(find "$BUNDLE_DIR/nsis" -name "*-setup.exe.sig" 2>/dev/null | head -n 1)
    if [ -n "$WIN_SIG" ] && [ -f "$WIN_SIG" ]; then
        SIG_NAME=$(basename "$WIN_SIG")
        WIN_SIG_CONTENT=$(cat "$WIN_SIG")
        $MC_BIN cp "$WIN_SIG" "$TARGET_ALIAS/cekcok-releases/$SIG_NAME"

        export WIN_SIG_CONTENT
        node -e "
        const fs = require('fs');
        const p = '$TEMP_MANIFEST';
        let data = {};
        try { data = JSON.parse(fs.readFileSync(p, 'utf8')); } catch(e){}
        data.version = '$VERSION';
        data.notes = 'Cekcok Kotaku v$VERSION update.';
        data.pub_date = '$PUB_DATE';
        data.platforms = data.platforms || {};
        data.platforms['windows-x86_64'] = {
            signature: process.env.WIN_SIG_CONTENT,
            url: 'https://releases.cekcok.my.id/cekcok-releases/' + '$EXE_NAME'
        };
        fs.writeFileSync(p, JSON.stringify(data, null, 2));
        "
    fi
fi

if [ -f "$TEMP_MANIFEST" ]; then
    echo "Uploading kotaku-latest.json for auto-updater..."
    $MC_BIN cp "$TEMP_MANIFEST" "$TARGET_ALIAS/cekcok-releases/kotaku-latest.json"
fi

echo "=============================================================================="
echo "✅ Deployment to MinIO Complete!"
echo "🌐 Public Download Base:   https://releases.cekcok.my.id/cekcok-releases/"
echo "📥 Static macOS DMG:       https://releases.cekcok.my.id/cekcok-releases/CekcokKotaku-macos.dmg"
echo "📥 Static Windows EXE:     https://releases.cekcok.my.id/cekcok-releases/CekcokKotaku-windows.exe"
echo "🔄 Updater Endpoint:       https://releases.cekcok.my.id/cekcok-releases/kotaku-latest.json"
echo "=============================================================================="
