module.exports = {
  dependency: {
    platforms: {
      ios: {},
      android: {
        sourceDir: './android',
        packageImportPath: 'import de.ihreapotheken.reactnative.ordering.IaSdkOrderingPackage;',
        packageInstance: 'new IaSdkOrderingPackage()',
      },
    },
  },
};
