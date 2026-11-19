#!/bin/bash

# Syncs the iOS demo app display name with the server environment configured in
# the monorepo .env (SERVER_ENVIRONMENT), so the home screen advertises which
# backend the build points at (DEV/QA/PROD). Android derives the same label at
# build time in example/android/app/build.gradle and the JS side gets it from
# example/metro.config.js, so only the iOS project needs writing here: the
# IA_DISPLAY_NAME build setting of the demo's Debug and Release configurations,
# which Info.plist uses as the display name. The other flavors' names, such as
# the showcase's, don't carry the label.
#
# Usage:
#
# sh ./scripts/sync-app-label.sh

# Declare script and project paths.
SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)
PROJECT_DIR="$SCRIPT_DIR/.."
PBXPROJ="$PROJECT_DIR/example/ios/IaSdkReactNativeExample.xcodeproj/project.pbxproj"
APP_LABEL_BASE="AppSDK React Native Demo"

# Read the configured server environment. An exported variable wins over .env.
if [ -z "$SERVER_ENVIRONMENT" ] && [ -f "$PROJECT_DIR/.env" ]; then
  SERVER_ENVIRONMENT=$(grep '^SERVER_ENVIRONMENT=' "$PROJECT_DIR/.env" \
    | tail -n 1 | cut -d '=' -f 2- | tr -d '"' | xargs)
fi

# Map the environment to the short label used by the native demo apps. The
# staging environment runs against the QA backend (api-qa.ia.de).
case "$SERVER_ENVIRONMENT" in
  development) ENV_LABEL="DEV" ;;
  production) ENV_LABEL="PROD" ;;
  *) ENV_LABEL="QA" ;;
esac

# Write the display name into the demo's build configurations.
sed -i '' -E "s/IA_DISPLAY_NAME = \"$APP_LABEL_BASE[^\"]*\";/IA_DISPLAY_NAME = \"$APP_LABEL_BASE $ENV_LABEL\";/" "$PBXPROJ" || exit 1

echo "iOS display name set to \"$APP_LABEL_BASE $ENV_LABEL\" (${SERVER_ENVIRONMENT:-staging})."
