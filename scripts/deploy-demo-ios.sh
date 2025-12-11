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

# Change current working directory.
cd "$PROJECT_DIR/apps/demo"

# Clean any temporary files.
ns clean

# Verify the build.
ns prepare ios --release

# Define the iOS output file paths.
XCARCHIVE_PATH="$PROJECT_DIR/apps/demo/platforms/ios/build/ia-lib-demo.xcarchive"
IPA_DIR="$PROJECT_DIR/apps/demo/platforms/ios/build/ipa"

# Build the iOS demo app.
xcodebuild archive \
  -workspace $PROJECT_DIR/apps/demo/platforms/ios/demo.xcworkspace \
  -scheme demo \
  -allowProvisioningUpdates \
  -archivePath $XCARCHIVE_PATH

# Export the archive to Testflight.
xcodebuild -exportArchive \
  -archivePath $XCARCHIVE_PATH \
  -exportOptionsPlist "$PROJECT_DIR/tools/assets/App_Resources/iOS/ExportOptions.plist" \
  -allowProvisioningUpdates \
  -exportPath "$PROJECT_DIR/demo/ios/build/ios/archive/"

# Display an informative message.
set -a # Automatically export all variables
source $PROJECT_DIR/.env
set +a
sh $SCRIPT_DIR/info.sh \
    "iOS React Native demo app version $APP_SDK_VERSION has been deployed with AppSDK version $IOS_APPSDK_VERSION."