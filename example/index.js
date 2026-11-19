import { AppRegistry } from 'react-native';
import { name as appName } from './app.json';
import { IA_E2E } from './src/generatedEnvConfig';

// The demo flavor's entry. Every flavor has its own (index.<flavor>.js), so a
// flavor's JS bundle holds only its app; the native app loads the one of its
// flavor, see README.md → Flavors.
//
// With IA_E2E=true (see metro.config.js) the demo boots a minimal SDK-init
// smoke entry used by the cross-platform E2E test instead.
AppRegistry.registerComponent(appName, () =>
  IA_E2E
    ? require('./src/e2e/SmokeApp').default
    : require('./src/demo/DemoApp').default
);
