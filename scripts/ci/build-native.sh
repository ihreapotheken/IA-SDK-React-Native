#!/usr/bin/env bash
# Build the native IA SDKs from a chosen branch and point THIS React Native wrapper
# at those local builds. Used by .github/workflows/native-from-branch.yml.
#
# Android: SDK modules → runner mavenLocal at NATIVE_VERSION; ANDROID_APPSDK_VERSION
#   pinned in the root .env (the gradle files consult mavenLocal(), and the unique
#   YYYY.MM.DD.MIN version isn't on GitHub Packages, so the local build is used).
# iOS: builds versioned XCFrameworks + local CocoaPods (scripts/ci/stage-ios-sdk.sh);
#   the example Podfile links them when IA_LOCAL_PODS_DIR is set (see example/ios/Podfile).
#   The pods dir is exported to $GITHUB_ENV so the pod-install/build step picks it up.
set -euo pipefail
cd "$(dirname "$0")/../.."
WRAPPER="$PWD"

PLATFORM="${PLATFORM:-all}"
DEV_ANDROID_DIR="${DEV_ANDROID_DIR:-$WRAPPER/../IA-SDK-Dev-Android}"
DEV_IOS_DIR="${DEV_IOS_DIR:-$WRAPPER/../IA-SDK-dev-ios}"
NATIVE_VERSION="${NATIVE_VERSION:-$(scripts/ci/native-version.sh)}"
export JAVA_HOME="${JAVA_HOME:-/opt/homebrew/opt/openjdk@17}"
export ANDROID_HOME="${ANDROID_HOME:-$HOME/Library/Android/sdk}"

say() { printf '\n\033[1m==> %s\033[0m\n' "$*"; }
sedi() { if sed --version >/dev/null 2>&1; then sed -i "$@"; else sed -i '' "$@"; fi; }
set_env_var() {  # KEY VALUE FILE
  local key="$1" val="$2" f="$3"; touch "$f"
  if grep -q "^${key}=" "$f"; then sedi -E "s|^${key}=.*|${key}=\"${val}\"|" "$f"
  else echo "${key}=\"${val}\"" >> "$f"; fi
}
# Expose a value to later workflow steps when running under Actions.
export_ci() { [ -n "${GITHUB_ENV:-}" ] && echo "$1=$2" >> "$GITHUB_ENV" || true; }

build_android() {
  [ -d "$DEV_ANDROID_DIR" ] || { echo "::error::DEV_ANDROID_DIR not found: $DEV_ANDROID_DIR"; exit 1; }
  say "Android: building SDK $NATIVE_VERSION → mavenLocal"
  sedi -E "s/^versionName=.*/versionName=$NATIVE_VERSION/" "$DEV_ANDROID_DIR/version.props"
  ( cd "$DEV_ANDROID_DIR" && ./gradlew --no-daemon publishToMavenLocal -x :app:assembleRelease )
  set_env_var ANDROID_APPSDK_VERSION "$NATIVE_VERSION" "$WRAPPER/.env"
  say "Android: wrapper pinned to ANDROID_APPSDK_VERSION=$NATIVE_VERSION"
}

build_ios() {
  [ -d "$DEV_IOS_DIR" ] || { echo "::error::DEV_IOS_DIR not found: $DEV_IOS_DIR"; exit 1; }
  local sha stage
  sha="$(git -C "$DEV_IOS_DIR" rev-parse --short HEAD)"
  stage="$HOME/.cache/ia-native/ios/$sha"
  if [ -f "$stage/VERSION" ]; then
    NATIVE_VERSION="$(cat "$stage/VERSION")"
    say "iOS: reusing cached XCFrameworks $NATIVE_VERSION ($sha)"
  else
    say "iOS: building XCFrameworks $NATIVE_VERSION from $sha"
    DEV_IOS_DIR="$DEV_IOS_DIR" NATIVE_VERSION="$NATIVE_VERSION" STAGE="$stage" \
      bash scripts/ci/stage-ios-sdk.sh
  fi
  set_env_var IOS_APPSDK_VERSION "$NATIVE_VERSION" "$WRAPPER/.env"
  export_ci IA_LOCAL_PODS_DIR "$stage/pods"
  say "iOS: example Podfile will link local pods from $stage/pods (IA_LOCAL_PODS_DIR)"
  echo "IA_LOCAL_PODS_DIR=$stage/pods"
}

echo "Wrapper: $WRAPPER | Platform: $PLATFORM | Version: $NATIVE_VERSION"
case "$PLATFORM" in
  all) build_android; build_ios ;;
  android) build_android ;;
  ios) build_ios ;;
  *) echo "::error::PLATFORM must be all|android|ios"; exit 1 ;;
esac
say "Done. Native SDK $NATIVE_VERSION wired into the wrapper."
