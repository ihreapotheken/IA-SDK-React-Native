module.exports = {
  dependency: {
    platforms: {
      ios: {},
      android: {
        sourceDir: './android',
        packageImportPath: 'import de.ihreapotheken.reactnative.cardlink.IaSdkCardLinkPackage;',
        packageInstance: 'new IaSdkCardLinkPackage()',
      },
    },
  },
};
