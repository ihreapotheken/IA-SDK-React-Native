#!/usr/bin/env bash

# Sets up the development environment for script execution management.
#
# Usage:
#
# source ./scripts/dev-env-setup.sh

# Export ENV variables for build versioning.
if [[ -z "$APP_SDK_VERSION" || $0 == "dev-env-setup.sh" ]]; then
  # Define the library version number.
  export APP_SDK_BUILD_VERSION="$(date +%Y.%m.%d)"
  echo "APP_SDK_BUILD_VERSION $APP_SDK_BUILD_VERSION"
  # Define the build version number.
  export APP_SDK_BUILD_NUMBER="$(date +'%H*60+%M' | bc)"
  echo "APP_SDK_BUILD_NUMBER $APP_SDK_BUILD_NUMBER"
  # Export library and app version numbers.
  export APP_SDK_VERSION="$APP_SDK_BUILD_VERSION.$APP_SDK_BUILD_NUMBER"
  echo "APP_SDK_VERSION $APP_SDK_VERSION"
fi
