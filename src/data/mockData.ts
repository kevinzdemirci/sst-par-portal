import { 
  UserPersona, 
  ActionType, 
  ApprovalStep,
  SchoolLocation,
  WorkflowConfig,
  SstRoutingRule
} from '../types/par';
import { getInitialsAvatarUrl } from '../utils/formatters';
import { SST_DEFAULT_LOGO, getNormalizedLogoUrl } from './sstLogo';

export { SST_DEFAULT_LOGO, getNormalizedLogoUrl };

export const DEFAULT_SST_ROUTING_RULES: SstRoutingRule[] = [
  {
    id: 'rule-supervisor',
    name: 'Principal / Supervisor Campus Endorsement',
    description: 'Initial review and administrative endorsement by Campus Principal or Direct Supervisor',
    stage: 'supervisor_review',
    stageLabel: 'Principal / Supervisor Endorsement',
    actionTypes: ['termination', 'role_change', 'salary_change', 'promotion', 'campus_transfer', 'leave_of_absence'],
    voluntaryCondition: 'all',
    regionCondition: 'all',
    assignedApproverId: 'p-vanessa',
    isEnabled: true,
    priorityOrder: 1
  },
  {
    id: 'rule-cpo-involuntary',
    name: 'Chief People Officer Review (Involuntary Terminations & Executive Actions)',
    description: 'Direct executive review and statutory evaluation by Dr. Kevin Demirci (CPO)',
    stage: 'cpo_review',
    stageLabel: 'Chief People Officer Review',
    actionTypes: ['termination'],
    voluntaryCondition: 'involuntary_only',
    regionCondition: 'all',
    assignedApproverId: 'p-kevin',
    isEnabled: true,
    priorityOrder: 2
  },
  {
    id: 'rule-regional-houston',
    name: 'Regional Executive Director Review (Houston Voluntary)',
    description: 'Executive review by Atnan Ekin for voluntary resignations in Houston campuses',
    stage: 'regional_review',
    stageLabel: 'Regional Executive Director Review',
    actionTypes: ['termination'],
    voluntaryCondition: 'voluntary_only',
    regionCondition: 'Houston',
    assignedApproverId: 'p-atnan',
    isEnabled: true,
    priorityOrder: 3
  },
  {
    id: 'rule-regional-sacc',
    name: 'Regional Executive Director Review (SA & CC Voluntary)',
    description: 'Executive review by Serdar Bulut for voluntary resignations in SA & CC campuses',
    stage: 'regional_review',
    stageLabel: 'Regional Executive Director Review',
    actionTypes: ['termination'],
    voluntaryCondition: 'voluntary_only',
    regionCondition: 'San Antonio & Corpus Christi',
    assignedApproverId: 'p-serdar',
    isEnabled: true,
    priorityOrder: 4
  },
  {
    id: 'rule-hr-houston',
    name: 'Regional HR Coordinator Review (Houston)',
    description: 'HR coordination and compliance verification by Kristy Stewart',
    stage: 'hr_review',
    stageLabel: 'Regional HR Coordinator Review',
    actionTypes: ['termination', 'role_change', 'salary_change', 'promotion', 'campus_transfer', 'leave_of_absence'],
    voluntaryCondition: 'all',
    regionCondition: 'Houston',
    assignedApproverId: 'p-kristy',
    isEnabled: true,
    priorityOrder: 5
  },
  {
    id: 'rule-hr-sacc',
    name: 'Regional HR Coordinator Review (SA & CC)',
    description: 'HR coordination and compliance verification by Amber Johnson',
    stage: 'hr_review',
    stageLabel: 'Regional HR Coordinator Review',
    actionTypes: ['termination', 'role_change', 'salary_change', 'promotion', 'campus_transfer', 'leave_of_absence'],
    voluntaryCondition: 'all',
    regionCondition: 'San Antonio & Corpus Christi',
    assignedApproverId: 'p-amber',
    isEnabled: true,
    priorityOrder: 6
  },
  {
    id: 'rule-benefits-all',
    name: 'Benefits & Leave Verification',
    description: 'COBRA, TRS, and benefit calculations verification by Ursula Villanueva',
    stage: 'benefits_review',
    stageLabel: 'Benefits & COBRA Verification',
    actionTypes: ['termination', 'leave_of_absence'],
    voluntaryCondition: 'all',
    regionCondition: 'all',
    assignedApproverId: 'p-ursula',
    isEnabled: true,
    priorityOrder: 7
  },
  {
    id: 'rule-payroll-final',
    name: 'Payroll Execution & ADP Closeout',
    description: 'Final wage calculation and ADP system execution by Paola Comparini',
    stage: 'payroll_action',
    stageLabel: 'Payroll & ADP Closeout',
    actionTypes: ['termination', 'role_change', 'salary_change', 'promotion', 'campus_transfer', 'leave_of_absence'],
    voluntaryCondition: 'all',
    regionCondition: 'all',
    assignedApproverId: 'p-paola',
    isEnabled: true,
    priorityOrder: 8
  }
];

