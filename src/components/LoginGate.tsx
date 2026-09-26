import React, { useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import { LogIn, ShieldAlert } from 'lucide-react';
import { SST_DEFAULT_LOGO } from '../data/sstLogo';
import { DISTRICT_EMAIL_DOMAIN } from '../config/firebase';
import { isFirebaseConfigured, signInWithDistrictGoogle, signOutDistrictGoogle, watchDistrictUser } from '../utils/firebaseClient';
import { fetchAccount, isBootstrapAdminEmail, PortalAccount } from '../utils/accountsService';

/** Who is signed in to the portal, and their shared account. */
export interface PortalSession {
  email: string;
  displayName: string;
  /** null for a bootstrap Super Admin who has no account record yet. */
  account: PortalAccount | null;
  isAdmin: boolean;
  signOut: () => Promise<void>;
}

type GateState =
  | { status: 'loading' }
  | { status: 'signed-out'; error?: string }
  | { status: 'no-account'; email: string }
  | { status: 'error'; message: string }
  | { status: 'ready'; session: PortalSession };

const Screen: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
    <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-xl p-8 text-center space-y-5">
      <img src={SST_DEFAULT_LOGO} alt="School of Science and Technology" className="h-20 w-auto mx-auto object-contain" />
      <div>
        <h1 className="text-lg font-bold text-slate-900">Personnel Action Request Portal</h1>
        <p className="text-xs text-slate-500 mt-1">School of Science and Technology · Human Resources</p>
      </div>
      {children}
    </div>
  </div>
);

/**
 * Requires Google sign-in with a district account and a portal account before the app
 * loads. Without Firebase configured (local development), the app loads without it.
 */
export const LoginGate: React.FC<{ children: (session: PortalSession | null) => React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<GateState>({ status: 'loading' });
  const [isSigningIn, setIsSigningIn] = useState(false);

  useEffect(() => {
    if (!isFirebaseConfigured()) return;
    return watchDistrictUser(async (user: User | null) => {
      if (!user?.email) {
        setState(prev => (prev.status === 'signed-out' ? prev : { status: 'signed-out' }));
        return;
      }
      setState({ status: 'loading' });
      try {
        const account = await fetchAccount(user.email);
        const bootstrapAdmin = isBootstrapAdminEmail(user.email);
        if ((account && account.active) || bootstrapAdmin) {
          setState({
            status: 'ready',
            session: {
              email: user.email.toLowerCase(),
              displayName: account?.name || user.displayName || user.email,
              account: account && account.active ? account : null,
              isAdmin: bootstrapAdmin || account?.isAdmin === true,
              signOut: signOutDistrictGoogle
            }
          });
        } else {
          setState({ status: 'no-account', email: user.email });
        }
      } catch (e: any) {
        setState({ status: 'error', message: e?.message || 'Could not load your portal account.' });
      }
    });
  }, []);

  if (!isFirebaseConfigured()) return <>{children(null)}</>;

  const signIn = async () => {
    setIsSigningIn(true);
    try {
      await signInWithDistrictGoogle();
    } catch (e: any) {
      const closed = /popup-closed|cancelled-popup/i.test(e?.code || e?.message || '');
      setState({ status: 'signed-out', error: closed ? undefined : e?.message || 'Sign-in failed.' });
    } finally {
      setIsSigningIn(false);
    }
  };

  switch (state.status) {
    case 'ready':
      return <>{children(state.session)}</>;

    case 'loading':
      return (
        <Screen>
          <p className="text-sm text-slate-600">Checking your account…</p>
        </Screen>
      );

    case 'no-account':
      return (
        <Screen>
          <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 text-left text-sm text-amber-950 flex gap-3">
            <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Your portal account isn't set up yet.</p>
              <p className="mt-1 text-xs">
                You're signed in as <strong>{state.email}</strong>. Ask Human Resources to create your account, then sign in again.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => signOutDistrictGoogle()}
            className="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Sign in with a different account
          </button>
        </Screen>
      );

    case 'error':
      return (
        <Screen>
          <p className="text-sm text-rose-700">{state.message}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="w-full px-4 py-2.5 rounded-lg bg-[#0f2352] text-white text-sm font-semibold hover:bg-[#1a3880]"
          >
            Try again
          </button>
        </Screen>
      );

    case 'signed-out':
    default:
      return (
        <Screen>
          <p className="text-sm text-slate-600">Sign in with your @{DISTRICT_EMAIL_DOMAIN} Google account to continue.</p>
          {state.status === 'signed-out' && state.error && (
            <p className="text-xs font-semibold text-rose-700" role="alert">{state.error}</p>
          )}
          <button
            type="button"
            onClick={signIn}
            disabled={isSigningIn}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-[#0f2352] text-white text-sm font-semibold hover:bg-[#1a3880] disabled:opacity-60"
          >
            <LogIn className="w-4 h-4" />
            {isSigningIn ? 'Signing in…' : 'Sign in with Google'}
          </button>
          <p className="text-[11px] text-slate-400">Only district staff with a portal account can sign in.</p>
        </Screen>
      );
  }
};
