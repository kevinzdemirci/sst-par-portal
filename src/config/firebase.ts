import type { FirebaseOptions } from 'firebase/app';

/**
 * Firebase web app settings from the Firebase console
 * (Project settings → General → Your apps → SDK setup and configuration → Config).
 * These values identify the project; they are not secrets. Access to the ADP roster
 * is enforced by Google sign-in and firestore.rules.
 *
 * Leave as null to run without live ADP data (sample roster and CSV import only).
 */
export const FIREBASE_CONFIG: FirebaseOptions | null = {
  apiKey: 'AIzaSyBCQDrfwTWyyZn5SygxdVqd8oG6RbLL9_w',
  authDomain: 'sst-par-portal.firebaseapp.com',
  projectId: 'sst-par-portal',
  storageBucket: 'sst-par-portal.firebasestorage.app',
  messagingSenderId: '822793591182',
  appId: '1:822793591182:web:f20dd3766a9d540b38ecdf'
};

/** Only Google Workspace accounts in this domain can load ADP staff data. */
export const DISTRICT_EMAIL_DOMAIN = 'ssttx.org';

/**
 * Google account domains allowed to sign in. Signing in only gets someone past the login
 * screen if an admin created a portal account for them. newfrontierspublicschools.org is
 * for the NFPS partner-school principals. Must match isDistrictStaff() in firestore.rules.
 */
export const ALLOWED_SIGN_IN_DOMAINS = ['ssttx.org', 'newfrontierspublicschools.org'];

export function isAllowedSignInEmail(email?: string | null): boolean {
  const e = (email || '').trim().toLowerCase();
  return ALLOWED_SIGN_IN_DOMAINS.some(d => e.endsWith(`@${d}`));
}

/**
 * Accounts that can always sign in as portal Super Admin (manage accounts, invite staff),
 * even before the shared accounts list exists. Must match isBootstrapAdmin() in firestore.rules.
 */
export const BOOTSTRAP_ADMIN_EMAILS = ['kdemirci@ssttx.org', 'sstpar@ssttx.org'];