export const DEFAULT_WORKFLOW_CONFIG: WorkflowConfig = {
  routingRules: DEFAULT_SST_ROUTING_RULES,
  stages: [
    {
      id: 'stg-supervisor',
      stage: 'supervisor_review',
      label: 'Principal / Supervisor Endorsement',
      description: 'Campus administrator / direct supervisor initial verification and recommendation.',
      department: 'Campus Leadership',
      color: 'blue',
      requiresSignature: true,
      requiresPin: true,
      isEnabled: true,
      allowedRoles: ['supervisor', 'custom'],
      requiredForActions: ['termination', 'role_change', 'salary_change', 'promotion', 'campus_transfer', 'leave_of_absence']
    },
    {
      id: 'stg-cpo',
      stage: 'cpo_review',
      label: 'Chief People Officer Review',
      description: 'Executive legal and statutory evaluation by Dr. Kevin Demirci (CPO).',
      department: 'Central Administration',
      color: 'rose',
      requiresSignature: true,
      requiresPin: true,
      isEnabled: true,
      allowedRoles: ['cpo', 'custom'],
      requiredForActions: ['termination']
    },
    {
      id: 'stg-regional',
      stage: 'regional_review',
      label: 'Regional Executive Director Review',
      description: 'Regional Executive Director operational clearance (Atnan Ekin / Serdar Bulut).',
      department: 'Regional Leadership',
      color: 'indigo',
      requiresSignature: true,
      requiresPin: true,
      isEnabled: true,
      allowedRoles: ['regional_houston', 'regional_sacc', 'custom'],
      requiredForActions: ['termination']
    },
    {
      id: 'stg-hr',
      stage: 'hr_review',
      label: 'Regional HR Coordinator Review',
      description: 'Regional HR compliance review, certification, and personnel checklist validation.',
      department: 'Human Resources',
      color: 'purple',
      requiresSignature: true,
      requiresPin: true,
      isEnabled: true,
      allowedRoles: ['hr_houston', 'hr_sacc', 'custom'],
      requiredForActions: ['termination', 'role_change', 'salary_change', 'promotion', 'campus_transfer', 'leave_of_absence']
    },
    {
      id: 'stg-benefits',
      stage: 'benefits_review',
      label: 'Benefits & COBRA Review',
      description: 'Benefits reconciliation, COBRA notification, and TRS state retirement report.',
      department: 'Benefits & Total Rewards',
      color: 'emerald',
      requiresSignature: true,
      requiresPin: true,
      isEnabled: true,
      allowedRoles: ['benefits', 'custom'],
      requiredForActions: ['termination', 'leave_of_absence']
    },
    {
      id: 'stg-payroll',
      stage: 'payroll_action',
      label: 'Payroll & ADP Closeout',
      description: 'Final payroll execution, wage adjustment, and ADP Workforce Now system synchronization.',
      department: 'Payroll Department',
      color: 'amber',
      requiresSignature: true,
      requiresPin: true,
      isEnabled: true,
      allowedRoles: ['payroll', 'custom'],
      requiredForActions: ['termination', 'role_change', 'salary_change', 'promotion', 'campus_transfer', 'leave_of_absence']
    }
  ],
  approvers: [
    {
      id: 'p-vanessa',
      roleKey: 'supervisor',
      title: 'Principal / Supervisor',
      name: 'Vanessa Nguyen',
      email: 'vnguyen@ssttx.org',
      department: 'Campus Leadership',
      campus: 'SST Champions Elementary',
      region: 'Houston Area Campuses',
      signerId: '1024226a-f233-42a5-8683-51395806dcc7',
      ipAddress: '12.238.48.90',
      avatar: getInitialsAvatarUrl('Vanessa Nguyen', '0f2352'),
      canReviewStages: ['draft', 'supervisor_review'],
      isAccountActivated: true,
      signingPin: '1234'
    },
    {
      id: 'p-kevin',
      roleKey: 'cpo',
      title: 'Chief People Officer',
      name: 'Dr. Kevin Demirci',
      email: 'kdemirci@ssttx.org',
      department: 'Central Administration',
      region: 'All SST Schools (Involuntary & Executive)',
      signerId: '7a374357-998f-4203-8874-8b95cb88898d',
      ipAddress: '208.184.164.228',
      avatar: getInitialsAvatarUrl('Dr. Kevin Demirci', '0f2352'),
      canReviewStages: ['cpo_review'],
      isAccountActivated: true,
      signingPin: '1234'
    },
    {
      id: 'p-atnan',
      roleKey: 'regional_houston',
      title: 'Regional Executive Director (Houston)',
      name: 'Atnan Ekin',
      email: 'aekin@ssttx.org',
      department: 'Houston Regional Leadership',
      region: 'Houston Area Campuses (Voluntary Resignations)',
      signerId: '5b194821-3910-4820-9921-8841a0294821',
      ipAddress: '208.184.164.230',
      avatar: getInitialsAvatarUrl('Atnan Ekin', '1e3a8a'),
      canReviewStages: ['regional_review'],
      isAccountActivated: true,
      signingPin: '1234'
    },
    {
      id: 'p-serdar',
      roleKey: 'regional_sacc',
      title: 'Regional Executive Director (SA & CC)',
      name: 'Serdar Bulut',
      email: 'sbulut@ssttx.org',
      department: 'Central Office / Regional Leadership',
      region: 'San Antonio & Corpus Christi Campuses (Voluntary)',
      signerId: '6c295832-4021-5931-0032-9952b1305932',
      ipAddress: '208.184.164.231',
      avatar: getInitialsAvatarUrl('Serdar Bulut', '1e3a8a'),
      canReviewStages: ['regional_review'],
      isAccountActivated: true,
      signingPin: '1234'
    },
    {
      id: 'p-kristy',
      roleKey: 'hr_houston',
      title: 'Regional HR Coordinator (Houston)',
      name: 'Kristy Stewart',
      email: 'kstewart@ssttx.org',
      department: 'Human Resources',
      region: 'Houston Area Campuses',
      signerId: '8cee36a3-eb8d-4b04-96ec-0fcd6397c6fc',
      ipAddress: '108.65.54.105',
      avatar: getInitialsAvatarUrl('Kristy Stewart', '047857'),
      canReviewStages: ['hr_review', 'revision_requested'],
      isAccountActivated: true,
      signingPin: '1234'
    },
    {
      id: 'p-amber',
      roleKey: 'hr_sacc',
      title: 'Regional HR Coordinator (SA & CC)',
      name: 'Amber Johnson',
      email: 'ajohnson@ssttx.org',
      department: 'Human Resources',
      region: 'San Antonio & Corpus Christi Campuses',
      signerId: '9bee47b4-fc9e-5c15-07fd-1fde7408d7fd',
      ipAddress: '208.184.164.232',
      avatar: getInitialsAvatarUrl('Amber Johnson', '047857'),
      canReviewStages: ['hr_review', 'revision_requested'],
      isAccountActivated: true,
      signingPin: '1234'
    },
    {
      id: 'p-ursula',
      roleKey: 'benefits',
      title: 'Benefits & Leave Coordinator',
      name: 'Ursula Villanueva',
      email: 'uvillanueva@ssttx.org',
      department: 'Benefits & Total Rewards',
      region: 'Central Office / All SST Schools',
      signerId: '0e97e30e-841a-4263-a558-61ffac5f61b3',
      ipAddress: '208.184.164.228',
      avatar: getInitialsAvatarUrl('Ursula Villanueva', '7c2d12'),
      canReviewStages: ['benefits_review'],
      isAccountActivated: true,
      signingPin: '1234'
    },
    {
      id: 'p-paola',
      roleKey: 'payroll',
      title: 'Payroll Coordinator',
      name: 'Paola Comparini',
      email: 'pcomparini@ssttx.org',
      department: 'Payroll Department',
      region: 'Central Office / All SST Schools',
      signerId: '4f291ab8-7612-4a01-9871-3312cb889021',
      ipAddress: '208.184.164.228',
      avatar: getInitialsAvatarUrl('Paola Comparini', 'b91c1c'),
      canReviewStages: ['payroll_action'],
      isAccountActivated: true,
      signingPin: '1234'
    },
    {
      id: 'p-enes',
      roleKey: 'it_houston',
      title: 'Regional Director of IT (Houston)',
      name: 'Enes Sevik',
      email: 'esevik@ssttx.org',
      department: 'Information Technology',
      region: 'Houston Area Campuses',
      signerId: 'SST-NOTIF-ENES',
      ipAddress: '108.65.54.120',
      avatar: getInitialsAvatarUrl('Enes Sevik', '4338ca'),
      canReviewStages: [],
      isNotificationOnly: true,
      notificationRoleType: 'it',
      isAccountActivated: true,
      signingPin: '1234'
    },
    {
      id: 'p-ahmet',
      roleKey: 'it_sacc',
      title: 'Regional Director of IT (SA & CC)',
      name: 'Ahmet Kaya',
      email: 'akaya@ssttx.org',
      department: 'Information Technology',
      region: 'San Antonio & Corpus Christi Campuses',
      signerId: 'SST-NOTIF-AHMET',
      ipAddress: '208.184.164.240',
      avatar: getInitialsAvatarUrl('Ahmet Kaya', '4338ca'),
      canReviewStages: [],
      isNotificationOnly: true,
      notificationRoleType: 'it',
      isAccountActivated: true,
      signingPin: '1234'
    },
    {
      id: 'p-hasan',
      roleKey: 'ta_houston',
      title: 'Regional Director of Talent Acquisitions (Houston)',
      name: 'Hasan Kendirci',
      email: 'hkendirci@ssttx.org',
      department: 'Talent Acquisition & Staffing',
      region: 'Houston Area Campuses',
      signerId: 'SST-NOTIF-HASAN',
      ipAddress: '108.65.54.122',
      avatar: getInitialsAvatarUrl('Hasan Kendirci', '0d9488'),
      canReviewStages: [],
      isNotificationOnly: true,
      notificationRoleType: 'talent_acquisition',
      isAccountActivated: true,
      signingPin: '1234'
    },
    {
      id: 'p-ali',
      roleKey: 'ta_sacc',
      title: 'Regional Director of Talent Acquisitions (SA & CC)',
      name: 'Ali Dal',
      email: 'adal@ssttx.org',
      department: 'Talent Acquisition & Staffing',
      region: 'San Antonio & Corpus Christi Campuses',
      signerId: 'SST-NOTIF-ALI',
      ipAddress: '208.184.164.242',
      avatar: getInitialsAvatarUrl('Ali Dal', '0d9488'),
      canReviewStages: [],
      isNotificationOnly: true,
      notificationRoleType: 'talent_acquisition',
      isAccountActivated: true,
      signingPin: '1234'
    }
  ],
  districtName: 'School of Science and Technology (SST)',
  districtLogo: SST_DEFAULT_LOGO,
  hrNotificationEmail: 'hr@ssttx.org',
  emailWebhookUrl: ''
};

