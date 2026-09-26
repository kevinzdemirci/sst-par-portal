import { GmailCredentials, getStoredGmailCredentials } from './gmailService';
import { getStoredAppsScriptConfig } from './sstAppsScriptService';

/**
 * Email settings for PAR notifications. A browser with its own email setup uses it;
 * otherwise (e.g. a principal's first visit) mail goes through the district's Google
 * Apps Script web app, which sends from sstpar@ssttx.org.
 */
export function getEffectiveEmailCredentials(): GmailCredentials {
  const creds = getStoredGmailCredentials();
  const ownSetupWorks = creds.isEnabled && (creds.mode !== 'google_script' || !!creds.scriptUrl);
  if (ownSetupWorks) return creds;
  const script = getStoredAppsScriptConfig();
  if (!script.scriptUrl) return creds;
  return {
    ...creds,
    mode: 'google_script',
    scriptUrl: script.scriptUrl,
    senderEmail: script.senderEmail || creds.senderEmail,
    senderName: script.senderName || creds.senderName,
    isEnabled: true
  };
}
