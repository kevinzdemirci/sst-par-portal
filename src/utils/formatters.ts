import { ActionType, WorkflowStage, Priority, PersonnelActionRequest, UserPersona } from '../types/par';
import { PayoutStatus, PayoutType } from '../types/payout';

export function formatCurrency(amount?: number): string {
  if (amount === undefined || isNaN(amount)) return '$0';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(amount);
}

export function formatDate(dateString?: string): string {
  if (!dateString) return '—';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric'
    });
  } catch {
    return dateString;
  }
}

export function formatDateTime(dateString?: string): string {
  if (!dateString) return '—';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return dateString;
  }
}

export function getActionTypeInfo(type: ActionType): {
  label: string;
  badgeClass: string;
  dotClass: string;
  iconName: string;
} {
  switch (type) {
    case 'termination':
      return {
        label: 'Termination / Separation',
        badgeClass: 'bg-rose-50 text-rose-800 border-rose-200',
        dotClass: 'bg-rose-600',
        iconName: 'UserMinus'
      };
    case 'salary_change':
      return {
        label: 'Salary / Stipend Adjustment',
        badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        dotClass: 'bg-emerald-600',
        iconName: 'BadgeDollarSign'
      };
    case 'role_change':
      return {
        label: 'Role / Title Change',
        badgeClass: 'bg-blue-50 text-blue-800 border-blue-200',
        dotClass: 'bg-blue-600',
        iconName: 'UserCheck'
      };
    case 'promotion':
      return {
        label: 'Promotion',
        badgeClass: 'bg-purple-50 text-purple-800 border-purple-200',
        dotClass: 'bg-purple-600',
        iconName: 'TrendingUp'
      };
    case 'campus_transfer':
      return {
        label: 'Campus Transfer',
        badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
        dotClass: 'bg-amber-600',
        iconName: 'ArrowRightLeft'
      };
    case 'leave_of_absence':
      return {
        label: 'Leave of Absence',
        badgeClass: 'bg-cyan-50 text-cyan-800 border-cyan-200',
        dotClass: 'bg-cyan-600',
        iconName: 'CalendarClock'
      };
    default:
      return {
        label: type,
        badgeClass: 'bg-slate-100 text-slate-800 border-slate-200',
        dotClass: 'bg-slate-600',
        iconName: 'FileText'
      };
  }
}

export function getStageInfo(stage: WorkflowStage): {
  label: string;
  department: string;
  badgeClass: string;
  bgColor: string;
  textColor: string;
  isTerminal?: boolean;
} {
  switch (stage) {
    case 'draft':
      return {
        label: 'Draft',
        department: 'Campus Submitter',
        badgeClass: 'bg-slate-100 text-slate-700 border-slate-300',
        bgColor: 'bg-slate-50',
        textColor: 'text-slate-700'
      };
    case 'supervisor_review':
      return {
        label: 'Principal / Supervisor',
        department: 'Campus Leadership',
        badgeClass: 'bg-amber-50 text-amber-800 border-amber-300',
        bgColor: 'bg-amber-50',
        textColor: 'text-amber-900'
      };
    case 'regional_review':
      return {
        label: 'Regional Exec Director',
        department: 'Regional Leadership',
        badgeClass: 'bg-orange-50 text-orange-800 border-orange-300',
        bgColor: 'bg-orange-50',
        textColor: 'text-orange-900'
      };
    case 'cpo_review':
      return {
        label: 'Chief People Officer',
        department: 'Dr. Kevin Demirci',
        badgeClass: 'bg-purple-50 text-purple-800 border-purple-300',
        bgColor: 'bg-purple-50',
        textColor: 'text-purple-900'
      };
    case 'hr_review':
      return {
        label: 'Regional HR Policy & PTO Audit',
        department: 'Kristy Stewart (Houston) / Amber Johnson (SA & CC)',
        badgeClass: 'bg-blue-50 text-blue-800 border-blue-300',
        bgColor: 'bg-blue-50',
        textColor: 'text-blue-900'
      };
    case 'benefits_review':
      return {
        label: 'Benefits Sign-Off',
        department: 'Ursula Villanueva',
        badgeClass: 'bg-teal-50 text-teal-800 border-teal-300',
        bgColor: 'bg-teal-50',
        textColor: 'text-teal-900'
      };
    case 'payroll_action':
      return {
        label: 'Payroll ADP Execution',
        department: 'Paola Comparini (Payroll)',
        badgeClass: 'bg-indigo-50 text-indigo-800 border-indigo-300',
        bgColor: 'bg-indigo-50',
        textColor: 'text-indigo-900'
      };
    case 'completed':
      return {
        label: 'Completed & Executed',
        department: 'All Signatures Secured',
        badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-300',
        bgColor: 'bg-emerald-50',
        textColor: 'text-emerald-900',
        isTerminal: true
      };
    case 'rejected':
      return {
        label: 'Rejected',
        department: 'Declined',
        badgeClass: 'bg-red-50 text-red-800 border-red-300',
        bgColor: 'bg-red-50',
        textColor: 'text-red-900',
        isTerminal: true
      };
    case 'revision_requested':
      return {
        label: 'Revision Requested',
        department: 'Pending Campus Revision',
        badgeClass: 'bg-orange-50 text-orange-900 border-orange-300',
        bgColor: 'bg-orange-50',
        textColor: 'text-orange-900'
      };
  }
}