export const USER_PERSONAS: UserPersona[] = [
  {
    id: 'p-vanessa',
    name: 'Vanessa Nguyen',
    role: 'Principal / Supervisor',
    department: 'Campus Leadership',
    campus: 'SST Champions Elementary',
    region: 'Houston Area',
    email: 'vnguyen@ssttx.org',
    avatar: getInitialsAvatarUrl('Vanessa Nguyen', '0f2352'),
    canReviewStages: ['draft', 'supervisor_review'],
    signerId: '1024226a-f233-42a5-8683-51395806dcc7',
    ipAddress: '12.238.48.90',
    isAccountActivated: true,
    signingPin: '1234'
  },
  {
    id: 'p-kevin',
    name: 'Dr. Kevin Demirci',
    role: 'Chief People Officer',
    department: 'Central Administration',
    campus: 'Central Office',
    region: 'All SST Schools',
    email: 'kdemirci@ssttx.org',
    avatar: getInitialsAvatarUrl('Dr. Kevin Demirci', '0f2352'),
    canReviewStages: ['cpo_review'],
    signerId: '7a374357-998f-4203-8874-8b95cb88898d',
    ipAddress: '208.184.164.228',
    isAccountActivated: true,
    signingPin: '1234'
  },
  {
    id: 'p-atnan',
    name: 'Atnan Ekin',
    role: 'Regional Executive Director (Houston)',
    department: 'Houston Regional Leadership',
    campus: 'SST Houston Regional Office',
    region: 'Houston Area',
    email: 'aekin@ssttx.org',
    avatar: getInitialsAvatarUrl('Atnan Ekin', '1e3a8a'),
    canReviewStages: ['regional_review'],
    signerId: '5b194821-3910-4820-9921-8841a0294821',
    ipAddress: '208.184.164.230',
    isAccountActivated: true,
    signingPin: '1234'
  },
  {
    id: 'p-serdar',
    name: 'Serdar Bulut',
    role: 'Regional Executive Director (SA & CC)',
    department: 'Central Office / Regional Leadership',
    campus: 'SST Central Office (District Administration)',
    region: 'San Antonio & Corpus Christi',
    email: 'sbulut@ssttx.org',
    avatar: getInitialsAvatarUrl('Serdar Bulut', '1e3a8a'),
    canReviewStages: ['regional_review'],
    signerId: '6c295832-4021-5931-0032-9952b1305932',
    ipAddress: '208.184.164.231',
    isAccountActivated: true,
    signingPin: '1234'
  },
  {
    id: 'p-kristy',
    name: 'Kristy Stewart',
    role: 'Regional HR Coordinator (Houston)',
    department: 'Human Resources',
    campus: 'SST Houston Regional Office',
    region: 'Houston Area',
    email: 'kstewart@ssttx.org',
    avatar: getInitialsAvatarUrl('Kristy Stewart', '047857'),
    canReviewStages: ['hr_review', 'revision_requested'],
    signerId: '8cee36a3-eb8d-4b04-96ec-0fcd6397c6fc',
    ipAddress: '108.65.54.105',
    isAccountActivated: true,
    signingPin: '1234'
  },
  {
    id: 'p-amber',
    name: 'Amber Johnson',
    role: 'Regional HR Coordinator (SA & CC)',
    department: 'Human Resources',
    campus: 'SST Central Office (District Administration)',
    region: 'San Antonio & Corpus Christi',
    email: 'ajohnson@ssttx.org',
    avatar: getInitialsAvatarUrl('Amber Johnson', '047857'),
    canReviewStages: ['hr_review', 'revision_requested'],
    signerId: '9bee47b4-fc9e-5c15-07fd-1fde7408d7fd',
    ipAddress: '208.184.164.232',
    isAccountActivated: true,
    signingPin: '1234'
  },
  {
    id: 'p-ursula',
    name: 'Ursula Villanueva',
    role: 'Benefits & Leave Coordinator',
    department: 'Benefits & Total Rewards',
    campus: 'Central Office',
    region: 'All SST Schools',
    email: 'uvillanueva@ssttx.org',
    avatar: getInitialsAvatarUrl('Ursula Villanueva', '7c2d12'),
    canReviewStages: ['benefits_review'],
    signerId: '0e97e30e-841a-4263-a558-61ffac5f61b3',
    ipAddress: '208.184.164.228',
    isAccountActivated: true,
    signingPin: '1234'
  },
  {
    id: 'p-paola',
    name: 'Paola Comparini',
    role: 'Payroll Coordinator',
    department: 'Payroll Department',
    campus: 'Central Office',
    region: 'All SST Schools',
    email: 'pcomparini@ssttx.org',
    avatar: getInitialsAvatarUrl('Paola Comparini', 'b91c1c'),
    canReviewStages: ['payroll_action'],
    signerId: '4f291ab8-7612-4a01-9871-3312cb889021',
    ipAddress: '208.184.164.228',
    isAccountActivated: true,
    signingPin: '1234'
  },
  {
    id: 'p-enes',
    name: 'Enes Sevik',
    role: 'Regional Director of IT (Houston)',
    department: 'Information Technology',
    campus: 'SST Houston Regional Office',
    region: 'Houston Area',
    email: 'esevik@ssttx.org',
    avatar: getInitialsAvatarUrl('Enes Sevik', '4338ca'),
    canReviewStages: [],
    isNotificationOnly: true,
    notificationRoleType: 'it',
    signerId: 'SST-NOTIF-ENES',
    ipAddress: '108.65.54.120',
    isAccountActivated: true,
    signingPin: '1234'
  },
  {
    id: 'p-ahmet',
    name: 'Ahmet Kaya',
    role: 'Regional Director of IT (SA & CC)',
    department: 'Information Technology',
    campus: 'SST Central Office (District Administration)',
    region: 'San Antonio & Corpus Christi',
    email: 'akaya@ssttx.org',
    avatar: getInitialsAvatarUrl('Ahmet Kaya', '4338ca'),
    canReviewStages: [],
    isNotificationOnly: true,
    notificationRoleType: 'it',
    signerId: 'SST-NOTIF-AHMET',
    ipAddress: '208.184.164.240',
    isAccountActivated: true,
    signingPin: '1234'
  },
  {
    id: 'p-hasan',
    name: 'Hasan Kendirci',
    role: 'Regional Director of Talent Acquisitions (Houston)',
    department: 'Talent Acquisition & Staffing',
    campus: 'SST Houston Regional Office',
    region: 'Houston Area',
    email: 'hkendirci@ssttx.org',
    avatar: getInitialsAvatarUrl('Hasan Kendirci', '0d9488'),
    canReviewStages: [],
    isNotificationOnly: true,
    notificationRoleType: 'talent_acquisition',
    signerId: 'SST-NOTIF-HASAN',
    ipAddress: '108.65.54.122',
    isAccountActivated: true,
    signingPin: '1234'
  },
  {
    id: 'p-ali',
    name: 'Ali Dal',
    role: 'Regional Director of Talent Acquisitions (SA & CC)',
    department: 'Talent Acquisition & Staffing',
    campus: 'SST Central Office (District Administration)',
    region: 'San Antonio & Corpus Christi',
    email: 'adal@ssttx.org',
    avatar: getInitialsAvatarUrl('Ali Dal', '0d9488'),
    canReviewStages: [],
    isNotificationOnly: true,
    notificationRoleType: 'talent_acquisition',
    signerId: 'SST-NOTIF-ALI',
    ipAddress: '208.184.164.242',
    isAccountActivated: true,
    signingPin: '1234'
  }
];

