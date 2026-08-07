const path = require('path');
const fs = require('fs');
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

const root = path.resolve(__dirname, '..');

// Read .env and write a generated config module for runtime access
const envPath = path.resolve(root, '.env');
const envVars = {};
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf-8').split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const eqIndex = trimmed.indexOf('=');
      if (eqIndex > 0) {
        const key = trimmed.substring(0, eqIndex).trim();
        const value = trimmed.substring(eqIndex + 1).trim().replace(/^"|"$/g, '');
        envVars[key] = value;
      }
    }
  });
}
// Short labels for the server environments, matching the native demo apps
// (staging is the QA backend). Kept in sync with android/app/build.gradle and
// scripts/sync-app-label.sh, which derive the app name from the same value.
const SERVER_ENVIRONMENT_LABELS = {
  development: 'DEV',
  staging: 'QA',
  production: 'PROD',
};
const serverEnvironment = envVars.SERVER_ENVIRONMENT || 'staging';
const serverEnvironmentLabel = SERVER_ENVIRONMENT_LABELS[serverEnvironment] || 'QA';

const generatedPath = path.resolve(__dirname, 'src', 'generatedEnvConfig.ts');
fs.writeFileSync(generatedPath, [
  '// Auto-generated from .env by metro.config.js — do not edit',
  `export const ANDROID_APPSDK_VERSION = '${envVars.ANDROID_APPSDK_VERSION || 'N/A'}';`,
  `export const IOS_APPSDK_VERSION = '${envVars.IOS_APPSDK_VERSION || 'N/A'}';`,
  // E2E smoke flag: build/bundle with IA_E2E=true to boot the SDK-init smoke
  // entry (see index.js + src/e2e/SmokeApp.tsx) instead of the demo app.
  `export const IA_E2E = ${process.env.IA_E2E === 'true' || envVars.IA_E2E === 'true'};`,
  `export const SERVER_ENVIRONMENT = '${serverEnvironment}';`,
  `export const SERVER_ENVIRONMENT_LABEL = '${serverEnvironmentLabel}';`,
  '',
].join('\n'));
const packagesDir = path.resolve(root, 'packages');

// Map of workspace packages to their source directories
const workspacePackages = {
  '@ihreapotheken/ia-sdk-interface': path.resolve(packagesDir, 'interface', 'src'),
  '@ihreapotheken/ia-sdk-core': path.resolve(packagesDir, 'core', 'src'),
  '@ihreapotheken/ia-sdk-ordering': path.resolve(packagesDir, 'ordering', 'src'),
  '@ihreapotheken/ia-sdk-over-the-counter': path.resolve(packagesDir, 'over-the-counter', 'src'),
  '@ihreapotheken/ia-sdk-pharmacy': path.resolve(packagesDir, 'pharmacy', 'src'),
  '@ihreapotheken/ia-sdk-prescription': path.resolve(packagesDir, 'prescription', 'src'),
  '@ihreapotheken/ia-sdk-cardlink': path.resolve(packagesDir, 'cardlink', 'src'),
};

/**
 * Metro configuration for monorepo
 * https://facebook.github.io/metro/docs/configuration
 *
 * @type {import('metro-config').MetroConfig}
 */
const config = {
  watchFolders: [root],
  resolver: {
    // Prevent workspace packages' devDependencies from creating duplicate
    // react/react-native instances in the bundle. All imports must resolve
    // from the example app's node_modules (the single source of truth).
    blockList: [
      /packages\/[^/]+\/node_modules\/(react|react-native)\/.*/,
    ],
    // Ensure Metro can resolve workspace packages
    nodeModulesPaths: [
      path.resolve(__dirname, 'node_modules'),
      path.resolve(root, 'node_modules'),
    ],
    // Map workspace packages to their source directories
    extraNodeModules: new Proxy(workspacePackages, {
      get: (target, name) => {
        if (name in target) {
          return target[name];
        }
        // Fall back to node_modules for other packages
        return path.resolve(__dirname, 'node_modules', name);
      },
    }),
    // Resolve source files
    resolveRequest: (context, moduleName, platform) => {
      // Check if this is one of our workspace packages
      if (workspacePackages[moduleName]) {
        const packageSrcDir = workspacePackages[moduleName];
        // Try to resolve index.tsx, index.ts, or index.js
        for (const ext of ['.tsx', '.ts', '.js']) {
          const indexPath = path.join(packageSrcDir, `index${ext}`);
          try {
            require.resolve(indexPath);
            return {
              filePath: indexPath,
              type: 'sourceFile',
            };
          } catch (e) {
            // Continue to next extension
          }
        }
      }
      // Let Metro handle the resolution normally
      return context.resolveRequest(context, moduleName, platform);
    },
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
