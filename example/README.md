# IA SDK React Native Example App

This is a demo application showcasing the `@ihreapotheken/ia-sdk-react-native` library.

## Prerequisites

- Node.js >= 20
- [React Native development environment](https://reactnative.dev/docs/set-up-your-environment) set up for iOS and/or Android
- For iOS: CocoaPods installed (`gem install cocoapods`)

## Secrets Setup

Before running the app, you need to configure your secrets:

1. Copy the example secrets file:
   ```sh
   cp .secrets.example .secrets
   ```

2. Edit `.secrets` and add your access key:
   ```
   APPSDK_ACCESS_KEY=your_access_key_here
   ```

The app will throw an error on startup if `APPSDK_ACCESS_KEY` is not configured.

## Installation

From the repository root:

```sh
yarn install
```

For iOS, install CocoaPods dependencies:

```sh
cd example/ios && bundle install && bundle exec pod install && cd ../..
```

## Running the App

### Start Metro Bundler

```sh
cd example
yarn start
```

If you've made changes to `.secrets`, clear the cache:

```sh
yarn start --reset-cache
```

### Run on Android

```sh
yarn android
```

### Run on iOS

```sh
yarn ios
```

## Demo Features

The example app demonstrates the following SDK capabilities:

- **Initialize** - Initialize the SDK with your access key
- **Start Dashboard Activity** - Launch the SDK dashboard
- **Logout** - Log out the current user
- **Set Guest User Data** - Configure guest user information
- **Clear Cart** - Clear the shopping cart
- **Transfer Prescriptions** - Transfer prescription data

## Troubleshooting

### Metro cache issues

If secrets aren't being picked up, reset the Metro cache:

```sh
yarn start --reset-cache
```

### iOS build issues

Clean and reinstall pods:

```sh
cd ios && rm -rf Pods Podfile.lock && bundle exec pod install
```

### Android build issues

Clean the Gradle build:

```sh
cd android && ./gradlew clean
```
