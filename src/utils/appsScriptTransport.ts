import { callPortalRelay, getSignedInDistrictUser } from './firebaseClient';

/**
 * Sends a request to the district Apps Script (email + SST Sheet). A signed-in user goes
 * through the portalRelay Cloud Function, which checks their portal account and adds the
 * key the Apps Script requires; the Apps Script refuses requests without that key.
 * Direct posting only remains for local builds without Firebase.
 * Returns the Apps Script's JSON reply (null if it had none).
 */
export async function postToAppsScript(scriptUrl: string, body: Record<string, unknown>): Promise<any> {
  if (getSignedInDistrictUser()) return callPortalRelay(body);
  // text/plain avoids a CORS preflight, which Apps Script does not answer.
  const response = await fetch(scriptUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(body)
  });
  if (!response.ok) throw new Error(`Google Apps Script returned HTTP ${response.status}`);
  try {
    return await response.json();
  } catch {
    return null;
  }
}
