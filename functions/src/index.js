/**
 * SST ADP roster sync — Firebase Cloud Functions
 *
 * syncAdpRoster     Runs daily at 5:00 AM Central. Pulls every worker from ADP Workforce
 *                   Now, keeps only the fields a PAR needs, and saves the roster to
 *                   Firestore (adpRoster/meta + adpRoster/chunk-N).
 * refreshAdpRoster  Callable by signed-in @ssttx.org staff to pull again now; only runs
 *                   if the saved roster is more than an hour old.
 *
 * ADP credentials, certificate, and private key are Google Secret Manager secrets.
 * Firestore rules (firestore.rules) let only signed-in @ssttx.org accounts read the roster.
 */
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import { logger } from 'firebase-functions';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { createAdpClient } from './adpClient.js';
import { buildRoster, chunkRoster } from './roster.js';

// SST's API Central project ("Worker Demographic Data (Read Only)") allows only this endpoint.
const ADP_WORKERS_PATH = '/hr/v2/worker-demographics';
const DPS_SID_FIELD = 'DPS SID&/Name';
const TERMINATED_LOOKBACK_DAYS = 365;
const ALLOWED_EMAIL_DOMAIN = 'ssttx.org';
const MANUAL_REFRESH_MIN_AGE_MS = 60 * 60 * 1000;

const ADP_CLIENT_ID = defineSecret('ADP_CLIENT_ID');
const ADP_CLIENT_SECRET = defineSecret('ADP_CLIENT_SECRET');
const ADP_CERT_PEM = defineSecret('ADP_CERT_PEM');
const ADP_KEY_PEM = defineSecret('ADP_KEY_PEM');

const runtime = {
  region: 'us-central1',
  secrets: [ADP_CLIENT_ID, ADP_CLIENT_SECRET, ADP_CERT_PEM, ADP_KEY_PEM],
  timeoutSeconds: 540,
  memory: '512MiB'
};

initializeApp();
const db = getFirestore();
db.settings({ ignoreUndefinedProperties: true });

async function refreshRoster(trigger) {
  const metaRef = db.doc('adpRoster/meta');
  const attemptAt = new Date().toISOString();
  try {
    const client = createAdpClient({
      certPem: ADP_CERT_PEM.value(),
      keyPem: ADP_KEY_PEM.value(),
      clientId: ADP_CLIENT_ID.value(),
      clientSecret: ADP_CLIENT_SECRET.value()
    });
    const adpWorkers = await client.fetchAllWorkers(ADP_WORKERS_PATH);
    const workers = buildRoster(adpWorkers, {
      dpsSidField: DPS_SID_FIELD,
      terminatedLookbackDays: TERMINATED_LOOKBACK_DAYS
    });
    const chunks = chunkRoster(workers);
    const previous = (await metaRef.get()).data();

    const batch = db.batch();
    chunks.forEach((chunk, i) => batch.set(db.doc(`adpRoster/chunk-${i}`), { workers: chunk }));
    for (let i = chunks.length; i < (previous?.chunkCount || 0); i++) batch.delete(db.doc(`adpRoster/chunk-${i}`));
    batch.set(metaRef, {
      syncedAt: new Date().toISOString(),
      count: workers.length,
      chunkCount: chunks.length,
      lastAttempt: { at: attemptAt, ok: true, trigger, count: workers.length }
    });
    await batch.commit();
    logger.info(`ADP roster refreshed (${trigger}): kept ${workers.length} of ${adpWorkers.length} workers`);
    return workers.length;
  } catch (err) {
    logger.error(`ADP roster refresh failed (${trigger})`, err);
    // Keep the previous roster; record the failure so the portal can warn.
    await metaRef.set(
      { lastAttempt: { at: attemptAt, ok: false, trigger, error: String(err?.message || err).slice(0, 300) } },
      { merge: true }
    );
    throw err;
  }
}

export const syncAdpRoster = onSchedule(
  { ...runtime, schedule: '0 5 * * *', timeZone: 'America/Chicago', retryCount: 1 },
  async () => {
    await refreshRoster('scheduled');
  }
);

export const refreshAdpRoster = onCall(runtime, async request => {
  const email = String(request.auth?.token?.email || '').toLowerCase();
  if (!request.auth || request.auth.token.email_verified !== true || !email.endsWith(`@${ALLOWED_EMAIL_DOMAIN}`)) {
    throw new HttpsError('permission-denied', 'Sign in with your district Google account.');
  }
  const meta = (await db.doc('adpRoster/meta').get()).data();
  if (meta?.syncedAt && Date.now() - Date.parse(meta.syncedAt) < MANUAL_REFRESH_MIN_AGE_MS) {
    return { status: 'fresh', syncedAt: meta.syncedAt, count: meta.count };
  }
  try {
    const count = await refreshRoster(`on-demand by ${email}`);
    return { status: 'refreshed', count };
  } catch (err) {
    throw new HttpsError('unavailable', `Could not pull from ADP: ${String(err?.message || err).slice(0, 200)}`);
  }
});
