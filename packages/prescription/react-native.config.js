module.exports = {
  dependency: {
    platforms: {
      ios: {},
      android: {
        sourceDir: './android',
        packageImportPath: 'import de.ihreapotheken.reactnative.prescription.IaSdkPrescriptionPackage;',
        packageInstance: 'new IaSdkPrescriptionPackage()',
      },
    },
  },
};
