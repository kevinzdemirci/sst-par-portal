import { 
  PersonnelActionRequest, 
  Employee, 
  UserPersona, 
  ActionType, 
  ApprovalStep,
  SchoolLocation,
  WorkflowConfig,
  SstRoutingRule
} from '../types/par';
import { getDepartmentNotificationRecipients } from '../utils/formatters';

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
    name: 'Involuntary Terminations — Chief People Officer',
    description: 'All involuntary separations across all SST campuses must be approved by Dr. Kevin Demirci (CPO)',
    stage: 'cpo_review',
    stageLabel: 'Chief People Officer Approval (Involuntary)',
    actionTypes: ['termination'],
    voluntaryCondition: 'involuntary_only',
    regionCondition: 'all',
    assignedApproverId: 'p-kevin',
    isEnabled: true,
    priorityOrder: 2
  },
  {
    id: 'rule-regional-houston-voluntary',
    name: 'Voluntary Resignations (Houston Campuses) — Regional Exec Director',
    description: 'Voluntary resignations from Houston area schools are reviewed by Atnan Ekin',
    stage: 'regional_review',
    stageLabel: 'Regional Exec Director Approval (Houston Area)',
    actionTypes: ['termination'],
    voluntaryCondition: 'voluntary_only',
    regionCondition: 'Houston',
    assignedApproverId: 'p-atnan',
    isEnabled: true,
    priorityOrder: 3
  },
  {
    id: 'rule-regional-sacc-voluntary',
    name: 'Voluntary Resignations (San Antonio & CC) — Regional Exec Director',
    description: 'Voluntary resignations from San Antonio & Corpus Christi schools are reviewed by Serdar Bulut',
    stage: 'regional_review',
    stageLabel: 'Regional Exec Director Approval (SA & CC Area)',
    actionTypes: ['termination'],
    voluntaryCondition: 'voluntary_only',
    regionCondition: 'San Antonio & Corpus Christi',
    assignedApproverId: 'p-serdar',
    isEnabled: true,
    priorityOrder: 4
  },
  {
    id: 'rule-cpo-compensation',
    name: 'Executive Compensation & Advancement Review',
    description: 'Salary adjustments, stipends, and promotions reviewed by Chief People Officer',
    stage: 'cpo_review',
    stageLabel: 'Chief People Officer Compensation Review',
    actionTypes: ['salary_change', 'promotion'],
    voluntaryCondition: 'all',
    regionCondition: 'all',
    assignedApproverId: 'p-kevin',
    isEnabled: true,
    priorityOrder: 5
  },
  {
    id: 'rule-regional-transfer',
    name: 'Campus Transfers & Staff Reassignments',
    description: 'Staff transfers across campus locations reviewed by Regional Executive Directors',
    stage: 'regional_review',
    stageLabel: 'Regional Executive Director Transfer Approval',
    actionTypes: ['campus_transfer', 'role_change'],
    voluntaryCondition: 'all',
    regionCondition: 'all',
    assignedApproverId: 'p-atnan',
    isEnabled: true,
    priorityOrder: 6
  },
  {
    id: 'rule-hr-houston',
    name: 'Regional HR Policy & PTO Audit (Houston Campuses)',
    description: 'Houston campus Personnel Action Requests audited by Kristy Stewart',
    stage: 'hr_review',
    stageLabel: 'HR Policy, Rehire & PTO Audit (Houston)',
    actionTypes: ['termination', 'role_change', 'salary_change', 'promotion', 'campus_transfer', 'leave_of_absence'],
    voluntaryCondition: 'all',
    regionCondition: 'Houston',
    assignedApproverId: 'p-kristy',
    isEnabled: true,
    priorityOrder: 7
  },
  {
    id: 'rule-hr-sacc',
    name: 'Regional HR Policy & PTO Audit (San Antonio & CC)',
    description: 'San Antonio & Corpus Christi requests audited by Amber Johnson',
    stage: 'hr_review',
    stageLabel: 'HR Policy, Rehire & PTO Audit (SA & CC)',
    actionTypes: ['termination', 'role_change', 'salary_change', 'promotion', 'campus_transfer', 'leave_of_absence'],
    voluntaryCondition: 'all',
    regionCondition: 'San Antonio & Corpus Christi',
    assignedApproverId: 'p-amber',
    isEnabled: true,
    priorityOrder: 8
  },
  {
    id: 'rule-benefits',
    name: 'Benefits & COBRA Separation Sign-Off',
    description: 'Benefits separation, medical/dental cancellation, and COBRA verification by Ursula Villanueva',
    stage: 'benefits_review',
    stageLabel: 'Benefits & Leave Sign-Off',
    actionTypes: ['termination', 'leave_of_absence'],
    voluntaryCondition: 'all',
    regionCondition: 'all',
    assignedApproverId: 'p-ursula',
    isEnabled: true,
    priorityOrder: 9
  },
  {
    id: 'rule-payroll',
    name: 'Payroll Final Check & ADP Execution',
    description: 'Final wage calculation, deductions, and ADP profile closeout by Paola Comparini',
    stage: 'payroll_action',
    stageLabel: 'Payroll Final Check & ADP Execution',
    actionTypes: ['termination', 'role_change', 'salary_change', 'promotion', 'campus_transfer', 'leave_of_absence'],
    voluntaryCondition: 'all',
    regionCondition: 'all',
    assignedApproverId: 'p-paola',
    isEnabled: true,
    priorityOrder: 10
  }
];

