# AppSDK React Native Module

React Native [Module](https://reactnative.dev/docs/the-new-architecture/create-module-library) project implemented with the ia.de AppSDK services.

## 1. General Info

---

The plugin implementation is based on the native AppSDK libraries developed by the ia.de team with Kotlin and Swift.

These native libraries offer both checkout services as well as view components in order to ensure seamless integration
with any client setup.

Public API Reference: https://ihreapotheken.github.io/docs/appsdk/react-native

## 2. Developer Setup

---

- [React Native SDK](https://reactnative.dev/docs/set-up-your-environment) 0.83.0 and up
- [Node Package Manager](https://docs.npmjs.com/getting-started) 11.6 and up
- [Github Token](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens) for native library access

## 3. Platform Support

---

The library is supported on both of the major mobile operating systems, with constraints noted below:

### Android

- Minimum SDK Version: `30`
- Target SDK Version: `36`
- Kotlin `2.1.0`
- Gradle `8.12.3`

### iOS

- Minimum iOS Version: `15`
- Xcode: `16.0`
- Swift `5.9`

## 4. Client Setup

---

For official reference, please see
[the NativeScript SDK documentation](https://reactnative.dev/docs/the-new-architecture/create-module-library)
on using modules.

### 4.1. Add the dependency to the `package.json` file

The library is accessed from Github NPM Package Registry.

Firstly, the location must be defined in your app's `.npmrc` file, located in the root of your project:

```
@ihreapotheken:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=YOUR_GITHUB_PAT
```

Make sure to replace `YOUR_GITHUB_PAT` with the actual value of your Github Personal Access Token.

Afterwards, the library can be installed from the command line:

```sh
npm install @ihreapotheken/ia-sdk-react-native@VERSION_NUMBER
```

The `VERSION_NUMBER` value can be referenced from the
[package release page](https://github.com/ihreapotheken/IA-SDK-React-Native/pkgs/npm/ia-sdk-react-native).

### 4.2. Plugin usage

Methods and properties made available as public APIs implemented with the `IaSdk` object.

The client setup requires instantiation of this object for usage:

```ts
import { IaSdk } from 'ia-sdk-react-native';

export class MyAppClass {
  iaSdk = new IaSdk();
}
```

You may then proceed with API usages on this object:

```ts
	async initialize() {
		try {
			await this.iaSdk.initIaSdk(
				isAndroid
					? "a1f4b6e3c7d58f9032eeaa1bc02b4f44f9863d1e5c7a49f7d23e0c96b17af5cd"
					: "e9f3d6a12c4b8f75d1e0a93c5b7d6e2f3c1a9b8e7f4d2c0a1b6e5d3f8c7a1b9e",
				"5004",
				IaSdkBase.ServerEnvironment.Staging,
			);
		} catch (error) {
			console.error("Init failed:", error);
		}
	}
```

---

For further information, please see the
[API reference](https://ihreapotheken.github.io/docs/appsdk/react-native).
