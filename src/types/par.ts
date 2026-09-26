export type ActionType = 
  | 'termination'
  | 'role_change'
  | 'salary_change'
  | 'promotion'
  | 'campus_transfer'
  | 'leave_of_absence';

export type WorkflowStage =
  | 'draft'
  | 'supervisor_review' // Principal / Supervisor
  | 'regional_review'   // Regional Exec Director (Atnan Ekin - Houston, Serdar Bulut - SA/CC) for voluntary
  | 'cpo_review'        // Chief People Officer (Dr. Kevin Demirci) for involuntary & executive
  | 'hr_review'         // HR Director (Kristy Stewart)
  | 'benefits_review'   // Benefits Coordinator (Ursula Villanueva)
  | 'payroll_action'    // Payroll Final Processing
  | 'completed'
  | 'rejected'
  | 'revision_requested';

export const SST_CAMPUSES = [
  // Houston Region
  'SST Champions Elementary',
  'SST Champions College Prep High School',
  'SST Spring',
  'SST Advancement',
  'SST Sugar Land',
  'SST Sugar Land College Prep High School',
  'SST The Woodlands',
  'SST Willow Creek',
  // San Antonio Region
  'SST San Antonio College Prep High School',
  'SST Discovery',
  'SST Alamo',
  'SST Northwest',
  'SST Hill Country',
  'SST Hill Country College Prep High School',
  'SST Sonterra',
  'SST Schertz',
  'SST San Antonio Regional Office',
  'NF Greg Garcia Elementary (NFPS Partner)',
  'NF Frank L. Madla Early College High School (NFPS Partner)',
  // Corpus Christi Region
  'SST Corpus Christi Elementary',
  'SST Corpus Christi Early Elementary',
  'SST Bayshore',
  'SST Corpus Christi College Prep High School',
  // District Administration
  'SST Central Office (District Administration)',
  'SST Houston Regional Office'
] as const;

export type Campus = typeof SST_CAMPUSES[number];

export const SST_CAMPUS_REGIONS: Record<string, Campus[]> = {
  'Houston Area': [
    'SST Champions Elementary',
    'SST Champions College Prep High School',
    'SST Spring',
    'SST Advancement',
    'SST Sugar Land',
    'SST Sugar Land College Prep High School',
    'SST The Woodlands',
    'SST Willow Creek'
  ],
  'San Antonio Area': [
    'SST San Antonio College Prep High School',
    'SST Discovery',
    'SST Alamo',
    'SST Northwest',
    'SST Hill Country',
    'SST Hill Country College Prep High School',
    'SST Sonterra',
    'SST Schertz',
    'SST San Antonio Regional Office',
    'NF Greg Garcia Elementary (NFPS Partner)',
    'NF Frank L. Madla Early College High School (NFPS Partner)'
  ],
  'Corpus Christi Area': [
    'SST Corpus Christi Elementary',
    'SST Corpus Christi Early Elementary',
    'SST Bayshore',
    'SST Corpus Christi College Prep High School'
  ],
  'District Offices': [
    'SST Central Office (District Administration)',
    'SST Houston Regional Office'
  ]
};

export type SchoolLocation = 'Houston' | 'San Antonio' | 'Corpus Christi' | 'Central Administration';

export type Priority = 'low' | 'normal' | 'high' | 'urgent';

export type RehireEligibility = 'Yes' | 'No' | 'Review Required';

/** Leave types on SST's Employee Request For Leave. */
export const LEAVE_TYPES = [
  'Family and Medical Leave (FMLA)',
  'Short-term Disability Leave',
  'Bereavement Leave',
  'Military Leave',
  'Emergency Leave',
  'Jury Duty or Other Court Appearance',
  'Other'
] as const;

export type LeaveType = typeof LEAVE_TYPES[number];

/** Leave types that need a medical certification (sent to Benefits, never attached to the PAR). */
export const MEDICAL_LEAVE_TYPES: readonly LeaveType[] = ['Family and Medical Leave (FMLA)', 'Short-term Disability Leave'];