export const DEFAULT_WORKFLOW_CONFIG: WorkflowConfig = {
  routingRules: DEFAULT_SST_ROUTING_RULES,
  stages: [
    {
      id: 'ws-supervisor',
      stage: 'supervisor_review',
      label: 'Campus Principal / Supervisor',
      description: 'Campus level review and administrative endorsement',
      isEnabled: true,
      requiredForActions: ['termination', 'role_change', 'salary_change', 'promotion', 'campus_transfer', 'leave_of_absence']
    },
    {
      id: 'ws-executive',
      stage: 'cpo_review',
      label: 'Executive Leadership (CPO / Regional Exec Directors)',
      description: 'CPO for Involuntary/Modifications; Regional Execs for Voluntary Resignations',
      isEnabled: true,
      requiredForActions: ['termination', 'role_change', 'salary_change', 'promotion', 'campus_transfer', 'leave_of_absence']
    },
    {
      id: 'ws-hr',
      stage: 'hr_review',
      label: 'Regional HR Policy, Rehire & PTO Audit',
      description: 'Regional HR Coordinators (Kristy Stewart - Houston, Amber Johnson - SA & CC)',
      isEnabled: true,
      requiredForActions: ['termination', 'role_change', 'salary_change', 'promotion', 'campus_transfer', 'leave_of_absence']
    },
    {
      id: 'ws-benefits',
      stage: 'benefits_review',
      label: 'Benefits & Leave Verification',
      description: 'COBRA election, benefits termination and health plan reconciliation',
      isEnabled: true,
      requiredForActions: ['termination', 'leave_of_absence']
    },
    {
      id: 'ws-payroll',
      stage: 'payroll_action',
      label: 'Payroll ADP Execution & Wage Settlement',
      description: 'Final check calculation, deduction adjustments, and ADP profile closeout',
      isEnabled: true,
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
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80',
      canReviewStages: ['draft', 'supervisor_review']
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
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
      canReviewStages: ['cpo_review']
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
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&auto=format&fit=crop&q=80',
      canReviewStages: ['regional_review']
    },
    {
      id: 'p-serdar',
      roleKey: 'regional_sacc',
      title: 'Regional Executive Director (SA & CC)',
      name: 'Serdar Bulut',
      email: 'sbulut@ssttx.org',
      department: 'Regional Leadership (SA & CC)',
      region: 'San Antonio & Corpus Christi Campuses (Voluntary Resignations)',
      signerId: '6c295832-4021-5931-0032-9952b1305932',
      ipAddress: '208.184.164.231',
      avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=120&auto=format&fit=crop&q=80',
      canReviewStages: ['regional_review']
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
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&auto=format&fit=crop&q=80',
      canReviewStages: ['hr_review', 'revision_requested']
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
      avatar: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=120&auto=format&fit=crop&q=80',
      canReviewStages: ['hr_review', 'revision_requested']
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
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
      canReviewStages: ['benefits_review']
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
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80',
      canReviewStages: ['payroll_action']
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
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
      canReviewStages: [],
      isNotificationOnly: true,
      notificationRoleType: 'it'
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
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80',
      canReviewStages: [],
      isNotificationOnly: true,
      notificationRoleType: 'it'
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
      avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=120&auto=format&fit=crop&q=80',
      canReviewStages: [],
      isNotificationOnly: true,
      notificationRoleType: 'talent_acquisition'
    },
    {
      id: 'p-ali',
      roleKey: 'ta_sacc',
      title: 'Regional Director of Talent Acquisitions (SA & CC)',
      name: 'Ali Dalm',
      email: 'adal@ssttx.org',
      department: 'Talent Acquisition & Staffing',
      region: 'San Antonio & Corpus Christi Campuses',
      signerId: 'SST-NOTIF-ALI',
      ipAddress: '208.184.164.242',
      avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=120&auto=format&fit=crop&q=80',
      canReviewStages: [],
      isNotificationOnly: true,
      notificationRoleType: 'talent_acquisition'
    }
  ],
  districtName: 'School of Science and Technology (SST)',
  districtLogo: '/sst-logo.jpg'
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
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80',
    canReviewStages: ['draft', 'supervisor_review'],
    signerId: '1024226a-f233-42a5-8683-51395806dcc7',
    ipAddress: '12.238.48.90'
  },
  {
    id: 'p-kevin',
    name: 'Dr. Kevin Demirci',
    role: 'Chief People Officer',
    department: 'Central Administration',
    campus: 'Central Office',
    region: 'All SST Schools',
    email: 'kdemirci@ssttx.org',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
    canReviewStages: ['cpo_review'],
    signerId: '7a374357-998f-4203-8874-8b95cb88898d',
    ipAddress: '208.184.164.228'
  },
  {
    id: 'p-atnan',
    name: 'Atnan Ekin',
    role: 'Regional Executive Director (Houston)',
    department: 'Houston Regional Leadership',
    campus: 'SST Houston Regional Office',
    region: 'Houston Area',
    email: 'aekin@ssttx.org',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&auto=format&fit=crop&q=80',
    canReviewStages: ['regional_review'],
    signerId: '5b194821-3910-4820-9921-8841a0294821',
    ipAddress: '208.184.164.230'
  },
  {
    id: 'p-serdar',
    name: 'Serdar Bulut',
    role: 'Regional Executive Director (SA & CC)',
    department: 'Central Office / Regional Leadership',
    campus: 'SST Central Office (District Administration)',
    region: 'San Antonio & Corpus Christi',
    email: 'sbulut@ssttx.org',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=120&auto=format&fit=crop&q=80',
    canReviewStages: ['regional_review'],
    signerId: '6c295832-4021-5931-0032-9952b1305932',
    ipAddress: '208.184.164.231'
  },
  {
    id: 'p-kristy',
    name: 'Kristy Stewart',
    role: 'Regional HR Coordinator (Houston)',
    department: 'Human Resources',
    campus: 'SST Houston Regional Office',
    region: 'Houston Area',
    email: 'kstewart@ssttx.org',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&auto=format&fit=crop&q=80',
    canReviewStages: ['hr_review', 'revision_requested'],
    signerId: '8cee36a3-eb8d-4b04-96ec-0fcd6397c6fc',
    ipAddress: '108.65.54.105'
  },
  {
    id: 'p-amber',
    name: 'Amber Johnson',
    role: 'Regional HR Coordinator (SA & CC)',
    department: 'Human Resources',
    campus: 'SST Central Office (District Administration)',
    region: 'San Antonio & Corpus Christi',
    email: 'ajohnson@ssttx.org',
    avatar: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=120&auto=format&fit=crop&q=80',
    canReviewStages: ['hr_review', 'revision_requested'],
    signerId: '9bee47b4-fc9e-5c15-07fd-1fde7408d7fd',
    ipAddress: '208.184.164.232'
  },
  {
    id: 'p-ursula',
    name: 'Ursula Villanueva',
    role: 'Benefits & Leave Coordinator',
    department: 'Benefits & Total Rewards',
    campus: 'Central Office',
    region: 'All SST Schools',
    email: 'uvillanueva@ssttx.org',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    canReviewStages: ['benefits_review'],
    signerId: '0e97e30e-841a-4263-a558-61ffac5f61b3',
    ipAddress: '208.184.164.228'
  },
  {
    id: 'p-paola',
    name: 'Paola Comparini',
    role: 'Payroll Coordinator',
    department: 'Payroll Department',
    campus: 'Central Office',
    region: 'All SST Schools',
    email: 'pcomparini@ssttx.org',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80',
    canReviewStages: ['payroll_action'],
    signerId: '4f291ab8-7612-4a01-9871-3312cb889021',
    ipAddress: '208.184.164.228'
  },
  {
    id: 'p-enes',
    name: 'Enes Sevik',
    role: 'Regional Director of IT (Houston)',
    department: 'Information Technology',
    campus: 'SST Houston Regional Office',
    region: 'Houston Area',
    email: 'esevik@ssttx.org',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    canReviewStages: [],
    isNotificationOnly: true,
    notificationRoleType: 'it',
    signerId: 'SST-NOTIF-ENES',
    ipAddress: '108.65.54.120'
  },
  {
    id: 'p-ahmet',
    name: 'Ahmet Kaya',
    role: 'Regional Director of IT (SA & CC)',
    department: 'Information Technology',
    campus: 'SST Central Office (District Administration)',
    region: 'San Antonio & Corpus Christi',
    email: 'akaya@ssttx.org',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80',
    canReviewStages: [],
    isNotificationOnly: true,
    notificationRoleType: 'it',
    signerId: 'SST-NOTIF-AHMET',
    ipAddress: '208.184.164.240'
  },
  {
    id: 'p-hasan',
    name: 'Hasan Kendirci',
    role: 'Regional Director of Talent Acquisitions (Houston)',
    department: 'Talent Acquisition & Staffing',
    campus: 'SST Houston Regional Office',
    region: 'Houston Area',
    email: 'hkendirci@ssttx.org',
    avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=120&auto=format&fit=crop&q=80',
    canReviewStages: [],
    isNotificationOnly: true,
    notificationRoleType: 'talent_acquisition',
    signerId: 'SST-NOTIF-HASAN',
    ipAddress: '108.65.54.122'
  },
  {
    id: 'p-ali',
    name: 'Ali Dalm',
    role: 'Regional Director of Talent Acquisitions (SA & CC)',
    department: 'Talent Acquisition & Staffing',
    campus: 'SST Central Office (District Administration)',
    region: 'San Antonio & Corpus Christi',
    email: 'adal@ssttx.org',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=120&auto=format&fit=crop&q=80',
    canReviewStages: [],
    isNotificationOnly: true,
    notificationRoleType: 'talent_acquisition',
    signerId: 'SST-NOTIF-ALI',
    ipAddress: '208.184.164.242'
  }
];

