import { AppRegistry } from 'react-native';
import { name as appName } from './app.json';
import DemoApp from '@ia-example/demo';

// The demo flavor's entry. Every flavor has its own (index.<flavor>.js) and its
// own package (packages/, see package.json → flavors), so a flavor's JS bundle
// holds only its app; the native app loads the entry of its flavor, see
// README.md → Flavors.
AppRegistry.registerComponent(appName, () => DemoApp);
