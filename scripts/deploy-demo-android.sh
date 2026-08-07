#!/bin/bash

# Deploys the Android demo app using the Firebase App Tester service.
#
# Usage:
#
# sh ./scripts/deploy-demo-android.sh

# Declare script and project paths.
SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)
PROJECT_DIR="$SCRIPT_DIR/.."

# Setup the environment variables.
source $SCRIPT_DIR/dev-env-setup.sh

# Change current working directory.
cd "$PROJECT_DIR/" 

# Install any missing prerequisite dependencies.
npm install
yarn cache clean
watchman watch-del-all
rm -rf node_modules
rm -rf $TMPDIR/react-*
rm -rf $TMPDIR/metro-*
yarn install || exit 1

# Move to native project location.
cd "$PROJECT_DIR/example/android"

# Build the Android project. Gradle handles zipalign + V1/V2 signing as part
# of assembleRelease using the signingConfigs.release config in build.gradle,
# which reads credentials from app/key.properties (written by CI from a
# GitHub secret) and falls back to local defaults otherwise.
#
# Abort on failure. Without this the upload below distributes whatever APK is
# left in the output directory from an earlier build, and the script still
# reports a successful deploy.
./gradlew assembleRelease || exit 1

# Upload the APK to the Firebase app distribution service.
./gradlew appDistributionUploadRelease || exit 1

# Display an informative message.
set -a # Automatically export all variables
source $PROJECT_DIR/.env
set +a
sh $SCRIPT_DIR/info.sh \
    "Android React Native demo app version $APP_SDK_VERSION has been deployed with AppSDK version $ANDROID_APPSDK_VERSION."