export const BEREAVEMENT_RELATIONSHIPS = [
  'Spouse',
  'Child',
  'Parent',
  'Sibling',
  'Grandparent',
  'Grandchild',
  'Parent-in-law',
  'Son- or daughter-in-law',
  'Brother- or sister-in-law',
  'Other relative'
] as const;

export type MedicalCertificationStatus = 'Sent to Benefits' | 'Employee will send to Benefits';

export interface TerminationReason {
  code: string;
  label: string;
  group: string;
  /** Fits a voluntary separation (employee resigned). */
  voluntary: boolean;
  /** Fits an involuntary separation (SST ended employment). */
  involuntary: boolean;
}

/**
 * ADP Workforce Now termination reason codes SST has used (from ADP's separated-worker
 * records, 2026-09-26). The PAR records the same code Payroll enters in ADP.
 */
export const TERMINATION_REASONS: TerminationReason[] = [
  { code: 'R', label: 'Resignation - Personal Reasons', group: 'Resignation', voluntary: true, involuntary: false },
  { code: 'B', label: 'Resignation - Better Opportunity Elsewhere', group: 'Resignation', voluntary: true, involuntary: false },
  { code: 'H', label: 'Resignation - Relocation', group: 'Resignation', voluntary: true, involuntary: false },
  { code: 'C', label: 'Resignation - Dissatisfaction with Role/Environment', group: 'Resignation', voluntary: true, involuntary: false },
  { code: 'U', label: 'Retirement', group: 'Retirement', voluntary: true, involuntary: false },
  { code: 'E', label: 'Performance - Failure to Improve After Coaching/Support', group: 'Performance', voluntary: false, involuntary: true },
  { code: 'M', label: 'Performance - Inability to Meet Job Expectations', group: 'Performance', voluntary: false, involuntary: true },
  { code: 'N', label: 'Misconduct - Inappropriate Behavior', group: 'Misconduct', voluntary: false, involuntary: true },
  { code: 'J', label: 'Misconduct - Violation of School Policy', group: 'Misconduct', voluntary: false, involuntary: true },
  { code: 'T', label: 'Attendance - Excessive Absenteeism', group: 'Attendance', voluntary: false, involuntary: true },
  { code: 'D', label: 'Attendance', group: 'Attendance', voluntary: false, involuntary: true },
  { code: 'A', label: 'Job Abandonment', group: 'Attendance', voluntary: true, involuntary: true },
  { code: 'L', label: 'Failure to Maintain Certification/Licensure', group: 'Licensure', voluntary: false, involuntary: true },
  { code: 'Y', label: 'Reduction in Force', group: 'Workforce Changes', voluntary: false, involuntary: true },
  { code: 'W', label: 'Position Closed', group: 'Workforce Changes', voluntary: false, involuntary: true },
  { code: 'G', label: 'Deceased', group: 'Other', voluntary: true, involuntary: true },
  { code: 'O', label: 'Other', group: 'Other', voluntary: true, involuntary: true }
];

/** Stored and displayed as "R = Resignation - Personal Reasons". */
export const formatTerminationCode = (r: TerminationReason) => `${r.code} = ${r.label}`;

export const TERMINATION_CODES: string[] = TERMINATION_REASONS.map(formatTerminationCode);

export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  adpId: string;
  associateId: string;
  email: string;
  title: string;
  location: SchoolLocation;
  campus: Campus;
  status: 'Full-time' | 'Part-time' | 'Sub';
  currentSalary: number;
  hireDate: string;
  supervisorName: string;
  dpsSid?: string;
}

export interface ElectronicSignatureRecord {
  signingParty: string;
  signerName: string;
  signerEmail: string;
  signerId: string;
  ipAddress: string;
  timestamp?: string;
  status: 'pending' | 'signed' | 'rejected' | 'returned';
  notes?: string;
}

export interface ApprovalStep {
  id: string;
  stage: WorkflowStage;
  stageLabel: string;
  assignedRole: string;
  assignedName?: string;
  assignedDepartment: string;
  assignedEmail: string;
  status: 'pending' | 'approved' | 'rejected' | 'returned';
  reviewerName?: string;
  decisionDate?: string;
  comments?: string;
  ipAddress?: string;
  signerId?: string;
}

