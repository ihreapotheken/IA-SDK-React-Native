import { AppRegistry } from 'react-native';
import App from './src/App';
import SmokeApp from './src/e2e/SmokeApp';
import { IA_E2E } from './src/generatedEnvConfig';
import { name as appName } from './app.json';

// With IA_E2E=true (see metro.config.js) the app boots a minimal SDK-init smoke
// entry used by the cross-platform E2E test; otherwise the full demo app.
AppRegistry.registerComponent(appName, () => (IA_E2E ? SmokeApp : App));
