import type { FirebaseOptions } from 'firebase/app';

/**
 * Firebase web app settings from the Firebase console
 * (Project settings → General → Your apps → SDK setup and configuration → Config).
 * These values identify the project; they are not secrets. Access to the ADP roster
 * is enforced by Google sign-in and firestore.rules.
 *
 * Leave as null to run without live ADP data (sample roster and CSV import only).
 */
export const FIREBASE_CONFIG: FirebaseOptions | null = null;

/** Only Google Workspace accounts in this domain can load ADP staff data. */
export const DISTRICT_EMAIL_DOMAIN = 'ssttx.org';