export function getPriorityBadge(priority: Priority): {
  label: string;
  className: string;
} {
  switch (priority) {
    case 'urgent':
      return { label: 'Urgent', className: 'bg-red-100 text-red-800 border-red-200 animate-pulse' };
    case 'high':
      return { label: 'High', className: 'bg-amber-100 text-amber-800 border-amber-200' };
    case 'normal':
      return { label: 'Normal', className: 'bg-slate-100 text-slate-700 border-slate-200' };
    case 'low':
      return { label: 'Low', className: 'bg-slate-50 text-slate-500 border-slate-200' };
  }
}

export function canPersonaActOnPar(persona: UserPersona, par: PersonnelActionRequest): boolean {
  // Notification-only personas have no action required
  if (persona.isNotificationOnly) {
    return false;
  }

  if (par.currentStage === 'completed' || par.currentStage === 'rejected') {
    return false;
  }

  // 1. Supervisor / Principal Review
  if (par.currentStage === 'supervisor_review') {
    return persona.canReviewStages.includes('supervisor_review') || persona.role.includes('Principal') || persona.role.includes('Supervisor');
  }

  // 2. Chief People Officer Review (Involuntary Terminations & Executive approvals)
  if (par.currentStage === 'cpo_review') {
    return persona.canReviewStages.includes('cpo_review') || persona.role.includes('Chief People Officer') || persona.email === 'kdemirci@ssttx.org';
  }

  // 3. Regional Executive Director Review (Voluntary Terminations & Campus assignments)
  if (par.currentStage === 'regional_review') {
    if (persona.canReviewStages.includes('regional_review')) {
      // Houston region: Atnan Ekin (aekin@ssttx.org)
      if (par.location === 'Houston' && persona.email === 'aekin@ssttx.org') {
        return true;
      }
      // San Antonio & Corpus Christi: Serdar Bulut (sbulut@ssttx.org)
      if ((par.location === 'San Antonio' || par.location === 'Corpus Christi') && persona.email === 'sbulut@ssttx.org') {
        return true;
      }
      // If persona has general regional review
      return persona.role.includes('Regional Executive Director');
    }
  }

  // 4. Regional HR Review (Kristy Stewart for Houston; Amber Johnson for SA & CC)
  if (par.currentStage === 'hr_review') {
    if (persona.canReviewStages.includes('hr_review')) {
      // Houston region: Kristy Stewart (kstewart@ssttx.org)
      if (par.location === 'Houston') {
        return persona.email === 'kstewart@ssttx.org' || (persona.region?.includes('Houston') ?? false);
      }
      // San Antonio & Corpus Christi: Amber Johnson (ajohnson@ssttx.org)
      if (par.location === 'San Antonio' || par.location === 'Corpus Christi') {
        return persona.email === 'ajohnson@ssttx.org' || persona.email === 'ajohnson@ssttx.orf' || (persona.region?.includes('San Antonio') ?? false) || (persona.region?.includes('Corpus Christi') ?? false);
      }
      return persona.department === 'Human Resources';
    }
  }

  // 5. Benefits Review
  if (par.currentStage === 'benefits_review') {
    return persona.canReviewStages.includes('benefits_review') || persona.department.includes('Benefits') || persona.email === 'uvillanueva@ssttx.org';
  }

  // 6. Payroll Final Execution
  if (par.currentStage === 'payroll_action') {
    return persona.canReviewStages.includes('payroll_action') || persona.department.includes('Payroll') || persona.email === 'pcomparini@ssttx.org' || persona.email === 'payroll@ssttx.org';
  }

  if (par.currentStage === 'revision_requested') {
    return persona.name === par.submittedBy || persona.department === 'Human Resources';
  }

  return false;
}

