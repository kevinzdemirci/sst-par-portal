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
  // Corpus Christi Region
  'SST Corpus Christi Elementary',
  'SST Corpus Christi College Prep High School',
  'SST Main Campus (Corpus Christi)',
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
    'SST Sonterra'
  ],
  'Corpus Christi Area': [
    'SST Corpus Christi Elementary',
    'SST Corpus Christi College Prep High School',
    'SST Main Campus (Corpus Christi)'
  ],
  'District Offices': [
    'SST Central Office (District Administration)',
    'SST Houston Regional Office'
  ]
};

export type SchoolLocation = 'Houston' | 'San Antonio' | 'Corpus Christi' | 'Central Administration';

export type Priority = 'low' | 'normal' | 'high' | 'urgent';

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
}

export interface ApproverRoleConfig {
  id: string;
  roleKey: 'supervisor' | 'cpo' | 'regional_houston' | 'regional_sacc' | 'hr_houston' | 'hr_sacc' | 'benefits' | 'payroll' | 'custom';
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
}

export interface WorkflowStageSetting {
  id: string;
  stage: WorkflowStage;
  label: string;
  description: string;
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
}