export const MOCK_EMPLOYEES: Employee[] = [
  {
    id: 'EMP-SST-001',
    firstName: 'Cathy',
    lastName: 'Velasco',
    adpId: 'JMJRMGNGA',
    associateId: 'JMJRMGNGA',
    email: 'cvelasco@ssttx.org',
    title: 'MEDICAL ASSISTANT',
    location: 'Houston',
    campus: 'SST Champions Elementary',
    status: 'Full-time',
    currentSalary: 42000,
    hireDate: '2026-09-15',
    supervisorName: 'Vanessa Nguyen',
    dpsSid: '14018522'
  },
  {
    id: 'EMP-SST-002',
    firstName: 'Marcus',
    lastName: 'Holloway',
    adpId: 'MKH88219A',
    associateId: 'MKH88219A',
    email: 'mholloway@ssttx.org',
    title: 'HIGH SCHOOL SCIENCE TEACHER (AP Physics)',
    location: 'Houston',
    campus: 'SST Champions College Prep High School',
    status: 'Full-time',
    currentSalary: 58500,
    hireDate: '2022-08-10',
    supervisorName: 'Dr. Tariq Al-Mansoor',
    dpsSid: '13928174'
  },
  {
    id: 'EMP-SST-003',
    firstName: 'Elena',
    lastName: 'Garza',
    adpId: 'ELG49102B',
    associateId: 'ELG49102B',
    email: 'egarza@ssttx.org',
    title: 'ELEMENTARY STEM INSTRUCTOR',
    location: 'Houston',
    campus: 'SST Champions Elementary',
    status: 'Full-time',
    currentSalary: 54000,
    hireDate: '2023-08-01',
    supervisorName: 'Vanessa Nguyen',
    dpsSid: '14102948'
  },
  {
    id: 'EMP-SST-004',
    firstName: 'Daniel',
    lastName: 'Kovacs',
    adpId: 'DKV39108C',
    associateId: 'DKV39108C',
    email: 'dkovacs@ssttx.org',
    title: 'MIDDLE SCHOOL MATH TEACHER',
    location: 'San Antonio',
    campus: 'SST San Antonio College Prep High School',
    status: 'Full-time',
    currentSalary: 56000,
    hireDate: '2021-08-15',
    supervisorName: 'Sarah Jenkins',
    dpsSid: '12948190'
  },
  {
    id: 'EMP-SST-005',
    firstName: 'Aaliyah',
    lastName: 'Brooks',
    adpId: 'ABR91048D',
    associateId: 'ABR91048D',
    email: 'abrooks@ssttx.org',
    title: 'SPECIAL EDUCATION INSTRUCTOR',
    location: 'Corpus Christi',
    campus: 'SST Corpus Christi College Prep High School',
    status: 'Full-time',
    currentSalary: 55500,
    hireDate: '2022-01-10',
    supervisorName: 'Robert Vance',
    dpsSid: '13840293'
  }
];

