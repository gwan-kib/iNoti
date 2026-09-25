// Build-time switch for development-only affordances.
//
// Set to true to show the toolbar popup's "Dev tester" button; set to false and
// the button is removed from the popup DOM entirely (not merely hidden), so a
// production build cannot reach the tester from the popup.
export const DEV_TESTING_ENABLED = false;
