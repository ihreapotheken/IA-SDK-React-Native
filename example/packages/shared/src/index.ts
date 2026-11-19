// What every app of the example shares. It imports only the core SDK package, which every flavor includes, so a
// flavor can use it without linking another flavor's modules.
export * from './ui';
export { CLIENT_ID, serverEnvironment } from './sdkConfig';
export { mockEPrescriptionCode } from './testEPrescription';
// The SDK versions and backend of the build, generated from the repository's .env by metro.config.js.
export * from './generatedEnvConfig';