export function buildSstRouting(
  actionType: ActionType,
  isVoluntary?: boolean,
  location?: SchoolLocation,
  config: WorkflowConfig = DEFAULT_WORKFLOW_CONFIG
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
    if (stageSetting && !stageSetting.isEnabled) {
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
    const matchedApprover = config.approvers.find(a => a.id === rule.assignedApproverId)
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

export const INITIAL_PAR_DATA: PersonnelActionRequest[] = [
  // Sample 1: Cathy Velasco - INVOLUNTARY Termination -> Approved by Dr. Kevin Demirci (Chief People Officer)
  {
    id: 'par-sst-001',
    trackingNumber: 'PAR-2026-RQdkD7OW',
    gtpuid: '2e165f1b-8f94-438e-ad99-a57b2ac2e310-554d790d-b7bd-4703-803b-ae58bccf3c3c',
    actionType: 'termination',
    priority: 'urgent',
    currentStage: 'payroll_action',
    effectiveDate: '2026-09-15',

    employeeId: 'JMJRMGNGA',
    firstName: 'Cathy',
    lastName: 'Velasco',
    title: 'MEDICAL ASSISTANT',
    location: 'Houston',
    campus: 'SST Champions Elementary',
    employmentStatus: 'Full-time',
    workEmail: 'cvelasco@ssttx.org',
    associateId: 'JMJRMGNGA',
    dpsSid: '14018522',
    currentSalary: 42000,

    isVoluntary: false, // Involuntary termination -> Dr. Kevin Demirci (CPO)
    isSchoolYearNonRenewal: false,
    lastDayWorked: '2026-09-15',
    reasonForTermination: 'Ms. Velasco was set to start on 9/15 and did not show up to work and did not communicate with us after 9/15.',
    terminationCode: 'A = Job Abandonment',
    allPtoEnteredInAdp: true,
    returnedCharterProperty: true,
    hasWrittenStatements: false,
    outstandingStipendsOwed: false,
    finalPayCheckComment: 'Immediate final pay calculation required per charter school policy for involuntary termination.',

    markRehireStatus: false,
    notifySis: false,
    immediatePayoutRequired: false,
    isPartTimeOrSub: false,
    startDate: '2026-09-15',
    endDate: '2026-09-15',
    totalWorkingDays: 0,
    totalUtoDays: 0,
    totalWorkedDays: 0,
    totalCompensatedDays: 0,
    ptoBalance: 0,
    totalPtoDays: 0,
    totalPtoDaysEarned: 0,
    totalPtoDaysUnearned: 0,

    earnedWages: 0,
    dailyRate: 161.54,
    unearnedPtoDeduction: 0,
    paidWages: 0,
    deductions: 0,
    leaveBenefitsDeduction: 0,
    finalPay: 0,
    notesForHr: 'No Show',
    notesForBenefits: 'Benefit eligibility terminated effective 09/15/2026. COBRA notification sent.',
    notesForPayroll: 'Zero hours worked. No final wage payout required. Record closeout in ADP.',
    ptoNotes: 'No accumulated PTO balance.',

    submittedBy: 'Vanessa Nguyen',
    submitterEmail: 'vnguyen@ssttx.org',
    submitterRole: 'Principal / Supervisor',
    submittedAt: '2026-09-16T08:30:00Z',
    updatedAt: '2026-09-18T08:00:26Z',

    routingSteps: [
      {
        id: 'step-1',
        stage: 'supervisor_review',
        stageLabel: 'Principal / Supervisor Endorsement',
        assignedRole: 'Principal / Supervisor',
        assignedDepartment: 'Campus Leadership',
        assignedEmail: 'vnguyen@ssttx.org',
        status: 'approved',
        reviewerName: 'Vanessa Nguyen',
        decisionDate: '2026-09-17T11:12:37Z',
        comments: 'Job abandonment confirmed. Ms. Velasco did not report for duty on 9/15 and was unreachable.',
        signerId: '1024226a-f233-42a5-8683-51395806dcc7',
        ipAddress: '12.238.48.90'
      },
      {
        id: 'step-2',
        stage: 'cpo_review',
        stageLabel: 'Chief People Officer Approval (Involuntary)',
        assignedRole: 'Chief People Officer',
        assignedDepartment: 'Central Administration',
        assignedEmail: 'kdemirci@ssttx.org',
        status: 'approved',
        reviewerName: 'Dr. Kevin Demirci',
        decisionDate: '2026-09-17T11:24:08Z',
        comments: 'Involuntary job abandonment separation authorized under SST staffing policy.',
        signerId: '7a374357-998f-4203-8874-8b95cb88898d',
        ipAddress: '208.184.164.228'
      },
      {
        id: 'step-3',
        stage: 'hr_review',
        stageLabel: 'HR Policy, Rehire & PTO Audit',
        assignedRole: 'Director of Human Resources',
        assignedDepartment: 'Human Resources',
        assignedEmail: 'kstewart@ssttx.org',
        status: 'approved',
        reviewerName: 'Kristy Stewart',
        decisionDate: '2026-09-17T16:03:31Z',
        comments: 'Mark Rehire: NO. ADP hours verified. Routed to Benefits.',
        signerId: '8cee36a3-eb8d-4b04-96ec-0fcd6397c6fc',
        ipAddress: '108.65.54.105'
      },
      {
        id: 'step-4',
        stage: 'benefits_review',
        stageLabel: 'Benefits & Leave Sign-Off',
        assignedRole: 'Benefits & Leave Coordinator',
        assignedDepartment: 'Benefits & Total Rewards',
        assignedEmail: 'uvillanueva@ssttx.org',
        status: 'approved',
        reviewerName: 'Ursula Villanueva',
        decisionDate: '2026-09-18T08:00:26Z',
        comments: 'COBRA election packet generated. Benefits terminated effective 09/15/2026.',
        signerId: '0e97e30e-841a-4263-a558-61ffac5f61b3',
        ipAddress: '208.184.164.228'
      },
      {
        id: 'step-5',
        stage: 'payroll_action',
        stageLabel: 'Payroll Final Check & ADP Execution',
        assignedRole: 'Payroll Coordinator',
        assignedDepartment: 'Payroll Department',
        assignedEmail: 'pcomparini@ssttx.org',
        status: 'pending'
      }
    ],

    electronicSignatures: [
      {
        signingParty: 'Supervisor',
        signerName: 'Vanessa Nguyen',
        signerEmail: 'vnguyen@ssttx.org',
        signerId: '1024226a-f233-42a5-8683-51395806dcc7',
        ipAddress: '12.238.48.90',
        timestamp: '2026-09-17 11:12:37 CDT (16:12:37 UTC)',
        status: 'signed'
      },
      {
        signingParty: 'Chief People Officer',
        signerName: 'Dr. Kevin Demirci',
        signerEmail: 'kdemirci@ssttx.org',
        signerId: '7a374357-998f-4203-8874-8b95cb88898d',
        ipAddress: '208.184.164.228',
        timestamp: '2026-09-17 11:24:08 CDT (16:24:08 UTC)',
        status: 'signed'
      },
      {
        signingParty: 'HR',
        signerName: 'Kristy Stewart',
        signerEmail: 'kstewart@ssttx.org',
        signerId: '8cee36a3-eb8d-4b04-96ec-0fcd6397c6fc',
        ipAddress: '108.65.54.105',
        timestamp: '2026-09-17 16:03:31 CDT (21:03:31 UTC)',
        status: 'signed'
      },
      {
        signingParty: 'Benefits',
        signerName: 'Ursula Villanueva',
        signerEmail: 'uvillanueva@ssttx.org',
        signerId: '0e97e30e-841a-4263-a558-61ffac5f61b3',
        ipAddress: '208.184.164.228',
        timestamp: '2026-09-18 08:00:26 CDT (13:00:26 UTC)',
        status: 'signed'
      },
      {
        signingParty: 'Payroll',
        signerName: 'Paola Comparini',
        signerEmail: 'pcomparini@ssttx.org',
        signerId: '4f291ab8-7612-4a01-9871-3312cb889021',
        ipAddress: '208.184.164.228',
        status: 'pending'
      }
    ],

    comments: [
      {
        id: 'comm-1',
        authorName: 'Vanessa Nguyen',
        authorRole: 'Principal / Supervisor',
        authorDepartment: 'Campus Leadership',
        timestamp: '2026-09-16T08:30:00Z',
        message: 'Initiated involuntary termination PAR for Cathy Velasco (Medical Assistant) due to job abandonment on start date 9/15.'
      },
      {
        id: 'comm-2',
        authorName: 'Dr. Kevin Demirci',
        authorRole: 'Chief People Officer',
        authorDepartment: 'Central Administration',
        timestamp: '2026-09-17T11:24:08Z',
        message: 'Chief People Officer approval completed for involuntary separation. Forwarded to HR.'
      },
      {
        id: 'comm-3',
        authorName: 'Kristy Stewart',
        authorRole: 'Director of Human Resources',
        authorDepartment: 'Human Resources',
        timestamp: '2026-09-17T16:03:31Z',
        message: 'HR Audit complete: Not eligible for rehire. Zero PTO compensation. Sent to Benefits.'
      },
      {
        id: 'comm-4',
        authorName: 'Ursula Villanueva',
        authorRole: 'Benefits Coordinator',
        authorDepartment: 'Benefits & Total Rewards',
        timestamp: '2026-09-18T08:00:26Z',
        message: 'Benefits sign-off complete. COBRA notices queued. Forwarded to Payroll for final ADP closeout.'
      }
    ],

    attachments: [
      {
        id: 'att-1',
        name: 'velasco notice of separation.JPG',
        size: '77.5 KB',
        uploadedBy: 'Vanessa Nguyen',
        uploadedAt: '2026-09-16T08:28:00Z',
        fileType: 'image/jpeg'
      }
    ],
    departmentNotifications: getDepartmentNotificationRecipients('Houston', 'SST Champions Elementary')
  },

  // Sample 2: Daniel Kovacs - VOLUNTARY Resignation in SAN ANTONIO -> Routes to Serdar Bulut (Regional Executive Director - SA & CC)
  {
    id: 'par-sst-002',
    trackingNumber: 'PAR-2026-SA9102',
    gtpuid: '5e291b3a-9041-4192-bba1-381920394812-77182930-1102-4829-ba91-381920394812',
    actionType: 'termination',
    priority: 'normal',
    currentStage: 'regional_review', // Currently with Serdar Bulut!
    effectiveDate: '2026-10-15',

    employeeId: 'DKV39108C',
    firstName: 'Daniel',
    lastName: 'Kovacs',
    title: 'MIDDLE SCHOOL MATH TEACHER',
    location: 'San Antonio',
    campus: 'SST San Antonio College Prep High School',
    employmentStatus: 'Full-time',
    workEmail: 'dkovacs@ssttx.org',
    associateId: 'DKV39108C',
    currentSalary: 56000,

    isVoluntary: true, // Voluntary resignation in San Antonio -> Serdar Bulut
    isSchoolYearNonRenewal: false,
    lastDayWorked: '2026-10-15',
    reasonForTermination: 'Relocating out of state due to spouse employment transfer. 30 days written notice provided.',
    terminationCode: 'B = Voluntary Resignation',
    allPtoEnteredInAdp: true,
    returnedCharterProperty: true,
    hasWrittenStatements: true,
    outstandingStipendsOwed: false,
    markRehireStatus: true,

    submittedBy: 'Sarah Jenkins',
    submitterEmail: 'sjenkins@ssttx.org',
    submitterRole: 'Principal / Supervisor',
    submittedAt: '2026-09-18T10:00:00Z',
    updatedAt: '2026-09-19T08:30:00Z',

    routingSteps: [
      {
        id: 'step-v1',
        stage: 'supervisor_review',
        stageLabel: 'Principal / Supervisor Endorsement',
        assignedRole: 'Principal / Supervisor',
        assignedDepartment: 'Campus Leadership',
        assignedEmail: 'sjenkins@ssttx.org',
        status: 'approved',
        reviewerName: 'Sarah Jenkins',
        decisionDate: '2026-09-18T14:30:00Z',
        comments: 'Accepted with appreciation for 5 years of STEM service. Full transition notes delivered.'
      },
      {
        id: 'step-v2',
        stage: 'regional_review',
        stageLabel: 'Regional Exec Director Approval (SA & CC)',
        assignedRole: 'Regional Executive Director (San Antonio & Corpus Christi)',
        assignedDepartment: 'Regional Leadership (SA & CC)',
        assignedEmail: 'sbulut@ssttx.org',
        status: 'pending' // Waiting on Serdar Bulut!
      },
      {
        id: 'step-v3',
        stage: 'hr_review',
        stageLabel: 'HR Policy, Rehire & PTO Audit (SA & CC)',
        assignedRole: 'Regional HR Coordinator (SA & CC)',
        assignedDepartment: 'Human Resources',
        assignedEmail: 'ajohnson@ssttx.org',
        status: 'pending'
      },
      {
        id: 'step-v4',
        stage: 'benefits_review',
        stageLabel: 'Benefits & Leave Sign-Off',
        assignedRole: 'Benefits & Leave Coordinator',
        assignedDepartment: 'Benefits & Total Rewards',
        assignedEmail: 'uvillanueva@ssttx.org',
        status: 'pending'
      },
      {
        id: 'step-v5',
        stage: 'payroll_action',
        stageLabel: 'Payroll Final Check & ADP Execution',
        assignedRole: 'Payroll Coordinator',
        assignedDepartment: 'Payroll Department',
        assignedEmail: 'pcomparini@ssttx.org',
        status: 'pending'
      }
    ],

    electronicSignatures: [
      {
        signingParty: 'Supervisor',
        signerName: 'Sarah Jenkins',
        signerEmail: 'sjenkins@ssttx.org',
        signerId: '7a192841-3810-4820-9921-8841a0294821',
        ipAddress: '12.238.48.98',
        timestamp: '2026-09-18 14:30:00 CDT',
        status: 'signed'
      },
      {
        signingParty: 'Regional Executive Director (SA & CC)',
        signerName: 'Serdar Bulut',
        signerEmail: 'sbulut@ssttx.org',
        signerId: '6c295832-4021-5931-0032-9952b1305932',
        ipAddress: '208.184.164.231',
        status: 'pending'
      },
      {
        signingParty: 'HR',
        signerName: 'Amber Johnson',
        signerEmail: 'ajohnson@ssttx.org',
        signerId: '9bee47b4-fc9e-5c15-07fd-1fde7408d7fd',
        ipAddress: '208.184.164.232',
        status: 'pending'
      },
      {
        signingParty: 'Payroll',
        signerName: 'Paola Comparini',
        signerEmail: 'pcomparini@ssttx.org',
        signerId: '4f291ab8-7612-4a01-9871-3312cb889021',
        ipAddress: '208.184.164.228',
        status: 'pending'
      }
    ],

    comments: [
      {
        id: 'comm-v1',
        authorName: 'Sarah Jenkins',
        authorRole: 'Principal / Supervisor',
        authorDepartment: 'Campus Leadership',
        timestamp: '2026-09-18T10:00:00Z',
        message: 'Submitted voluntary resignation for Daniel Kovacs. Routed to Regional Exec Director Serdar Bulut for San Antonio.'
      }
    ],

    attachments: [
      {
        id: 'att-v1',
        name: 'Daniel_Kovacs_Resignation_Letter.pdf',
        size: '185 KB',
        uploadedBy: 'Sarah Jenkins',
        uploadedAt: '2026-09-18T09:55:00Z',
        fileType: 'application/pdf'
      }
    ],
    departmentNotifications: getDepartmentNotificationRecipients('San Antonio', 'SST Discovery')
  },

  // Sample 3: VOLUNTARY Resignation in HOUSTON -> Routes to Atnan Ekin (Regional Executive Director - Houston)
  {
    id: 'par-sst-003',
    trackingNumber: 'PAR-2026-HT4021',
    gtpuid: '6f392c4b-0152-5203-cca2-492031405923-88293041-2213-5930-cb02-492031405923',
    actionType: 'termination',
    priority: 'normal',
    currentStage: 'regional_review', // Currently with Atnan Ekin!
    effectiveDate: '2026-10-31',

    employeeId: 'ELG49102B',
    firstName: 'Elena',
    lastName: 'Garza',
    title: 'ELEMENTARY STEM INSTRUCTOR',
    location: 'Houston',
    campus: 'SST Champions Elementary',
    employmentStatus: 'Full-time',
    workEmail: 'egarza@ssttx.org',
    associateId: 'ELG49102B',
    currentSalary: 54000,

    isVoluntary: true, // Voluntary resignation in Houston -> Atnan Ekin
    isSchoolYearNonRenewal: false,
    lastDayWorked: '2026-10-31',
    reasonForTermination: 'Accepted external graduate school fellowship. 6 weeks notice provided with full curriculum handover.',
    terminationCode: 'B = Voluntary Resignation',
    allPtoEnteredInAdp: true,
    returnedCharterProperty: true,
    hasWrittenStatements: true,
    outstandingStipendsOwed: false,
    markRehireStatus: true,

    submittedBy: 'Vanessa Nguyen',
    submitterEmail: 'vnguyen@ssttx.org',
    submitterRole: 'Principal / Supervisor',
    submittedAt: '2026-09-19T09:00:00Z',
    updatedAt: '2026-09-19T10:15:00Z',

    routingSteps: [
      {
        id: 'step-h1',
        stage: 'supervisor_review',
        stageLabel: 'Principal / Supervisor Endorsement',
        assignedRole: 'Principal / Supervisor',
        assignedDepartment: 'Campus Leadership',
        assignedEmail: 'vnguyen@ssttx.org',
        status: 'approved',
        reviewerName: 'Vanessa Nguyen',
        decisionDate: '2026-09-19T10:15:00Z',
        comments: 'Endorsed. Handover plan coordinated for elementary robotics.'
      },
      {
        id: 'step-h2',
        stage: 'regional_review',
        stageLabel: 'Regional Exec Director Approval (Houston)',
        assignedRole: 'Regional Executive Director (Houston)',
        assignedDepartment: 'Houston Regional Leadership',
        assignedEmail: 'aekin@ssttx.org',
        status: 'pending' // Waiting on Atnan Ekin!
      },
      {
        id: 'step-h3',
        stage: 'hr_review',
        stageLabel: 'HR Policy, Rehire & PTO Audit',
        assignedRole: 'Director of Human Resources',
        assignedDepartment: 'Human Resources',
        assignedEmail: 'kstewart@ssttx.org',
        status: 'pending'
      },
      {
        id: 'step-h4',
        stage: 'benefits_review',
        stageLabel: 'Benefits & Leave Sign-Off',
        assignedRole: 'Benefits & Leave Coordinator',
        assignedDepartment: 'Benefits & Total Rewards',
        assignedEmail: 'uvillanueva@ssttx.org',
        status: 'pending'
      },
      {
        id: 'step-h5',
        stage: 'payroll_action',
        stageLabel: 'Payroll Final Check & ADP Execution',
        assignedRole: 'Payroll Coordinator',
        assignedDepartment: 'Payroll Department',
        assignedEmail: 'pcomparini@ssttx.org',
        status: 'pending'
      }
    ],

    electronicSignatures: [
      {
        signingParty: 'Supervisor',
        signerName: 'Vanessa Nguyen',
        signerEmail: 'vnguyen@ssttx.org',
        signerId: '1024226a-f233-42a5-8683-51395806dcc7',
        ipAddress: '12.238.48.90',
        timestamp: '2026-09-19 10:15:00 CDT',
        status: 'signed'
      },
      {
        signingParty: 'Regional Executive Director (Houston)',
        signerName: 'Atnan Ekin',
        signerEmail: 'aekin@ssttx.org',
        signerId: '5b194821-3910-4820-9921-8841a0294821',
        ipAddress: '208.184.164.230',
        status: 'pending'
      },
      {
        signingParty: 'HR',
        signerName: 'Kristy Stewart',
        signerEmail: 'kstewart@ssttx.org',
        signerId: '8cee36a3-eb8d-4b04-96ec-0fcd6397c6fc',
        ipAddress: '108.65.54.105',
        status: 'pending'
      },
      {
        signingParty: 'Payroll',
        signerName: 'Paola Comparini',
        signerEmail: 'pcomparini@ssttx.org',
        signerId: '4f291ab8-7612-4a01-9871-3312cb889021',
        ipAddress: '208.184.164.228',
        status: 'pending'
      }
    ],

    comments: [
      {
        id: 'comm-h1',
        authorName: 'Vanessa Nguyen',
        authorRole: 'Principal / Supervisor',
        authorDepartment: 'Campus Leadership',
        timestamp: '2026-09-19T09:00:00Z',
        message: 'Submitted voluntary resignation for Elena Garza. Forwarded to Houston Regional Executive Director Atnan Ekin.'
      }
    ],

    attachments: [],
    departmentNotifications: getDepartmentNotificationRecipients('Houston', 'SST Champions Elementary')
  },

  // Sample 4: AP Physics Teacher Incentive Stipend -> Dr. Kevin Demirci (Chief People Officer)
  {
    id: 'par-sst-004',
    trackingNumber: 'PAR-2026-ST8830',
    gtpuid: '4a296d3d-8b02-558f-ce20-b79c4bd4f522-775f902f-d9df-6925-025d-cf70def5e5e5',
    actionType: 'salary_change',
    priority: 'normal',
    currentStage: 'hr_review',
    effectiveDate: '2026-10-01',

    employeeId: 'MKH88219A',
    firstName: 'Marcus',
    lastName: 'Holloway',
    title: 'HIGH SCHOOL SCIENCE TEACHER (AP Physics)',
    location: 'Houston',
    campus: 'SST Champions College Prep High School',
    employmentStatus: 'Full-time',
    workEmail: 'mholloway@ssttx.org',
    associateId: 'MKH88219A',
    currentSalary: 58500,

    proposedSalary: 63500,
    stipendAmount: 5000,
    percentIncrease: 8.55,
    salaryChangeReason: 'AP Physics & Dual-Credit STEM Stipend',
    notesRelatingToPositionChange: 'Addition of \$5,000 annual AP Physics teacher incentive stipend per 2026-2027 board approved teacher retention schedule.',

    submittedBy: 'Dr. Tariq Al-Mansoor',
    submitterEmail: 'talmansoor@ssttx.org',
    submitterRole: 'High School Principal',
    submittedAt: '2026-09-15T10:00:00Z',
    updatedAt: '2026-09-18T15:20:00Z',

    routingSteps: [
      {
        id: 'step-s1',
        stage: 'supervisor_review',
        stageLabel: 'Principal / Supervisor Endorsement',
        assignedRole: 'Principal / Supervisor',
        assignedDepartment: 'Campus Leadership',
        assignedEmail: 'talmansoor@ssttx.org',
        status: 'approved',
        reviewerName: 'Dr. Tariq Al-Mansoor',
        decisionDate: '2026-09-16T08:30:00Z',
        comments: 'Mr. Holloway completed AP College Board certification.'
      },
      {
        id: 'step-s2',
        stage: 'cpo_review',
        stageLabel: 'Chief People Officer Approval',
        assignedRole: 'Chief People Officer',
        assignedDepartment: 'Central Administration',
        assignedEmail: 'kdemirci@ssttx.org',
        status: 'approved',
        reviewerName: 'Dr. Kevin Demirci',
        decisionDate: '2026-09-18T15:20:00Z',
        comments: 'Stipend approved under Charter STEM Grant allocations.'
      },
      {
        id: 'step-s3',
        stage: 'hr_review',
        stageLabel: 'HR Policy, Contract & Title Banding',
        assignedRole: 'Director of Human Resources',
        assignedDepartment: 'Human Resources',
        assignedEmail: 'kstewart@ssttx.org',
        status: 'pending'
      },
      {
        id: 'step-s4',
        stage: 'payroll_action',
        stageLabel: 'Payroll Final Check & ADP Execution',
        assignedRole: 'Payroll Coordinator',
        assignedDepartment: 'Payroll Department',
        assignedEmail: 'pcomparini@ssttx.org',
        status: 'pending'
      }
    ],

    electronicSignatures: [
      {
        signingParty: 'Supervisor',
        signerName: 'Dr. Tariq Al-Mansoor',
        signerEmail: 'talmansoor@ssttx.org',
        signerId: '9840217a-e421-4821-b841-8401928374a1',
        ipAddress: '12.238.48.95',
        timestamp: '2026-09-16 08:30:00 CDT',
        status: 'signed'
      },
      {
        signingParty: 'Chief People Officer',
        signerName: 'Dr. Kevin Demirci',
        signerEmail: 'kdemirci@ssttx.org',
        signerId: '7a374357-998f-4203-8874-8b95cb88898d',
        ipAddress: '208.184.164.228',
        timestamp: '2026-09-18 15:20:00 CDT',
        status: 'signed'
      },
      {
        signingParty: 'HR',
        signerName: 'Kristy Stewart',
        signerEmail: 'kstewart@ssttx.org',
        signerId: '8cee36a3-eb8d-4b04-96ec-0fcd6397c6fc',
        ipAddress: '108.65.54.105',
        status: 'pending'
      },
      {
        signingParty: 'Payroll',
        signerName: 'Paola Comparini',
        signerEmail: 'pcomparini@ssttx.org',
        signerId: '4f291ab8-7612-4a01-9871-3312cb889021',
        ipAddress: '208.184.164.228',
        status: 'pending'
      }
    ],

    comments: [
      {
        id: 'comm-s1',
        authorName: 'Dr. Tariq Al-Mansoor',
        authorRole: 'High School Principal',
        authorDepartment: 'Campus Leadership',
        timestamp: '2026-09-15T10:00:00Z',
        message: 'Submitted AP Science Teacher stipend adjustment.'
      }
    ],

    attachments: [
      {
        id: 'att-s1',
        name: 'College_Board_AP_Physics_Certification.pdf',
        size: '310 KB',
        uploadedBy: 'Dr. Tariq Al-Mansoor',
        uploadedAt: '2026-09-15T09:50:00Z',
        fileType: 'application/pdf'
      }
    ],
    departmentNotifications: getDepartmentNotificationRecipients('Houston', 'SST Champions College Prep High School')
  }
];
