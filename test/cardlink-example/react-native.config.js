const path = require('path');

module.exports = {
  project: {
    ios: {
      automaticPodsInstallation: true,
    },
  },
  dependencies: {
    '@ihreapotheken/ia-sdk-core': {
      root: path.join(__dirname, '../..', 'packages', 'core'),
      platforms: {
        ios: {},
        android: {},
      },
    },
    '@ihreapotheken/ia-sdk-cardlink': {
      root: path.join(__dirname, '../..', 'packages', 'cardlink'),
      platforms: {
        ios: {},
        android: {},
      },
    },
  },
};