export function buildSstRouting(
  actionType: ActionType,
  isVoluntary?: boolean,
  location?: SchoolLocation,
  config: WorkflowConfig = DEFAULT_WORKFLOW_CONFIG,
  campus?: string
): ApprovalStep[] {
  const steps: ApprovalStep[] = [];
  const rules = config.routingRules && config.routingRules.length > 0
    ? config.routingRules
    : DEFAULT_SST_ROUTING_RULES;

  // Active rules sorted by priority order
  const activeRules = [...rules]
    .filter(r => r.isEnabled)
    .sort((a, b) => a.priorityOrder - b.priorityOrder);

  for (const rule of activeRules) {
    // 1. Check if the stage is globally enabled in config.stages
    const stageSetting = config.stages?.find(s => s.stage === rule.stage);
    if (stageSetting && stageSetting.isEnabled === false) {
      continue;
    }

    // 2. Action Type check
    if (rule.actionTypes && rule.actionTypes.length > 0 && !rule.actionTypes.includes(actionType)) {
      continue;
    }

    // 3. Voluntary condition check (for termination actions)
    if (actionType === 'termination') {
      if (rule.voluntaryCondition === 'voluntary_only' && isVoluntary !== true) {
        continue;
      }
      if (rule.voluntaryCondition === 'involuntary_only' && isVoluntary !== false) {
        continue;
      }
    }

    // 4. Region condition check
    if (rule.regionCondition && rule.regionCondition !== 'all') {
      if (rule.regionCondition === 'Houston') {
        if (location !== 'Houston') continue;
      } else if (rule.regionCondition === 'San Antonio & Corpus Christi') {
        if (location !== 'San Antonio' && location !== 'Corpus Christi') continue;
      } else if (location && rule.regionCondition !== location) {
        continue;
      }
    }

    // 5. Approver resolution
    // The Principal / Supervisor step goes to the principal of the employee's campus when one is set up.
    const campusPrincipal = rule.stage === 'supervisor_review' && campus
      ? config.approvers.find(a => a.roleKey === 'supervisor' && a.campus === campus && !a.isNotificationOnly)
      : undefined;

    const matchedApprover = campusPrincipal
      || config.approvers.find(a => a.id === rule.assignedApproverId)
      || config.approvers.find(a => a.roleKey === rule.assignedApproverId)
      || (rule.assignedApproverId === 'p-atnan' && location !== 'Houston' ? config.approvers.find(a => a.id === 'p-serdar') : null)
      || (rule.assignedApproverId === 'p-kristy' && location !== 'Houston' ? config.approvers.find(a => a.id === 'p-amber') : null);

    const assignedRole = matchedApprover ? matchedApprover.title : (rule.customRoleTitle || 'Authorized Approver');
    const assignedDept = matchedApprover ? matchedApprover.department : (rule.customDepartment || 'District Administration');
    const assignedEmail = matchedApprover ? matchedApprover.email : (rule.customEmail || 'hr@ssttx.org');

    steps.push({
      id: `step-${rule.id}`,
      stage: rule.stage,
      stageLabel: rule.stageLabel,
      assignedRole,
      assignedDepartment: assignedDept,
      assignedEmail,
      status: 'pending'
    });
  }

  // Safety fallback if no steps match
  if (steps.length === 0) {
    steps.push({
      id: 'step-supervisor-fallback',
      stage: 'supervisor_review',
      stageLabel: 'Principal / Supervisor Endorsement',
      assignedRole: 'Principal / Supervisor',
      assignedDepartment: 'Campus Leadership',
      assignedEmail: 'vnguyen@ssttx.org',
      status: 'pending'
    });
  }

  return steps;
}

