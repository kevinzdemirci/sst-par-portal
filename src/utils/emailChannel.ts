import { GmailCredentials, getStoredGmailCredentials } from './gmailService';
import { getStoredAppsScriptConfig } from './sstAppsScriptService';

/** Every portal email comes from this district account. */
export const DISTRICT_SENDER_EMAIL = 'sstpar@ssttx.org';
export const DISTRICT_SENDER_NAME = 'SST Personnel Action Requests';

/**
 * District email channel: the SST Google Apps Script web app, which sends through Gmail as
 * sstpar@ssttx.org. Used for all portal notifications regardless of any browser's own
 * email settings. Falls back to the browser's settings only if no Apps Script is configured.
 */
export function getDistrictEmailCredentials(): GmailCredentials {
  const stored = getStoredGmailCredentials();
  const script = getStoredAppsScriptConfig();
  if (!script.scriptUrl) return stored;
  return {
    ...stored,
    mode: 'google_script',
    scriptUrl: script.scriptUrl,
    senderEmail: DISTRICT_SENDER_EMAIL,
    senderName: DISTRICT_SENDER_NAME,
    ccHrCopy: false,
    isEnabled: true
  };
}

/** @deprecated use getDistrictEmailCredentials */
export const getEffectiveEmailCredentials = getDistrictEmailCredentials;
