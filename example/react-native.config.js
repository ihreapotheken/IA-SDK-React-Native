const path = require('path');

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
        ios: {},
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
        ios: {},
        android: {},
      },
    },
  },
};
