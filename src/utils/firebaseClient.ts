import { initializeApp, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  User
} from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { DISTRICT_EMAIL_DOMAIN, FIREBASE_CONFIG, isAllowedSignInEmail } from '../config/firebase';

let app: FirebaseApp | null = null;

export function isFirebaseConfigured(): boolean {
  return FIREBASE_CONFIG !== null;
}

function getApp(): FirebaseApp {
  if (!FIREBASE_CONFIG) throw new Error('Firebase is not configured.');
  if (!app) app = initializeApp(FIREBASE_CONFIG);
  return app;
}

export function getDb(): Firestore {
  return getFirestore(getApp());
}

export function isDistrictAccount(user: User | null): boolean {
  return !!user?.email && user.emailVerified && isAllowedSignInEmail(user.email);
}

export function getSignedInDistrictUser(): User | null {
  if (!isFirebaseConfigured()) return null;
  const user = getAuth(getApp()).currentUser;
  return isDistrictAccount(user) ? user : null;
}

/**
 * Google sign-in limited to the district Workspace domain. Personal Google accounts are
 * signed out immediately (Firestore rules would refuse them anyway).
 */
export async function signInWithDistrictGoogle(): Promise<User> {
  const auth = getAuth(getApp());
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const { user } = await signInWithPopup(auth, provider);
  if (!isDistrictAccount(user)) {
    await signOut(auth);
    throw new Error(`Use your @${DISTRICT_EMAIL_DOMAIN} Google account.`);
  }
  return user;
}

export async function signOutDistrictGoogle(): Promise<void> {
  if (isFirebaseConfigured()) await signOut(getAuth(getApp()));
}

/** Calls back with the signed-in district user (or null) now and on every change. */
export function watchDistrictUser(callback: (user: User | null) => void): () => void {
  if (!isFirebaseConfigured()) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(getAuth(getApp()), user => callback(isDistrictAccount(user) ? user : null));
}

/** Asks the Cloud Function to pull from ADP now (only if the saved roster is over an hour old). */
export async function requestAdpRefresh(): Promise<{ status: 'fresh' | 'refreshed'; count?: number }> {
  const call = httpsCallable<void, { status: 'fresh' | 'refreshed'; count?: number }>(
    getFunctions(getApp(), 'us-central1'),
    'refreshAdpRoster'
  );
  return (await call()).data;
}
