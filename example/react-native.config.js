const path = require('path');

// The demo flavor's iOS configurations; each other flavor has Debug-<flavor> and
// Release-<flavor>. The showcase leaves out over-the-counter and CardLink, so
// their pods (with the SDK frameworks they bring) link only into these. Android
// leaves them out in android/app/build.gradle.
const DEMO_CONFIGURATIONS = ['Debug', 'Release'];

module.exports = {
  project: {
    ios: {
      automaticPodsInstallation: true,
    },
  },
  dependencies: {
    '@ihreapotheken/ia-sdk-core': {
      root: path.join(__dirname, '..', 'packages', 'core'),
      platforms: {
        ios: {},
        android: {},
      },
    },
    '@ihreapotheken/ia-sdk-ordering': {
      root: path.join(__dirname, '..', 'packages', 'ordering'),
      platforms: {
        ios: {},
        android: {},
      },
    },
    '@ihreapotheken/ia-sdk-over-the-counter': {
      root: path.join(__dirname, '..', 'packages', 'over-the-counter'),
      platforms: {
        // Only in the demo's configurations: the showcase leaves this module out.
        ios: { configurations: DEMO_CONFIGURATIONS },
        android: {},
      },
    },
    '@ihreapotheken/ia-sdk-pharmacy': {
      root: path.join(__dirname, '..', 'packages', 'pharmacy'),
      platforms: {
        ios: {},
        android: {},
      },
    },
    '@ihreapotheken/ia-sdk-prescription': {
      root: path.join(__dirname, '..', 'packages', 'prescription'),
      platforms: {
        ios: {},
        android: {},
      },
    },
    '@ihreapotheken/ia-sdk-cardlink': {
      root: path.join(__dirname, '..', 'packages', 'cardlink'),
      platforms: {
        // Only in the demo's configurations: the showcase leaves this module out.
        ios: { configurations: DEMO_CONFIGURATIONS },
        android: {},
      },
    },
  },
};
