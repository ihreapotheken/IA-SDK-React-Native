/**
 * The appearance settings the SDK keeps while the app runs. They're kept here
 * rather than in the Services tab, which the tab bar remounts, and start out
 * as the SDK defaults.
 */
export const appearance = { isHapticFeedbackEnabled: true, showsMascot: true };

/** Takes the mascot setting of the initialization options. */
export function setInitialMascotVisibility(showsMascot: boolean) {
  appearance.showsMascot = showsMascot;
}
