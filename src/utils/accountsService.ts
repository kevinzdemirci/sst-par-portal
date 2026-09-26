import { collection, doc, getDoc, getDocs, writeBatch } from 'firebase/firestore';
import { ApproverRoleConfig, Campus, UserPersona, WorkflowStage } from '../types/par';
import { AdpWorker } from '../types/adp';
import { BOOTSTRAP_ADMIN_EMAILS, isAllowedSignInEmail } from '../config/firebase';
import { getDb } from './firebaseClient';
import { CAMPUS_PRINCIPAL_TITLE, getInitialsAvatarUrl, locationForCampus } from './formatters';

/**
 * A portal account in the shared Firestore directory (accounts/{email}).
 * Signing in with Google looks up this record to decide who the user is and what they can do.
 */
export interface PortalAccount {
  email: string;
  name: string;
  title: string;
  roleKey: ApproverRoleConfig['roleKey'];
  department: string;
  campus?: string;
  region: string;
  canReviewStages: WorkflowStage[];
  isAdmin?: boolean;
  isNotificationOnly?: boolean;
  notificationRoleType?: 'it' | 'talent_acquisition' | 'other';
  active: boolean;
  source: 'directory' | 'adp';
  adpAssociateId?: string;
  updatedAt?: string;
  updatedBy?: string;
}

export { CAMPUS_PRINCIPAL_TITLE } from './formatters';

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isBootstrapAdminEmail(email?: string | null): boolean {
  return !!email && BOOTSTRAP_ADMIN_EMAILS.includes(normalizeEmail(email));
}

export async function fetchAccount(email: string): Promise<PortalAccount | null> {
  const snap = await getDoc(doc(getDb(), 'accounts', normalizeEmail(email)));
  return snap.exists() ? (snap.data() as PortalAccount) : null;
}

export async function fetchAllAccounts(): Promise<PortalAccount[]> {
  const snap = await getDocs(collection(getDb(), 'accounts'));
  return snap.docs.map(d => d.data() as PortalAccount);
}

/** Creates or updates accounts (admins only; enforced by firestore.rules). */
export async function saveAccounts(accounts: PortalAccount[], updatedBy: string): Promise<void> {
  const db = getDb();
  const now = new Date().toISOString();
  // Firestore batches hold up to 500 writes.
  for (let i = 0; i < accounts.length; i += 400) {
    const batch = writeBatch(db);
    accounts.slice(i, i + 400).forEach(acc => {
      const clean = Object.fromEntries(Object.entries({ ...acc, email: normalizeEmail(acc.email), updatedAt: now, updatedBy }).filter(([, v]) => v !== undefined));
      batch.set(doc(db, 'accounts', normalizeEmail(acc.email)), clean, { merge: true });
    });
    await batch.commit();
  }
}

/** Directory approver (workflow configuration) → shared account. */
export function accountFromApprover(a: ApproverRoleConfig | UserPersona): PortalAccount {
  const isApprover = 'roleKey' in a;
  const roleKey: PortalAccount['roleKey'] = isApprover ? (a as ApproverRoleConfig).roleKey : 'custom';
  return {
    email: normalizeEmail(a.email),
    name: a.name,
    title: isApprover ? (a as ApproverRoleConfig).title : (a as UserPersona).role,
    roleKey,
    department: a.department,
    campus: a.campus,
    region: a.region || 'All SST Campuses',
    canReviewStages: a.canReviewStages || [],
    isAdmin: roleKey === 'cpo' || undefined,
    isNotificationOnly: a.isNotificationOnly || undefined,
    notificationRoleType: a.notificationRoleType,
    active: true,
    source: 'directory'
  };
}

/** Workers whose ADP job title is exactly "Principal" (not assistant principals). */
export function findAdpPrincipals(roster: AdpWorker[]): AdpWorker[] {
  return roster.filter(w => w.employmentStatus === 'Active' && /^principal$/i.test((w.jobTitle || '').trim()));
}

export interface PrincipalImportPlan {
  toCreate: PortalAccount[];
  alreadyHaveAccount: { worker: AdpWorker; account: PortalAccount }[];
  missingEmail: AdpWorker[];
  missingCampus: AdpWorker[];
  /** Work email outside the allowed sign-in domains, so they could not sign in. */
  otherDomain: AdpWorker[];
}

