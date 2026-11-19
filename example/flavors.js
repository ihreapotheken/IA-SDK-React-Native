/**
 * The SDK modules of each flavor of the example.
 *
 * Each flavor is a package in packages/, named in package.json → "flavors", and
 * contains the SDK modules that package depends on, directly or through another
 * package of the example (e.g. @ia-example/shared). react-native.config.js,
 * android/app/build.gradle and ios/Podfile link each module only into the
 * flavors that depend on it. Core is in every flavor, so it isn't listed.
 *
 * Run with node, it prints them as JSON for Gradle and the Podfile:
 * {"demo": ["cardlink", ...], "showcase": [...]}
 */
const fs = require('fs');
const path = require('path');

const EXAMPLE_PACKAGE_SCOPE = '@ia-example/';
const SDK_PACKAGE_PREFIX = '@ihreapotheken/ia-sdk-';
const MODULES_IN_EVERY_FLAVOR = ['core', 'interface'];

function readExamplePackage(name) {
  const directory = path.join(
    __dirname,
    'packages',
    name.slice(EXAMPLE_PACKAGE_SCOPE.length)
  );
  return JSON.parse(
    fs.readFileSync(path.join(directory, 'package.json'), 'utf8')
  );
}

/** The SDK modules a package of the example depends on, directly or through another one. */
function sdkModulesOf(packageName, visited = new Set()) {
  if (visited.has(packageName)) {
    return [];
  }
  visited.add(packageName);
  return Object.keys(
    readExamplePackage(packageName).dependencies ?? {}
  ).flatMap((dependency) => {
    if (dependency.startsWith(EXAMPLE_PACKAGE_SCOPE)) {
      return sdkModulesOf(dependency, visited);
    }
    if (dependency.startsWith(SDK_PACKAGE_PREFIX)) {
      return [dependency.slice(SDK_PACKAGE_PREFIX.length)];
    }
    return [];
  });
}

/** Each flavor's SDK modules besides core, sorted. */
function flavorModules() {
  const { flavors } = require('./package.json');
  return Object.fromEntries(
    Object.entries(flavors).map(([flavor, packageName]) => [
      flavor,
      [...new Set(sdkModulesOf(packageName))]
        .filter((module) => !MODULES_IN_EVERY_FLAVOR.includes(module))
        .sort(),
    ])
  );
}

module.exports = { flavorModules };

if (require.main === module) {
  process.stdout.write(JSON.stringify(flavorModules()));
}