export interface ActivityComment {
  id: string;
  authorName: string;
  authorRole: string;
  authorDepartment: string;
  authorAvatar?: string;
  timestamp: string;
  message: string;
  isSystemEvent?: boolean;
}

export interface Attachment {
  id: string;
  name: string;
  size: string;
  uploadedBy: string;
  uploadedAt: string;
  fileType: string;
}

export interface DepartmentNotificationRecord {
  id: string;
  recipientName: string;
  recipientEmail: string;
  recipientRole: string;
  department: string;
  region: string;
  type: 'it' | 'talent_acquisition' | 'dps' | 'other';
  status: 'notified' | 'pending';
  notifiedAt?: string;
  actionRequired: boolean;
  purpose: string;
  notes?: string;
}

export interface PersonnelActionRequest {
  id: string;
  trackingNumber: string;
  actionType: ActionType;
  priority: Priority;
  currentStage: WorkflowStage;
  effectiveDate: string;
  gtpuid: string;

  // Employee Information
  employeeId: string;
  firstName: string;
  lastName: string;
  middleInitial?: string;
  title: string;
  location: SchoolLocation;
  campus: Campus;
  employmentStatus: 'Full-time' | 'Part-time' | 'Sub';
  workEmail: string;
  associateId: string;
  dpsSid?: string;

  // Compensation Info
  currentSalary: number;
  proposedSalary?: number;
  percentIncrease?: number;
  salaryChangeReason?: string;
  stipendAmount?: number;

  // Role / Campus Change Info
  proposedTitle?: string;
  proposedCampus?: Campus;
  proposedLocation?: SchoolLocation;
  proposedSupervisor?: string;
  notesRelatingToPositionChange?: string;

  // Termination Documentation (Questions 1 - 9)
  isVoluntary?: boolean; // Voluntary = resigned (Regional Exec Director), Involuntary = terminated (Dr. Kevin Demirci - CPO)
  isSchoolYearNonRenewal?: boolean;
  lastDayWorked?: string;
  reasonForTermination?: string;
  terminationCode?: string;
  allPtoEnteredInAdp?: boolean;
  returnedCharterProperty?: boolean;
  hasWrittenStatements?: boolean;
  outstandingStipendsOwed?: boolean;
  finalPayCheckComment?: string;
  outstandingPropertyNotes?: string;
  rehireEligibility?: RehireEligibility;
  finalPayDeadline?: string; // Texas Payday Law (Tex. Lab. Code § 61.014) deadline, YYYY-MM-DD

  // Leave of Absence (SST Employee Request For Leave)
  leaveType?: LeaveType;            // first selected type (older PARs have only this)
  leaveTypes?: LeaveType[];
  leaveStartDate?: string;
  expectedReturnDate?: string;
  isPaidLeave?: boolean;
  firstDayOfEmployment?: string;
  bereavementRelationship?: string;
  emergencyLeaveReason?: string;
  otherLeaveReason?: string;
  medicalCertificationStatus?: MedicalCertificationStatus;
  leavePremiumsAcknowledged?: boolean;       // employee pays benefit premiums while on leave
  leaveReturnCertAcknowledged?: boolean;     // employee provides medical certification to return
  employeeLeaveRequestSigned?: boolean;      // employee signed SST's Employee Request For Leave

  // Texas Charter HR Compliance & Employment Agreement Status
  contractType?: 'At-Will';
  trsNotificationRequired?: boolean;
  cobraNoticeDueDate?: string;
  laptopReturned?: boolean;
  keysBadgesReturned?: boolean;
  sisGradebookClosed?: boolean;

  // HR - Termination Information (Page 2)
  markRehireStatus?: boolean;
  notifySis?: boolean;
  immediatePayoutRequired?: boolean;
  isPartTimeOrSub?: boolean;
  startDate?: string;
  endDate?: string;
  totalWorkingDays?: number;
  totalUtoDays?: number;
  totalWorkedDays?: number;
  totalCompensatedDays?: number;
  ptoBalance?: number;
  totalPtoDays?: number;
  totalPtoDaysEarned?: number;
  totalPtoDaysUnearned?: number;

