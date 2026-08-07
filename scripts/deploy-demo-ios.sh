#!/bin/bash

# Deploys the iOS demo app using the Testflight service.
#
# Usage:
#
# sh ./scripts/deploy-demo-ios.sh

# Declare script and project paths.
SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)
PROJECT_DIR="$SCRIPT_DIR/.."

# Setup the environment variables.
source $SCRIPT_DIR/dev-env-setup.sh

# Keep the app display name in step with the configured server environment.
# Abort on failure, so a build is never distributed under the wrong label.
sh $SCRIPT_DIR/sync-app-label.sh || exit 1

# Change current working directory.
cd "$PROJECT_DIR"

# Clean any temporary files.
npm install
yarn cache clean
watchman watch-del-all
rm -rf node_modules
rm -rf $TMPDIR/react-*
rm -rf $TMPDIR/metro-*
yarn install || exit 1

cd "$PROJECT_DIR/example"
bundle install || exit 1

# Install the pods, keeping the IA pods in step with IOS_APPSDK_VERSION in .env.
#
# A plain `pod install` cannot do this on its own: when the version constraint
# inside a development pod changes (the module podspecs read it from .env), it
# refuses to move the pod already pinned in Podfile.lock and fails with "could
# not find compatible versions". The affected pods have to be named explicitly,
# so they are read back out of the module podspecs rather than hardcoded here.
# The Podfile still runs React Native's codegen as part of the installation.
IA_PODS=$(
  {
    # Pods the modules depend on directly.
    grep -hoE "s\.dependency '(IA[A-Za-z]+)'" "$PROJECT_DIR"/packages/*/*.podspec \
      | sed -E "s/.*'(IA[A-Za-z]+)'.*/\1/"
    # Pods pulled in transitively (IACore, IOSKit) are pinned in Podfile.lock as
    # well, so they have to be unlocked together with their parents.
    if [ -f "$PROJECT_DIR/example/ios/Podfile.lock" ]; then
      sed -nE 's/^  - (IA[A-Za-z]+|IOSKit) \(.*/\1/p' "$PROJECT_DIR/example/ios/Podfile.lock"
    fi
  } | sort -u | tr '\n' ' '
)
if [ -z "$IA_PODS" ]; then
  echo "Could not determine the IA pods from the module podspecs in packages/."
  exit 1
fi
echo "Updating IA pods to the AppSDK version from .env: $IA_PODS"
cd "$PROJECT_DIR/example/ios"
bundle exec pod update $IA_PODS || exit 1
cd "$PROJECT_DIR"

# Define the iOS output file paths.
XCARCHIVE_PATH="$PROJECT_DIR/example/ios/build/ia-lib-demo.xcarchive"
IPA_DIR="$PROJECT_DIR/example/ios/build/ipa"

# Build the iOS demo app.
#
# Abort on failure. Without this the export below ships whatever archive is left
# at XCARCHIVE_PATH from an earlier build, and the script still reports a
# successful deploy.
xcodebuild archive \
  -workspace $PROJECT_DIR/example/ios/IaSdkReactNativeExample.xcworkspace \
  -scheme IaSdkReactNativeExample \
  -allowProvisioningUpdates \
  -archivePath $XCARCHIVE_PATH || exit 1

# Export the archive to Testflight.
xcodebuild -exportArchive \
  -archivePath $XCARCHIVE_PATH \
  -exportOptionsPlist "$PROJECT_DIR/example/ios/ExportOptions.plist" \
  -allowProvisioningUpdates \
  -exportPath "$PROJECT_DIR/example/ios/build/ios/archive/" || exit 1

# Display an informative message.
set -a # Automatically export all variables
source $PROJECT_DIR/.env
set +a
sh $SCRIPT_DIR/info.sh \
    "iOS React Native demo app version $APP_SDK_VERSION has been deployed with AppSDK version $IOS_APPSDK_VERSION."