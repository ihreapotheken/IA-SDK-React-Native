import { ServerEnvironment } from '@ihreapotheken/ia-sdk-core';
import { SERVER_ENVIRONMENT } from './generatedEnvConfig';

// SDK settings every app of the example uses. Only the core package is
// imported, so each flavor can use them without loading another flavor's
// modules.

/** The client ID the example's access key belongs to. */
export const CLIENT_ID = '6001';

/**
 * The backend the SDK is initialized with, taken from the monorepo .env so the
 * app name (DEV/QA/PROD suffix) and the SDK config can never disagree.
 */
export const serverEnvironment = (
  Object.values(ServerEnvironment) as string[]
).includes(SERVER_ENVIRONMENT)
  ? (SERVER_ENVIRONMENT as ServerEnvironment)
  : ServerEnvironment.Staging;
