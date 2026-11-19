import { AppRegistry } from 'react-native';
import { name as appName } from './app.json';
import ShowcaseApp from '@ia-example/prescription-upload-showcase';

// The showcase flavor's entry, see index.js.
AppRegistry.registerComponent(appName, () => ShowcaseApp);
