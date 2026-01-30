module.exports = {
  dependency: {
    platforms: {
      ios: {},
      android: {
        sourceDir: './android',
        packageImportPath: 'import de.ihreapotheken.reactnative.core.IaSdkCorePackage;',
        packageInstance: 'new IaSdkCorePackage()',
      },
    },
  },
};
