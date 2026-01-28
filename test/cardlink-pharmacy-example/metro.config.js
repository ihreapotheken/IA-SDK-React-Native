const path = require('path');
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

const root = path.resolve(__dirname, '../..');
const packagesDir = path.resolve(root, 'packages');

// Map of workspace packages to their source directories
const workspacePackages = {
  '@ihreapotheken/ia-sdk-interface': path.resolve(packagesDir, 'interface', 'src'),
  '@ihreapotheken/ia-sdk-core': path.resolve(packagesDir, 'core', 'src'),
  '@ihreapotheken/ia-sdk-cardlink': path.resolve(packagesDir, 'cardlink', 'src'),
  '@ihreapotheken/ia-sdk-pharmacy': path.resolve(packagesDir, 'pharmacy', 'src'),
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
