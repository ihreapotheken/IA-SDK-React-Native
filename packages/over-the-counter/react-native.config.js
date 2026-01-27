module.exports = {
  dependency: {
    platforms: {
      ios: {},
      android: {
        sourceDir: './android',
        packageImportPath: 'import de.ihreapotheken.reactnative.otc.IaSdkOtcPackage;',
        packageInstance: 'new IaSdkOtcPackage()',
      },
    },
  },
};
