#!/bin/bash

# Syncs the iOS demo app display name with the server environment configured in
# the monorepo .env (SERVER_ENVIRONMENT), so the home screen advertises which
# backend the build points at (DEV/QA/PROD). Android derives the same label at
# build time in example/android/app/build.gradle and the JS side gets it from
# example/metro.config.js, so only the iOS Info.plist needs writing here.
#
# Usage:
#
# sh ./scripts/sync-app-label.sh

# Declare script and project paths.
SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)
PROJECT_DIR="$SCRIPT_DIR/.."
INFO_PLIST="$PROJECT_DIR/example/ios/IaSdkReactNativeExample/Info.plist"
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

# Write the display name into the iOS app Info.plist.
/usr/libexec/PlistBuddy -c "Set :CFBundleDisplayName $APP_LABEL_BASE $ENV_LABEL" "$INFO_PLIST"

echo "iOS display name set to \"$APP_LABEL_BASE $ENV_LABEL\" (${SERVER_ENVIRONMENT:-staging})."