/**
 * Role-Based Access Control: Determines if the given persona is the Chief People Officer (Dr. Kevin Demirci).
 * Chief People Officer has full administrative privileges: workflow administration, adding/removing roles,
 * deactivating accounts, and editing district approval rules.
 */
export function isChiefPeopleOfficer(persona?: UserPersona | null): boolean {
  if (!persona) return false;
  return (
    persona.email.toLowerCase() === 'kdemirci@ssttx.org' ||
    persona.role.toLowerCase().includes('chief people officer') ||
    persona.id === 'p-kevin'
  );
}

export interface PersonaPermissions {
  isCpo: boolean;
  canManageWorkflow: boolean;
  canAddRemoveRoles: boolean;
  canSendInvites: boolean;
  canCreatePar: boolean;
  canConfigureOwnEsign: boolean;
  isNotificationOnly: boolean;
  roleBadgeText: string;
}

export function getPersonaPermissions(persona: UserPersona): PersonaPermissions {
  const isCpo = isChiefPeopleOfficer(persona);
  const isNotificationOnly = Boolean(persona.isNotificationOnly);
  const isPrincipalOrSupervisor = persona.role.includes('Principal') || persona.role.includes('Supervisor') || persona.canReviewStages.includes('supervisor_review');

  return {
    isCpo,
    canManageWorkflow: isCpo,
    canAddRemoveRoles: isCpo,
    canSendInvites: isCpo,
    canCreatePar: !isNotificationOnly && (isCpo || isPrincipalOrSupervisor),
    canConfigureOwnEsign: !isNotificationOnly,
    isNotificationOnly,
    roleBadgeText: isCpo 
      ? 'Chief People Officer (Super Admin)' 
      : isNotificationOnly
        ? `📢 Notification Only (FYI) • ${persona.role}`
        : `${persona.role} (${persona.department})`
  };
}

/**
 * Resolves the automated department notification recipients (IT and Talent Acquisition)
 * for a PAR based on its campus and geographical region.
 * These departments receive FYI notifications with NO action or approval required.
 */
export function getDepartmentNotificationRecipients(
  location?: string,
  campus?: string
): import('../types/par').DepartmentNotificationRecord[] {
  const locStr = (location || '').toLowerCase();
  const campusStr = (campus || '').toLowerCase();
  const isHouston = locStr === 'houston' || 
    campusStr.includes('houston') || 
    campusStr.includes('champions') || 
    campusStr.includes('spring') || 
    campusStr.includes('advancement') || 
    campusStr.includes('sugar land') || 
    campusStr.includes('woodlands') || 
    campusStr.includes('willow creek');

  const now = new Date().toISOString();

  if (isHouston) {
    return [
      {
        id: 'notif-it-hou',
        recipientName: 'Enes Sevik',
        recipientEmail: 'esevik@ssttx.org',
        recipientRole: 'IT Department Lead (Houston)',
        department: 'Information Technology',
        region: 'Houston Area Campuses',
        type: 'it',
        status: 'notified',
        notifiedAt: now,
        actionRequired: false,
        purpose: 'IT equipment recovery (laptops, monitors, keycard badges), Google Workspace de-provisioning, and SIS access management'
      },
      {
        id: 'notif-ta-hou',
        recipientName: 'Hasan Kendirci',
        recipientEmail: 'hkendirci@ssttx.org',
        recipientRole: 'Regional Director of Talent Acquisitions (Houston)',
        department: 'Talent Acquisition & Staffing',
        region: 'Houston Area Campuses',
        type: 'talent_acquisition',
        status: 'notified',
        notifiedAt: now,
        actionRequired: false,
        purpose: 'Position vacancy notification, staffing requisition, and backfill recruitment pipeline'
      }
    ];
  } else {
    // San Antonio & Corpus Christi
    return [
      {
        id: 'notif-it-sacc',
        recipientName: 'Ahmet Kaya',
        recipientEmail: 'akaya@ssttx.org',
        recipientRole: 'IT Department Lead (SA & CC)',
        department: 'Information Technology',
        region: 'San Antonio & Corpus Christi Campuses',
        type: 'it',
        status: 'notified',
        notifiedAt: now,
        actionRequired: false,
        purpose: 'IT equipment recovery (laptops, monitors, keycard badges), Google Workspace de-provisioning, and SIS access management'
      },
      {
        id: 'notif-ta-sacc',
        recipientName: 'Ali Dal',
        recipientEmail: 'adal@ssttx.org',
        recipientRole: 'Regional Director of Talent Acquisitions (SA & CC)',
        department: 'Talent Acquisition & Staffing',
        region: 'San Antonio & Corpus Christi Campuses',
        type: 'talent_acquisition',
        status: 'notified',
        notifiedAt: now,
        actionRequired: false,
        purpose: 'Position vacancy notification, staffing requisition, and backfill recruitment pipeline'
      }
    ];
  }
}

