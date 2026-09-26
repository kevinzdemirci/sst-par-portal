import React, { useMemo, useState } from 'react';
import { KeyRound, Mail, RefreshCw, UserPlus, Users, AlertTriangle } from 'lucide-react';
import { ApproverRoleConfig, UserPersona } from '../types/par';
import { getStoredAdpStaff } from '../utils/adpService';
import {
  accountFromApprover,
  CAMPUS_PRINCIPAL_TITLE,
  fetchAllAccounts,
  normalizeEmail,
  planPrincipalAccounts,
  PortalAccount,
  PrincipalImportPlan,
  saveAccounts
} from '../utils/accountsService';

interface PortalAccountsPanelProps {
  accounts: PortalAccount[];
  approvers: ApproverRoleConfig[];
  personas: UserPersona[];
  adminEmail: string;
  onAccountsChanged: (accounts: PortalAccount[]) => void;
  onToast: (text: string, type?: 'success' | 'warning' | 'info') => void;
}

const btn = 'inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors disabled:opacity-60';

/**
 * Super Admin tools for portal sign-in accounts: who can log in with their @ssttx.org
 * Google account, and in which role.
 */
export const PortalAccountsPanel: React.FC<PortalAccountsPanelProps> = ({
  accounts,
  approvers,
  personas,
  adminEmail,
  onAccountsChanged,
  onToast
}) => {
  const [busy, setBusy] = useState(false);
  const [plan, setPlan] = useState<PrincipalImportPlan | null>(null);

  const sorted = useMemo(
    () => [...accounts].sort((a, b) => (a.title === b.title ? a.name.localeCompare(b.name) : a.title.localeCompare(b.title))),
    [accounts]
  );
  const principals = accounts.filter(a => a.active && a.roleKey === 'supervisor');
  const portalLink = `${window.location.origin}${window.location.pathname}`;

  const refresh = async () => onAccountsChanged(await fetchAllAccounts());

  const run = async (work: () => Promise<void>) => {
    setBusy(true);
    try {
      await work();
    } catch (e: any) {
      onToast(`Could not update accounts: ${e?.message || 'unknown error'}`, 'warning');
    } finally {
      setBusy(false);
    }
  };

  const addDirectoryApprovers = () =>
    run(async () => {
      const existing = new Set(accounts.map(a => normalizeEmail(a.email)));
      const candidates = [...approvers, ...personas.filter(p => p.isNotificationOnly)]
        .filter(a => a.email && !existing.has(normalizeEmail(a.email)));
      const unique = Array.from(new Map(candidates.map(a => [normalizeEmail(a.email), accountFromApprover(a)])).values());
      if (unique.length === 0) {
        onToast('Every directory approver already has an account.', 'info');
        return;
      }
      await saveAccounts(unique, adminEmail);
      await refresh();
      onToast(`Created ${unique.length} accounts from the approver directory.`, 'success');
    });

  const previewPrincipals = () => {
    const roster = getStoredAdpStaff();
    if (roster.length === 0) {
      onToast('Load the ADP roster first (open a PAR form and sign in to search ADP staff).', 'warning');
      return;
    }
    setPlan(planPrincipalAccounts(roster, accounts));
  };

  const createPrincipals = () =>
    run(async () => {
      if (!plan || plan.toCreate.length === 0) return;
      await saveAccounts(plan.toCreate, adminEmail);
      await refresh();
      onToast(`Created ${plan.toCreate.length} campus principal accounts.`, 'success');
      setPlan(null);
    });

  const setActive = (acc: PortalAccount, active: boolean) =>
    run(async () => {
      await saveAccounts([{ ...acc, active }], adminEmail);
      await refresh();
      onToast(`${acc.name} can ${active ? 'now' : 'no longer'} sign in.`, 'success');
    });

  const inviteHref = `mailto:?bcc=${encodeURIComponent(principals.map(p => p.email).join(','))}&subject=${encodeURIComponent(
    'SST Personnel Action Request Portal: your access'
  )}&body=${encodeURIComponent(
    `Hello,\n\nYou can now submit Personnel Action Requests (PARs) for your campus online.\n\n` +
      `1. Open ${portalLink}\n2. Click "Sign in with Google" and choose your @ssttx.org account.\n` +
      `3. Click "Create New PAR", find the employee with "Find employee in ADP", and complete the form.\n\n` +
      `Your PAR is routed automatically to the next approver. Contact Human Resources with any questions.\n\nThank you,\nSST Human Resources`
  )}`;

  return (
    <section className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-[#0f2352]" /> Portal sign-in accounts
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Staff sign in with their @ssttx.org Google account. Only people listed here can use the portal.
          </p>
        </div>
        <div className="text-xs text-slate-600">
          <strong>{accounts.filter(a => a.active).length}</strong> active · <strong>{principals.length}</strong> campus principals
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button type="button" disabled={busy} onClick={previewPrincipals} className={`${btn} bg-[#0f2352] text-white hover:bg-[#1a3880]`}>
          <UserPlus className="w-3.5 h-3.5" /> Create principal accounts from ADP
        </button>
        <button type="button" disabled={busy} onClick={addDirectoryApprovers} className={`${btn} border border-slate-300 text-slate-700 hover:bg-slate-50`}>
          <Users className="w-3.5 h-3.5" /> Add directory approvers as accounts
        </button>
        <a
          href={principals.length ? inviteHref : undefined}
          aria-disabled={!principals.length}
          className={`${btn} border border-slate-300 text-slate-700 hover:bg-slate-50 ${principals.length ? '' : 'pointer-events-none opacity-60'}`}
        >
          <Mail className="w-3.5 h-3.5" /> Email principals the portal link
        </a>
        <button type="button" disabled={busy} onClick={() => run(refresh)} className={`${btn} text-slate-600 hover:bg-slate-50`}>
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-[11px] text-amber-950">
        <AlertTriangle className="w-4 h-4 shrink-0 mt-px" />
        <span>
          Send invitations after shared PAR storage (Stage 2) is live. Until then, a PAR is saved only in the browser where it was submitted.
        </span>
      </div>

      {plan && (
        <div className="rounded-xl border border-slate-200 p-4 space-y-3">
          <div className="text-xs font-semibold text-slate-800">
            Principals found in ADP (job title "Principal"): {plan.toCreate.length} new
            {plan.alreadyHaveAccount.length > 0 && `, ${plan.alreadyHaveAccount.length} already have an account`}
            {plan.missingEmail.length > 0 && `, ${plan.missingEmail.length} without a work email`}
            {plan.missingCampus.length > 0 && `, ${plan.missingCampus.length} without a matching campus`}
          </div>
          {plan.toCreate.length > 0 && (
            <ul className="max-h-64 overflow-y-auto divide-y divide-slate-100 rounded-lg border border-slate-200 text-xs">
              {plan.toCreate.map(a => (
                <li key={a.email} className="px-3 py-1.5 flex justify-between gap-3">
                  <span className="font-medium text-slate-900">{a.name}</span>
                  <span className="text-slate-500 truncate">{a.campus} · {a.email}</span>
                </li>
              ))}
            </ul>
          )}
          {plan.alreadyHaveAccount.length > 0 && (
            <p className="text-[11px] text-slate-500">
              Kept as they are: {plan.alreadyHaveAccount.map(x => `${x.worker.fullName} (${x.account.title})`).join(', ')}.
            </p>
          )}
          {[...plan.missingEmail, ...plan.missingCampus].length > 0 && (
            <p className="text-[11px] text-amber-800">
              Needs attention in ADP: {[...plan.missingEmail, ...plan.missingCampus].map(w => `${w.fullName} (${w.locationName || 'no location'})`).join(', ')}.
            </p>
          )}
          <div className="flex gap-2">
            <button type="button" disabled={busy || plan.toCreate.length === 0} onClick={createPrincipals} className={`${btn} bg-emerald-700 text-white hover:bg-emerald-800`}>
              Create {plan.toCreate.length} {CAMPUS_PRINCIPAL_TITLE.toLowerCase()} accounts
            </button>
            <button type="button" onClick={() => setPlan(null)} className={`${btn} text-slate-600 hover:bg-slate-50`}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {sorted.length > 0 ? (
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 text-slate-500 text-left">
              <tr>
                <th className="px-3 py-2 font-semibold">Name</th>
                <th className="px-3 py-2 font-semibold">Email</th>
                <th className="px-3 py-2 font-semibold">Role</th>
                <th className="px-3 py-2 font-semibold">Campus</th>
                <th className="px-3 py-2 font-semibold">Status</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sorted.map(a => (
                <tr key={a.email} className={a.active ? '' : 'text-slate-400'}>
                  <td className="px-3 py-2 font-medium">{a.name}{a.isAdmin && <span className="ml-1.5 text-[10px] font-bold text-amber-700">ADMIN</span>}</td>
                  <td className="px-3 py-2 font-mono">{a.email}</td>
                  <td className="px-3 py-2">{a.title}</td>
                  <td className="px-3 py-2">{a.campus || '—'}</td>
                  <td className="px-3 py-2">{a.active ? 'Active' : 'Turned off'}</td>
                  <td className="px-3 py-2 text-right">
                    {normalizeEmail(a.email) !== normalizeEmail(adminEmail) && (
                      <button type="button" disabled={busy} onClick={() => setActive(a, !a.active)} className="font-semibold text-[#0f2352] hover:underline">
                        {a.active ? 'Turn off' : 'Turn on'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-xs text-slate-500">
          No accounts yet. Start with <strong>Add directory approvers as accounts</strong>, then <strong>Create principal accounts from ADP</strong>.
        </p>
      )}
    </section>
  );
};
