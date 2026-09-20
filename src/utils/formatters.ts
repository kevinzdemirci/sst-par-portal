import { ActionType, WorkflowStage, Priority, PersonnelActionRequest, UserPersona } from '../types/par';

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
      if (par.location === 'Houston' && (persona.email === 'kstewart@ssttx.org' || persona.region?.includes('Houston'))) {
        return true;
      }
      // San Antonio & Corpus Christi: Amber Johnson (ajohnson@ssttx.org)
      if ((par.location === 'San Antonio' || par.location === 'Corpus Christi') && (persona.email === 'ajohnson@ssttx.org' || persona.email === 'ajohnson@ssttx.orf' || persona.region?.includes('San Antonio'))) {
        return true;
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
  roleBadgeText: string;
}

export function getPersonaPermissions(persona: UserPersona): PersonaPermissions {
  const isCpo = isChiefPeopleOfficer(persona);
  const isPrincipalOrSupervisor = persona.role.includes('Principal') || persona.role.includes('Supervisor') || persona.canReviewStages.includes('supervisor_review');

  return {
    isCpo,
    canManageWorkflow: isCpo,
    canAddRemoveRoles: isCpo,
    canSendInvites: isCpo,
    canCreatePar: isCpo || isPrincipalOrSupervisor,
    canConfigureOwnEsign: true,
    roleBadgeText: isCpo 
      ? 'Chief People Officer (Super Admin)' 
      : `${persona.role} (${persona.department})`
  };
}