  // Payroll Section (Page 3)
  earnedWages?: number;
  dailyRate?: number;
  unearnedPtoDeduction?: number;
  paidWages?: number;
  deductions?: number;
  leaveBenefitsDeduction?: number;
  finalPay?: number;
  notesForHr?: string;
  notesForBenefits?: string;
  notesForPayroll?: string;
  ptoNotes?: string;

  // Submitter Details
  submittedBy: string;
  submitterEmail: string;
  submitterRole: string;
  submittedAt: string;
  updatedAt: string;

  // Multi-department signatures & workflow
  routingSteps: ApprovalStep[];
  electronicSignatures: ElectronicSignatureRecord[];
  comments: ActivityComment[];
  attachments: Attachment[];
  departmentNotifications?: DepartmentNotificationRecord[];
}

export interface UserPersona {
  id: string;
  name: string;
  role: string;
  department: string;
  email: string;
  campus?: string;
  region?: string;
  avatar: string;
  canReviewStages: WorkflowStage[];
  ipAddress: string;
  signerId: string;
  signingPin?: string;
  signatureStyle?: string;
  signatureImage?: string;
  isAccountActivated?: boolean;
  isNotificationOnly?: boolean;
  notificationRoleType?: 'it' | 'talent_acquisition' | 'other';
}

export interface ApproverRoleConfig {
  id: string;
  roleKey: 'supervisor' | 'cpo' | 'regional_houston' | 'regional_sacc' | 'hr_houston' | 'hr_sacc' | 'benefits' | 'payroll' | 'it_houston' | 'it_sacc' | 'ta_houston' | 'ta_sacc' | 'notification' | 'custom';
  title: string;
  name: string;
  email: string;
  department: string;
  campus?: string;
  region: string;
  signerId: string;
  ipAddress: string;
  avatar: string;
  canReviewStages?: WorkflowStage[];
  signingPin?: string;
  signatureImage?: string;
  isAccountActivated?: boolean;
  isNotificationOnly?: boolean;
  notificationRoleType?: 'it' | 'talent_acquisition' | 'other';
}

export interface WorkflowStageSetting {
  id: string;
  stage: WorkflowStage;
  label: string;
  description: string;
  department?: string;
  color?: string;
  requiresSignature?: boolean;
  requiresPin?: boolean;
  allowedRoles?: string[];
  isEnabled: boolean;
  requiredForActions: ActionType[];
}

export type RuleRegionCondition = 'all' | 'Houston' | 'San Antonio' | 'Corpus Christi' | 'San Antonio & Corpus Christi' | 'Austin' | 'Central Administration';
export type RuleVoluntaryCondition = 'all' | 'voluntary_only' | 'involuntary_only';

export interface SstRoutingRule {
  id: string;
  name: string;
  description: string;
  stage: WorkflowStage;
  stageLabel: string;
  actionTypes: ActionType[];
  voluntaryCondition: RuleVoluntaryCondition;
  regionCondition: RuleRegionCondition;
  assignedApproverId: string;
  customRoleTitle?: string;
  customEmail?: string;
  customDepartment?: string;
  isEnabled: boolean;
  priorityOrder: number;
}

export interface WorkflowConfig {
  stages: WorkflowStageSetting[];
  approvers: ApproverRoleConfig[];
  routingRules: SstRoutingRule[];
  districtName?: string;
  districtLogo?: string;
  hrNotificationEmail?: string;
  emailWebhookUrl?: string;
}

export interface ActivationInvitation {
  id: string;
  recipientName: string;
  recipientEmail: string;
  roleId: string;
  roleTitle: string;
  department: string;
  campus?: string;
  region?: string;
  invitationToken: string;
  activationUrl: string;
  sentAt: string;
  status: 'sent' | 'opened' | 'activated';
}