/**
 * Checks if the given persona is a Regional HR Coordinator (Kristy Stewart or Amber Johnson).
 * Regional HR Coordinators can initiate CPO Payout and Deduction approval requests.
 */
export function isRegionalHrCoordinator(persona?: UserPersona | null): boolean {
  if (!persona) return false;
  const email = (persona.email || '').toLowerCase();
  const role = (persona.role || '').toLowerCase();
  return (
    email === 'kstewart@ssttx.org' ||
    email === 'ajohnson@ssttx.org' ||
    role.includes('regional hr coordinator') ||
    role.includes('hr coordinator')
  );
}

/**
 * Checks if the given persona is authorized to initiate new PAR requests.
 * Notification-only roles (IT, Talent Acquisition) and unauthorized users cannot create PARs.
 */
export function canPersonaCreatePar(persona?: UserPersona | null): boolean {
  if (!persona) return false;
  if (persona.isNotificationOnly) return false;
  return true;
}

/**
 * Checks if the given persona has Super Admin district privileges (Dr. Kevin Demirci).
 */
export function isSuperAdmin(persona?: UserPersona | null): boolean {
  if (!persona) return false;
  const email = (persona.email || '').toLowerCase();
  return isChiefPeopleOfficer(persona) || email === 'kdemirci@ssttx.org';
}

/**
 * Checks if the given persona is the Payroll Coordinator (Paola Comparini).
 */
export function isPayrollCoordinator(persona?: UserPersona | null): boolean {
  if (!persona) return false;
  const email = (persona.email || '').toLowerCase();
  const role = (persona.role || '').toLowerCase();
  return (
    email === 'pcomparini@ssttx.org' ||
    role.includes('payroll')
  );
}

/**
 * Visual badge helper for Payout Types (Payment vs Deduction)
 */
export function formatPayoutTypeBadge(type: PayoutType): {
  label: string;
  badgeClass: string;
  dotClass: string;
  sign: string;
} {
  if (type === 'payment') {
    return {
      label: 'Payment / Payout',
      badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold',
      dotClass: 'bg-emerald-600',
      sign: '+'
    };
  }
  return {
    label: 'Payroll Deduction',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-300 font-bold',
    dotClass: 'bg-amber-600',
    sign: '-'
  };
}

/**
 * Visual badge helper for Payout Statuses
 */
export function formatPayoutStatusBadge(status: PayoutStatus): {
  label: string;
  badgeClass: string;
  dotClass: string;
} {
  switch (status) {
    case 'pending_cpo':
      return {
        label: 'Pending CPO Approval',
        badgeClass: 'bg-rose-50 text-rose-800 border-rose-300 animate-pulse',
        dotClass: 'bg-rose-600'
      };
    case 'approved_by_cpo':
      return {
        label: 'Approved by CPO (Queued for Payroll)',
        badgeClass: 'bg-blue-50 text-blue-800 border-blue-300',
        dotClass: 'bg-blue-600'
      };
    case 'processed_payroll':
      return {
        label: 'Processed in ADP (Completed)',
        badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-300',
        dotClass: 'bg-emerald-600'
      };
    case 'rejected':
      return {
        label: 'Rejected by CPO',
        badgeClass: 'bg-slate-100 text-slate-700 border-slate-300',
        dotClass: 'bg-slate-500'
      };
    case 'revision_required':
      return {
        label: 'Revision / Info Requested',
        badgeClass: 'bg-amber-50 text-amber-800 border-amber-300',
        dotClass: 'bg-amber-600'
      };
    default:
      return {
        label: status,
        badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
        dotClass: 'bg-slate-500'
      };
  }
}

/**
 * Generate a clean official SST initials avatar URL
 */
