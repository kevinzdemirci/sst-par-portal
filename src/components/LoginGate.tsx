import React, { useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import { ShieldAlert } from 'lucide-react';
import { SST_DEFAULT_LOGO } from '../data/sstLogo';
import { DISTRICT_EMAIL_DOMAIN } from '../config/firebase';
import { isFirebaseConfigured, signInWithDistrictGoogle, signOutDistrictGoogle, watchDistrictUser } from '../utils/firebaseClient';
import { fetchAccount, isBootstrapAdminEmail, PortalAccount, watchAccount } from '../utils/accountsService';

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
  <div className="min-h-screen flex flex-col bg-[linear-gradient(180deg,#0f2352_0%,#0f2352_38%,#eef2f7_38%,#eef2f7_100%)]">
    <main className="flex-1 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-[440px] bg-white rounded-2xl shadow-[0_20px_60px_-15px_rgba(15,35,82,0.35)] ring-1 ring-slate-200 overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-[#0f2352] via-[#1a3880] to-[#b91c1c]" />
        <div className="px-8 sm:px-10 pt-10 pb-8">
          <img
            src={SST_DEFAULT_LOGO}
            alt="School of Science and Technology"
            className="h-32 sm:h-36 w-auto mx-auto object-contain"
          />
          <div className="mt-7 text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#b91c1c]">Human Resources</p>
            <h1 className="mt-1.5 text-[22px] font-bold tracking-tight text-slate-900">Personnel Action Request Portal</h1>
          </div>
          <div className="mt-7 space-y-4 text-center">{children}</div>
        </div>
      </div>
    </main>
    <footer className="pb-6 px-4 text-center text-[11px] leading-relaxed text-slate-500">
      <p>© {new Date().getFullYear()} School of Science and Technology. For authorized district use only.</p>
      <p>Personnel information in this portal is confidential.</p>
    </footer>
  </div>
);

/** Google's standard multicolor "G" mark for the sign-in button. */
const GoogleMark: React.FC = () => (
  <svg viewBox="0 0 48 48" className="w-5 h-5" aria-hidden="true">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
  </svg>
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

  // Lock the portal as soon as an admin deactivates or removes the signed-in account.
  const sessionEmail = state.status === 'ready' ? state.session.email : null;
  useEffect(() => {
    if (!sessionEmail || isBootstrapAdminEmail(sessionEmail)) return;
    return watchAccount(sessionEmail, account => {
      if (!account || !account.active) setState({ status: 'no-account', email: sessionEmail });
    });
  }, [sessionEmail]);

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
          <p className="text-sm text-slate-600 leading-relaxed">
            Sign in with your <span className="font-semibold text-slate-800">@{DISTRICT_EMAIL_DOMAIN}</span> Google account.
          </p>
          {state.status === 'signed-out' && state.error && (
            <p className="rounded-lg bg-rose-50 border border-rose-200 px-3 py-2 text-xs font-medium text-rose-800" role="alert">{state.error}</p>
          )}
          <button
            type="button"
            onClick={signIn}
            disabled={isSigningIn}
            className="w-full inline-flex items-center justify-center gap-3 h-12 px-4 rounded-lg bg-white border border-slate-300 text-[15px] font-semibold text-slate-800 shadow-sm hover:bg-slate-50 hover:border-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1a3880] focus-visible:ring-offset-2 disabled:opacity-60 transition-colors"
          >
            <GoogleMark />
            {isSigningIn ? 'Signing in…' : 'Sign in with Google'}
          </button>
          <div className="pt-4 border-t border-slate-100 space-y-1 text-[11px] leading-relaxed text-slate-500">
            <p>Access is limited to district staff with a portal account.</p>
            <p>Partner-school principals sign in with their school Google account.</p>
            <p>Need access? Contact Human Resources.</p>
          </div>
        </Screen>
      );
  }
};
