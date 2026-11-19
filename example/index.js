import { AppRegistry } from 'react-native';
import { IA_E2E } from './src/generatedEnvConfig';

// One component per build flavor, named after it: the native app launches the
// one of its flavor (Android `BuildConfig.FLAVOR`, iOS the `IA_FLAVOR` build
// setting), and React Native loads only the modules of the component it
// launches. That matters for the showcase, whose Android build leaves out the
// native libraries of modules the demo uses.
//
// With IA_E2E=true (see metro.config.js) the demo boots a minimal SDK-init
// smoke entry used by the cross-platform E2E test instead.
AppRegistry.registerComponent('demo', () =>
  IA_E2E
    ? require('./src/e2e/SmokeApp').default
    : require('./src/demo/DemoApp').default
);
AppRegistry.registerComponent(
  'showcase',
  () => require('./src/prescription-upload-showcase/ShowcaseApp').default
);
