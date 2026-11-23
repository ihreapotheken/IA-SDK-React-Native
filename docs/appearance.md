# Appearance

The appearance of SDK screens is set with `uiConfiguration` in the configuration you pass to `initialize`. This way
all adjustments are applied before the prerequisites run or any SDK screen is shown.

```typescript
await iaSdk.initialize({
  accessKey: 'ENTER YOUR API KEY HERE',
  clientId: 'ENTER YOUR CLIENT ID HERE',
  serverEnvironment: ServerEnvironment.Production,
  shouldFetchThemeFromRemote: false, // See Remote Theme below.
  uiConfiguration: {
    // Appearance options described below.
  },
});
```

Colors are ARGB numbers, e.g. `0xFF1E88E5`.

## Navigation Bar Appearance

The Navigation Bar used throughout SDKs generates colors based on the Primary Color set on BEP. You can override these
colors using the header configuration like so:

```typescript
uiConfiguration: {
  header: {
    primaryColor: 0xFF1E88E5,
    secondaryColor: 0xFF43A047,
  },
}
```

The secondary color corresponds to the color of the custom graphic in the background of the Navigation Bar. You can
remove the custom graphic by doing the following:

```typescript
uiConfiguration: {
  header: {
    style: IaHeaderStyle.Monotone, // default is Duotone
  },
}
```

## Primary & Secondary Buttons Appearance

You can adjust the appearance of Primary and Secondary Buttons by setting custom background, text and border colors,
border radius and border width, as well as customize their appearance when they are disabled. Here is an example of how
you can adjust the appearance of the Primary Button:

```typescript
uiConfiguration: {
  primaryButton: {
    backgroundColor: 0xFF990000,
    backgroundDisabledColor: 0xFF9E9E9E,
    textColor: 0xFFEEEEEE,
    textDisabledColor: 0xFF000000,
    borderColor: 0xFFBBBBBB,
    borderDisabledColor: 0xFF000000,
    borderWidth: 4,
    borderRadius: 0,
  },
}
```

The Secondary Button has the same properties as the Primary Button. To adjust its appearance, use `secondaryButton`
instead.

## Mascot Illustrations

SDK screens show the Pharmi mascot illustrations. If your app shouldn't carry Ihre Apotheken character branding (e.g. a
white-label app), you can hide them. The surrounding layout collapses, so no empty space is left behind:

```typescript
uiConfiguration: {
  shouldShowMascotIllustrations: false,
}
```

## Remote Theme

The theme of SDK screens can be loaded remotely, with `shouldFetchThemeFromRemote`. When it's set to `true`,
`initialize` fetches the whole color palette and the fonts configured for your API key, so the SDK screens match your
brand without any code changes. When it's `false` (the default), only the SDK's local theme and your
`uiConfiguration` are used.

```typescript
await iaSdk.initialize({
  // ...
  shouldFetchThemeFromRemote: true,
});
```

## iOS specific

### Liquid Glass

IA SDKs support Liquid Glass, starting from iOS 26.0, and use it by default.

If your app runs in compatibility mode (`UIDesignRequiresCompatibility` set to `true` in `ios/<YourApp>/Info.plist`,
see [Liquid Glass](https://github.com/ihreapotheken/IA-SDK-iOS/blob/main/Docs/iOSProjectSetup.md#4-liquid-glass) in the
iOS Project Setup guide), set `supportsLiquidGlass` to `false`:

```typescript
uiConfiguration: {
  supportsLiquidGlass: false,
}
```

**Note**: If your app runs in compatibility mode and you do not set `supportsLiquidGlass` to `false`, there will be
some visual artifacts. Once you build with Xcode 27 or later, remove `UIDesignRequiresCompatibility` from
`Info.plist` and keep `supportsLiquidGlass` at its default value `true`, because iOS 27 ignores the key for those apps
and always uses Liquid Glass.

### Bouncy ScrollViews

SDK screens use scroll views which have `bounces` enabled by default. If you wish to disable the native
bouncing of scroll views, add the following to your `ios/<YourApp>/AppDelegate.swift` before any SDK screen is shown:

```swift
UIScrollView.appearance().bounces = false
```

**Note**: This method is not recommended as it will disable bouncing for all native scroll views inside your app,
which might be unwanted behaviour.

### Changing Mascot Illustrations later

You can change `shouldShowMascotIllustrations` after `initialize` with:

```typescript
await iaSdk.setShouldShowMascotIllustrations(false);
```

Screens shown after the call use the new value.