/** Tidies ADP names: collapses repeated spaces and title-cases names stored in all capitals. */
export function cleanPersonName(name: string): string {
  const collapsed = name.replace(/\s+/g, ' ').trim();
  if (collapsed !== collapsed.toUpperCase()) return collapsed;
  return collapsed.toLowerCase().replace(/(^|[\s'-])(\p{L})/gu, (_, sep, ch) => sep + ch.toUpperCase());
}

/**
 * Plans campus principal accounts from the ADP roster. Existing accounts (matched by
 * email) are left as they are, so no one gets a duplicate account.
 */
export function planPrincipalAccounts(roster: AdpWorker[], existing: PortalAccount[]): PrincipalImportPlan {
  const byEmail = new Map(existing.map(a => [normalizeEmail(a.email), a]));
  const plan: PrincipalImportPlan = { toCreate: [], alreadyHaveAccount: [], missingEmail: [], missingCampus: [], otherDomain: [] };
  for (const w of findAdpPrincipals(roster)) {
    if (!w.workEmail) {
      plan.missingEmail.push(w);
      continue;
    }
    if (!isAllowedSignInEmail(w.workEmail)) {
      plan.otherDomain.push(w);
      continue;
    }
    const existingAccount = byEmail.get(normalizeEmail(w.workEmail));
    if (existingAccount) {
      plan.alreadyHaveAccount.push({ worker: w, account: existingAccount });
      continue;
    }
    if (!w.campus) {
      plan.missingCampus.push(w);
      continue;
    }
    const location = locationForCampus(w.campus as Campus);
    plan.toCreate.push({
      email: normalizeEmail(w.workEmail),
      name: cleanPersonName(w.fullName),
      title: CAMPUS_PRINCIPAL_TITLE,
      roleKey: 'supervisor',
      department: 'Campus Leadership',
      campus: w.campus,
      region: location === 'Central Administration' ? 'District Offices' : `${location} Area Campuses`,
      canReviewStages: ['draft', 'supervisor_review'],
      active: true,
      source: 'adp',
      adpAssociateId: w.associateId
    });
  }
  return plan;
}

/**
 * Account → the portal's user profile. Signature and PIN settings are kept from this
 * browser's matching approver when there is one.
 */
export function personaFromAccount(acc: PortalAccount, localMatch?: UserPersona | ApproverRoleConfig): UserPersona {
  return {
    id: localMatch?.id || `acct-${normalizeEmail(acc.email)}`,
    name: acc.name,
    role: acc.title,
    department: acc.department,
    email: normalizeEmail(acc.email),
    campus: acc.campus,
    region: acc.region,
    avatar: localMatch?.avatar || getInitialsAvatarUrl(acc.name, '0f2352'),
    canReviewStages: acc.canReviewStages,
    ipAddress: localMatch?.ipAddress || '',
    signerId: localMatch?.signerId || `acct-${normalizeEmail(acc.email)}`,
    signingPin: localMatch?.signingPin,
    signatureImage: localMatch?.signatureImage,
    isAccountActivated: true,
    isNotificationOnly: acc.isNotificationOnly,
    notificationRoleType: acc.notificationRoleType
  };
}

/** Account → workflow approver, so routing can find each campus's principal. */
export function approverFromAccount(acc: PortalAccount): ApproverRoleConfig {
  return {
    id: `acct-${normalizeEmail(acc.email)}`,
    roleKey: acc.roleKey,
    title: acc.title,
    name: acc.name,
    email: normalizeEmail(acc.email),
    department: acc.department,
    campus: acc.campus,
    region: acc.region,
    signerId: `acct-${normalizeEmail(acc.email)}`,
    ipAddress: '',
    avatar: getInitialsAvatarUrl(acc.name, '0f2352'),
    canReviewStages: acc.canReviewStages,
    isAccountActivated: true,
    isNotificationOnly: acc.isNotificationOnly,
    notificationRoleType: acc.notificationRoleType
  };
}

/** Fields the shared account decides; local signature, PIN, and photo settings are kept. */
function accountOverrides(acc: PortalAccount) {
  return {
    name: acc.name,
    department: acc.department,
    campus: acc.campus,
    region: acc.region,
    canReviewStages: acc.canReviewStages,
    isNotificationOnly: acc.isNotificationOnly === true,
    notificationRoleType: acc.notificationRoleType
  };
}

/**
 * Brings this browser's approver directory in line with the shared accounts (matched by
 * email): existing approvers take the account's role settings, missing ones are added.
 */
export function mergeAccountsIntoApprovers(approvers: ApproverRoleConfig[], accounts: PortalAccount[]): ApproverRoleConfig[] {
  const active = accounts.filter(a => a.active);
  const byEmail = new Map(active.map(a => [normalizeEmail(a.email), a]));
  const updated = approvers.map(a => {
    const acc = byEmail.get(normalizeEmail(a.email));
    return acc ? { ...a, ...accountOverrides(acc), title: acc.title } : a;
  });
  const known = new Set(approvers.map(a => normalizeEmail(a.email)));
  const added = active.filter(a => !known.has(normalizeEmail(a.email))).map(approverFromAccount);
  return [...updated, ...added];
}

/** Same as mergeAccountsIntoApprovers, for the portal's persona list. */
export function mergeAccountsIntoPersonas(personas: UserPersona[], accounts: PortalAccount[]): UserPersona[] {
  const active = accounts.filter(a => a.active);
  const byEmail = new Map(active.map(a => [normalizeEmail(a.email), a]));
  const updated = personas.map(p => {
    const acc = byEmail.get(normalizeEmail(p.email));
    return acc ? { ...p, ...accountOverrides(acc), role: acc.title } : p;
  });
  const known = new Set(personas.map(p => normalizeEmail(p.email)));
  const added = active.filter(a => !known.has(normalizeEmail(a.email))).map(a => personaFromAccount(a));
  return [...updated, ...added];
}