export function getInitialsAvatarUrl(name: string, bg: string = '0f2352'): string {
  const safeName = (name || 'Approver').trim() || 'Approver';
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(safeName)}&background=${bg}&color=fff&size=160&bold=true`;
}

/**
 * Standard Texas Charter HR Revision / Rejection Reasons
 */
export const HR_REVISION_REASONS = [
  'Missing formal letter of resignation / signed separation notice',
  'Last day worked conflicts with campus attendance / biometric records',
  'Proposed compensation adjustment exceeds board-approved salary scale',
  'ADP Position Control & job requisition code verification required',
  'TRS Form 7/10 Notice of Separation required before payroll release',
  'Outstanding district assets (laptop, charger, master keys, RFID badge) unreturned',
  'Exit interview & handover documentation has not been completed',
  'PTO / UTO day balance requires campus verification before payroll settlement',
  'TEA PEIMS / At-Will agreement documentation requires amendment'
] as const;

/**
 * Calculate Texas statutory 30-day COBRA notification deadline from Last Day Worked
 */
export function getTexasCobraDeadline(lastDayWorked?: string): {
  deadlineDateStr: string;
  isOverdue: boolean;
  daysRemaining: number;
} {
  if (!lastDayWorked) {
    return { deadlineDateStr: 'N/A', isOverdue: false, daysRemaining: 30 };
  }
  const ldw = new Date(lastDayWorked);
  if (isNaN(ldw.getTime())) {
    return { deadlineDateStr: 'N/A', isOverdue: false, daysRemaining: 30 };
  }
  const deadline = new Date(ldw);
  deadline.setDate(deadline.getDate() + 30);
  
  const today = new Date();
  const diffTime = deadline.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return {
    deadlineDateStr: deadline.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    isOverdue: diffDays < 0,
    daysRemaining: diffDays
  };
}

/**
 * Generate CSV string in official Texas charter compliant format
 */
export function generateParsCsvString(pars: PersonnelActionRequest[]): string {
  const headers = [
    'Tracking Number',
    'Submission Date',
    'Employee Full Name',
    'ADP Associate ID',
    'Campus',
    'Location Region',
    'Current Position',
    'Action Type',
    'Effective Date',
    'Workflow Status',
    'Current Step',
    'Contract Type',
    'TRS Notification Required',
    'Last Day Worked',
    'COBRA Notice Due',
    'Current Salary',
    'Proposed Salary',
    'Salary Change',
    'Final Payout / Net Wages',
    'Signatures Completed',
    'Submitted By',
    'Submitter Email',
    'Last Updated'
  ];

  const rows = pars.map((p) => {
    const sigsCount = `${p.electronicSignatures.filter(s => s.status === 'signed').length}/${p.electronicSignatures.length}`;
    const cobra = getTexasCobraDeadline(p.lastDayWorked);
    const salaryDelta = (p.proposedSalary || p.currentSalary) - p.currentSalary;
    
    return [
      `"${p.trackingNumber}"`,
      `"${p.submittedAt ? new Date(p.submittedAt).toLocaleDateString() : ''}"`,
      `"${p.firstName} ${p.lastName}"`,
      `"${p.employeeId}"`,
      `"${p.campus}"`,
      `"${p.location}"`,
      `"${p.title}"`,
      `"${p.actionType.replace('_', ' ').toUpperCase()}"`,
      `"${p.effectiveDate}"`,
      `"${p.currentStage.replace('_', ' ').toUpperCase()}"`,
      `"${p.routingSteps.find(s => s.status === 'pending')?.stageLabel || (p.currentStage === 'completed' ? 'Completed' : 'Review')}"`,
      `"${p.contractType || 'At-Will'}"`,
      `"${p.trsNotificationRequired ? 'YES' : 'NO'}"`,
      `"${p.lastDayWorked || 'N/A'}"`,
      `"${cobra.deadlineDateStr}"`,
      `"${p.currentSalary.toFixed(2)}"`,
      `"${(p.proposedSalary || p.currentSalary).toFixed(2)}"`,
      `"${salaryDelta.toFixed(2)}"`,
      `"${(p.finalPay || 0).toFixed(2)}"`,
      `"${sigsCount}"`,
      `"${p.submittedBy}"`,
      `"${p.submitterEmail}"`,
      `"${new Date(p.updatedAt).toLocaleDateString()} ${new Date(p.updatedAt).toLocaleTimeString()}"`
    ];
  });

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

/**
 * Export PAR records to official Texas charter compliant CSV format and trigger browser download
 */
export function exportParsToCsv(pars: PersonnelActionRequest[]): void {
  const csvContent = generateParsCsvString(pars);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `SST_PAR_Master_Export_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}


