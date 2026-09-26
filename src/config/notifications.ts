/**
 * Notification test mode. While enabled, every email the portal sends goes only to
 * TEST_RECIPIENT, with the intended recipient shown in the subject and a banner.
 * Set enabled to false (and redeploy) to start emailing staff.
 */
export const NOTIFICATION_TEST_MODE = {
  enabled: true,
  recipient: 'kdemirci@ssttx.org'
};
