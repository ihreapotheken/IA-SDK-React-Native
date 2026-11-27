#!/usr/bin/env bash
# Build the IA iOS SDK as versioned XCFrameworks from a dev-ios checkout and stage
# a self-contained LOCAL artifact that wrappers consume:
#   $STAGE/<Fw>/<Fw>.xcframework              the binaries (device + simulator)
#   $STAGE/<Fw>/<Fw>-<ver>.xcframework.zip    zipped, for archival
#   $STAGE/ReleaseRepo/Package.swift          local binary SwiftPM package (name "IASDK")
#   $STAGE/ReleaseRepo/Sources/<Fw>Wrapper/   empty shims that carry inter-framework deps
#   $STAGE/pods/<Fw>/<Fw>.podspec + .xcframework   local CocoaPods (for React Native)
#
# Because CardLink's link4health dependency is linked into the binary at build time,
# wrappers that consume these need NO netrc — only THIS build does.
#
#   DEV_IOS_DIR=/path/to/IA-SDK-dev-ios NATIVE_VERSION=2026.11.27.820 \
#   STAGE=/path/to/out bash stage-ios-sdk.sh
#
# Secrets expected in env (the IACore build compiles them in; SwiftPM auth for the
# private CardLink pkg): IASDK_*  and, for a clean runner, ~/.netrc from NETRC_*.
set -euo pipefail

DEV_IOS_DIR="${DEV_IOS_DIR:?set DEV_IOS_DIR}"
NATIVE_VERSION="${NATIVE_VERSION:?set NATIVE_VERSION}"
STAGE="${STAGE:?set STAGE}"
# Build order matters: IOSKit and IACore first (the rest link against them).
FRAMEWORKS=(IOSKit IACore IAOverTheCounter IAOrdering IAPharmacy IACardLink IAIntegrations IAPrescription)
# Framework → its *Wrapper target (IOSKit has none; it is a plain dependency).
WRAPPERS=(IACore IAOverTheCounter IAOrdering IAPharmacy IACardLink IAIntegrations IAPrescription)

say() { printf '\n\033[1m==> %s\033[0m\n' "$*"; }

[ -d "$DEV_IOS_DIR" ] || { echo "::error::DEV_IOS_DIR not found: $DEV_IOS_DIR"; exit 1; }

# OpenSSL-Swift version the CardLink framework was built against (for the SPM dep + podspec).
SSL_VERSION="$(sed -n -E 's#.*OpenSSL-Swift", exact: "([^"]+)".*#\1#p' "$DEV_IOS_DIR/Package.swift" | head -1)"
SSL_VERSION="${SSL_VERSION:-4.3.1}"

# IASDKSecrets placeholder so Xcode's build planner doesn't fail before the build
# phase regenerates it from .env (mtime set old so the phase re-runs).
GEN="$DEV_IOS_DIR/IACore/IACore/Generated/IASDKSecrets.swift"
if [ ! -f "$GEN" ]; then mkdir -p "$(dirname "$GEN")"; echo '// placeholder' > "$GEN"; touch -t 200001010000 "$GEN"; fi
# Write dev-ios/.env from IASDK_* if absent (the IACore build phase reads it).
if [ ! -f "$DEV_IOS_DIR/.env" ]; then
  {
    echo "IASDK_FILE_SERVICE_KEY=${IASDK_FILE_SERVICE_KEY:-}"
    echo "IASDK_LOGGER_ENCRYPTION_KEY=${IASDK_LOGGER_ENCRYPTION_KEY:-}"
    echo "IASDK_SSL_PINNING_DEACTIVATION_KEY=${IASDK_SSL_PINNING_DEACTIVATION_KEY:-}"
    echo "IASDK_REMOTE_CONFIGURATION_SECRET_KEY=${IASDK_REMOTE_CONFIGURATION_SECRET_KEY:-}"
  } > "$DEV_IOS_DIR/.env"
fi
if [ -n "${NETRC_USER:-}" ] && [ -n "${NETRC_TOKEN:-}" ] && [ ! -f "$HOME/.netrc" ]; then
  printf 'machine github.com\n  login %s\n  password %s\nmachine api.github.com\n  login %s\n  password %s\n' \
    "$NETRC_USER" "$NETRC_TOKEN" "$NETRC_USER" "$NETRC_TOKEN" > "$HOME/.netrc"
  chmod 600 "$HOME/.netrc"
fi

rm -rf "$STAGE"; mkdir -p "$STAGE/ReleaseRepo/Sources" "$STAGE/pods"

say "Building ${#FRAMEWORKS[@]} XCFrameworks $NATIVE_VERSION (OpenSSL $SSL_VERSION)"
BUILD_OUT="$DEV_IOS_DIR/Distribution/fastlane/build"
for fw in "${FRAMEWORKS[@]}"; do
  echo "--- $fw"
  ( cd "$DEV_IOS_DIR" && bash Distribution/create_xcframework --module "$fw" --name "$fw-$NATIVE_VERSION" )
  mkdir -p "$STAGE/$fw"
  cp -R "$BUILD_OUT/$fw/$fw.xcframework" "$STAGE/$fw/"
  cp "$BUILD_OUT/$fw/$fw-$NATIVE_VERSION.xcframework.zip" "$STAGE/$fw/"
done

say "Assembling local SwiftPM package → $STAGE/ReleaseRepo"
# The local template already uses path: "../<Fw>/<Fw>.xcframework" (relative to the
# package root) and has a single {{IACardLink_SSL}} placeholder.
sed "s/{{IACardLink_SSL}}/$SSL_VERSION/" \
  "$DEV_IOS_DIR/Distribution/fastlane/Resources/IASDK_package_template_local.swift" \
  > "$STAGE/ReleaseRepo/Package.swift"
for w in "${WRAPPERS[@]}"; do
  mkdir -p "$STAGE/ReleaseRepo/Sources/${w}Wrapper"
  printf ' \n' > "$STAGE/ReleaseRepo/Sources/${w}Wrapper/Empty.swift"
done

say "Assembling local CocoaPods → $STAGE/pods (for React Native)"
for fw in "${FRAMEWORKS[@]}"; do
  mkdir -p "$STAGE/pods/$fw"
  cp -R "$STAGE/$fw/$fw.xcframework" "$STAGE/pods/$fw/"
  # Local podspec: vendored local xcframework, version = NATIVE_VERSION.
  sed -e "s|{{FRAMEWORK_VERSION}}|$NATIVE_VERSION|g" \
      -e "s|{{SDK_VERSION}}|$NATIVE_VERSION|g" \
      -e "s|{{SSL_VERSION}}|$SSL_VERSION|g" \
      -e "s|:http => '{{FRAMEWORK_URL}}'|:path => '.'|g" \
      "$DEV_IOS_DIR/Distribution/fastlane/Resources/Podspecs/$fw.podspec" \
      > "$STAGE/pods/$fw/$fw.podspec"
done

echo "$NATIVE_VERSION" > "$STAGE/VERSION"
say "Staged iOS SDK $NATIVE_VERSION at $STAGE"
echo "SPM package: $STAGE/ReleaseRepo"
echo "Pods dir:    $STAGE/pods"
