const path = require('path');
const flavors = require('./flavors.json');

// The SDK's React Native packages besides core, which every flavor includes, by the module names in flavors.json,
// with their Android ReactPackage classes.
const MODULE_PACKAGES = {
  'cardlink': 'de.ihreapotheken.reactnative.cardlink.IaSdkCardLinkPackage',
  'ordering': 'de.ihreapotheken.reactnative.ordering.IaSdkOrderingPackage',
  'over-the-counter': 'de.ihreapotheken.reactnative.otc.IaSdkOtcPackage',
  'pharmacy': 'de.ihreapotheken.reactnative.pharmacy.IaSdkPharmacyPackage',
  'prescription':
    'de.ihreapotheken.reactnative.prescription.IaSdkPrescriptionPackage',
};

/** A flavor's iOS build configurations: Debug and Release for the demo, Debug- and Release-<flavor> for the others. */
function iosConfigurations(flavor) {
  return flavor === 'demo'
    ? ['Debug', 'Release']
    : [`Debug-${flavor}`, `Release-${flavor}`];
}

/**
 * Links a module only into the flavors that list it in flavors.json. On iOS, its pod links only into their
 * configurations (the Podfile does the same for the SDK pods it brings). On Android, only their variants depend on
 * its project (`demoImplementation`, ...); the package list autolinking generates is the same for every flavor, so it
 * gets the package from FlavorPackages, which gives an empty one in a flavor without the module.
 */
function moduleDependency(module, androidPackage) {
  const allFlavors = Object.keys(flavors);
  const flavorsWithModule = allFlavors.filter((flavor) =>
    flavors[flavor].modules.includes(module)
  );
  let platforms;
  if (flavorsWithModule.length === allFlavors.length) {
    platforms = { ios: {}, android: {} };
  } else if (flavorsWithModule.length === 0) {
    platforms = { ios: null, android: null };
  } else {
    platforms = {
      ios: { configurations: flavorsWithModule.flatMap(iosConfigurations) },
      android: {
        buildTypes: flavorsWithModule,
        packageImportPath: 'import iasdkreactnative.example.FlavorPackages;',
        packageInstance: `FlavorPackages.of("${module}", "${androidPackage}")`,
      },
    };
  }
  return { root: path.join(__dirname, '..', 'packages', module), platforms };
}

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
    ...Object.fromEntries(
      Object.entries(MODULE_PACKAGES).map(([module, androidPackage]) => [
        `@ihreapotheken/ia-sdk-${module}`,
        moduleDependency(module, androidPackage),
      ])
    ),
  },
};
