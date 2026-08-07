#!/bin/bash

# Deploys the demo apps using the Firebase App Tester (Android) and Testflight (iOS).
#
# Usage:
#
# sh ./scripts/deploy-demo.sh

# Declare script and project paths.
SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)
PROJECT_DIR="$SCRIPT_DIR/.."

# Setup the environment variables.
source $SCRIPT_DIR/dev-env-setup.sh

# Change current working directory.
cd "$PROJECT_DIR" 

# Run the deploy processes.
#
# Abort on the first failing platform so a half-delivered pair of builds is never
# reported as a successful deploy.
sh $SCRIPT_DIR/deploy-demo-android.sh || exit 1
sh $SCRIPT_DIR/deploy-demo-ios.sh || exit 1

# Display an informative message.
set -a # Automatically export all variables
source $PROJECT_DIR/.env
set +a
sh $SCRIPT_DIR/info.sh \
    "Demo React Native apps version $APP_SDK_VERSION have been deployed with Android AppSDK version $ANDROID_APPSDK_VERSION and iOS AppSDK version $IOS_APPSDK_VERSION."