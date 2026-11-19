import { IA_E2E } from '@ia-example/shared';
import DemoApp from './DemoApp';
import SmokeApp from './e2e/SmokeApp';

/**
 * The demo flavor's app. With IA_E2E=true (see metro.config.js) it's the
 * SDK-initialization smoke app of the cross-platform E2E test instead.
 */
export default IA_E2E ? SmokeApp : DemoApp;
