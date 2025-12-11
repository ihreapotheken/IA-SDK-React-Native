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
cd "$PROJECT_DIR/apps/demo" 

# Clean any temporary files.
ns clean

# Verify the build.
ns prepare android --release

# Move to native project location.
cd "$PROJECT_DIR/apps/demo/platforms/android"

# Build the Android project.
./gradlew assembleRelease

# Define the output location.
APK_OUTPUT_DIR="$PROJECT_DIR/apps/demo/platforms/android/app/build/outputs/apk/release"

# After the app is built, it needs to be aligned.
zipalign -v -p 4 \
  "$APK_OUTPUT_DIR/app-release.apk" \
  "$APK_OUTPUT_DIR/app-release-aligned.apk"

# Once the app is aligned, it needs to be signed.
apksigner sign \
  --ks "$PROJECT_DIR/tools/assets/App_Resources/Android/demo.jks" \
  --ks-key-alias demo \
  --ks-pass pass:Password1! \
  --out "$APK_OUTPUT_DIR/app-release.apk" \
  "$APK_OUTPUT_DIR/app-release-aligned.apk"

# Verify the signing process has completed successfully.
apksigner verify "$APK_OUTPUT_DIR/app-release.apk"

# Upload the APK to the Firebase app distribution service.
cd $PROJECT_DIR/apps/demo/platforms/android
./gradlew appDistributionUploadRelease

# Display an informative message.
set -a # Automatically export all variables
source $PROJECT_DIR/.env
set +a
sh $SCRIPT_DIR/info.sh \
    "Android React Native demo app version $APP_SDK_VERSION has been deployed with AppSDK version $ANDROID_APPSDK_VERSION."