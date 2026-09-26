/**
 * Sample (fictional) records used only by the test suite. They are not shipped in the
 * portal: the app starts empty and loads real staff from ADP.
 */
import { PersonnelActionRequest, Employee } from '../../types/par';
import { CpoPayoutRequest } from '../../types/payout';
import { AdpWorker } from '../../types/adp';
import { getDepartmentNotificationRecipients } from '../../utils/formatters';

export const SAMPLE_EMPLOYEES: Employee[] = [
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

export const SAMPLE_PARS: PersonnelActionRequest[] = [
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

export const SAMPLE_PAYOUTS: CpoPayoutRequest[] = [
  {
    id: 'payout-2026-001',
    trackingNumber: 'SST-PAY-2026-001',
    payoutType: 'payment',
    employeeId: 'emp-marcus-vance',
    employeeName: 'Marcus Vance',
    adpId: 'ADP-SST-88421',
    campus: 'SST Champions Elementary',
    region: 'Houston Area',
    jobTitle: 'Lead Science Teacher (Grade 5)',
    currentSalary: 58500,
    amount: 1850.00,
    category: 'Retroactive Pay / Salary Adjustment',
    reason: 'Retroactive master educator stipend for completing Texas Science Leadership Certification (approved for Fall 2026 cycle). Staff member provided transcript verification on 09/15/2026.',
    payrollCutoffDate: '2026-09-29',
    payrollCycleName: 'Period 5: 09/14/2026 – 09/27/2026 (Corrections Due: 09/29/2026 | Pay Date: 10/15/2026)',
    isUrgentCutoff: true,
    supportingDocs: [
      {
        id: 'doc-mv-cert',
        name: 'Marcus_Vance_Certification_Audit.pdf',
        size: '248 KB',
        fileType: 'application/pdf',
        uploadedAt: '2026-09-18T10:14:00Z',
        uploadedBy: 'Kristy Stewart (Regional HR Coordinator)'
      },
      {
        id: 'doc-mv-stipend-approval',
        name: 'Principal_Stipend_Endorsement_Form.pdf',
        size: '185 KB',
        fileType: 'application/pdf',
        uploadedAt: '2026-09-18T10:15:30Z',
        uploadedBy: 'Kristy Stewart (Regional HR Coordinator)'
      }
    ],
    submittedBy: 'Kristy Stewart',
    submitterEmail: 'kstewart@ssttx.org',
    submitterRole: 'Regional HR Coordinator (Houston Area Campuses)',
    submittedAt: '2026-09-18T10:18:00Z',
    status: 'pending_cpo',
    history: [
      {
        id: 'hist-1',
        action: 'Request Submitted by Regional HR',
        actor: 'Kristy Stewart (Houston HR)',
        timestamp: '2026-09-18T10:18:00Z',
        notes: 'Submitted for CPO review ahead of Sept 29 ADP corrections cut-off.'
      }
    ]
  },
  {
    id: 'payout-2026-002',
    trackingNumber: 'SST-DED-2026-002',
    payoutType: 'deduction',
    employeeId: 'emp-elena-rostova',
    employeeName: 'Elena Rostova',
    adpId: 'ADP-SST-73192',
    campus: 'SST Discovery',
    region: 'San Antonio Area',
    jobTitle: '5th Grade Bilingual Educator',
    currentSalary: 55200,
    amount: 420.00,
    category: 'Unearned PTO Days Recoupment',
    reason: 'Employee took 3 unearned personal days in August pay cycle prior to accrual vesting. Mutually agreed to deduct across two semi-monthly cycles ($210 x 2). This request represents installment 1 of 2.',
    payrollCutoffDate: '2026-09-29',
    payrollCycleName: 'Period 5: 09/14/2026 – 09/27/2026 (Corrections Due: 09/29/2026 | Pay Date: 10/15/2026)',
    isUrgentCutoff: true,
    supportingDocs: [
      {
        id: 'doc-er-deduction-auth',
        name: 'Signed_Payroll_Deduction_Agreement.pdf',
        size: '312 KB',
        fileType: 'application/pdf',
        uploadedAt: '2026-09-19T14:20:00Z',
        uploadedBy: 'Amber Johnson (Regional HR Coordinator)'
      }
    ],
    submittedBy: 'Amber Johnson',
    submitterEmail: 'ajohnson@ssttx.org',
    submitterRole: 'Regional HR Coordinator (San Antonio & Corpus Christi)',
    submittedAt: '2026-09-19T14:22:00Z',
    status: 'pending_cpo',
    history: [
      {
        id: 'hist-2',
        action: 'Deduction Request Submitted',
        actor: 'Amber Johnson (SA/CC HR)',
        timestamp: '2026-09-19T14:22:00Z',
        notes: 'Employee signed voluntary payroll adjustment authorization.'
      }
    ]
  },
  {
    id: 'payout-2026-003',
    trackingNumber: 'SST-PAY-2026-003',
    payoutType: 'payment',
    employeeId: 'emp-david-chen',
    employeeName: 'David Chen',
    adpId: 'ADP-SST-62104',
    campus: 'SST Corpus Christi College Prep High School',
    region: 'Corpus Christi Area',
    jobTitle: 'Robotics & Computer Science Teacher',
    currentSalary: 62000,
    amount: 750.00,
    category: 'Extra Duty & Tutoring Stipend',
    reason: 'Regional Robotics League tournament weekend coaching and student mentoring stipend approved per charter extracurricular schedule.',
    payrollCutoffDate: '2026-09-29',
    payrollCycleName: 'Period 5: 09/14/2026 – 09/27/2026 (Corrections Due: 09/29/2026 | Pay Date: 10/15/2026)',
    supportingDocs: [
      {
        id: 'doc-dc-log',
        name: 'Robotics_Tournament_Duty_Log.xlsx',
        size: '89 KB',
        fileType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        uploadedAt: '2026-09-16T11:00:00Z',
        uploadedBy: 'Amber Johnson (Regional HR Coordinator)'
      }
    ],
    submittedBy: 'Amber Johnson',
    submitterEmail: 'ajohnson@ssttx.org',
    submitterRole: 'Regional HR Coordinator (San Antonio & Corpus Christi)',
    submittedAt: '2026-09-16T11:05:00Z',
    status: 'approved_by_cpo',
    cpoDecisionDate: '2026-09-17T09:30:00Z',
    cpoDecisionNotes: 'Approved for Sept 29 ADP payroll execution. Extra duty verified with campus leadership.',
    cpoSignerName: 'Dr. Kevin Demirci',
    cpoSignerId: 'CPO-SST-DEMIRCI-2026',
    cpoIpAddress: '192.168.1.100',
    history: [
      {
        id: 'hist-3a',
        action: 'Request Submitted by Regional HR',
        actor: 'Amber Johnson (SA/CC HR)',
        timestamp: '2026-09-16T11:05:00Z'
      },
      {
        id: 'hist-3b',
        action: 'Approved by Chief People Officer',
        actor: 'Dr. Kevin Demirci (CPO)',
        timestamp: '2026-09-17T09:30:00Z',
        notes: 'Digitally authorized and routed to Paola Comparini (Payroll).'
      }
    ]
  },
  {
    id: 'payout-2026-004',
    trackingNumber: 'SST-PAY-2026-004',
    payoutType: 'payment',
    employeeId: 'emp-sarah-jenkins',
    employeeName: 'Sarah Jenkins',
    adpId: 'ADP-SST-51902',
    campus: 'SST Spring',
    region: 'Houston Area',
    jobTitle: 'Special Education Coordinator',
    currentSalary: 64500,
    amount: 1200.00,
    category: 'Mileage & Travel Expense Reimbursement',
    reason: 'Multi-campus regional ARD committee facilitation travel and mileage reimbursement across Houston campuses (June-August 2026).',
    payrollCutoffDate: '2026-09-01',
    payrollCycleName: 'Period 3: 08/17/2026 – 08/30/2026 (Corrections Due: 09/01/2026 | Pay Date: 09/15/2026)',
    supportingDocs: [
      {
        id: 'doc-sj-mileage',
        name: 'Mileage_Log_and_Expense_Receipts.pdf',
        size: '1.4 MB',
        fileType: 'application/pdf',
        uploadedAt: '2026-09-05T08:30:00Z',
        uploadedBy: 'Kristy Stewart (Regional HR Coordinator)'
      }
    ],
    submittedBy: 'Kristy Stewart',
    submitterEmail: 'kstewart@ssttx.org',
    submitterRole: 'Regional HR Coordinator (Houston Area Campuses)',
    submittedAt: '2026-09-05T08:35:00Z',
    status: 'processed_payroll',
    cpoDecisionDate: '2026-09-06T15:10:00Z',
    cpoDecisionNotes: 'Approved travel reimbursement.',
    cpoSignerName: 'Dr. Kevin Demirci',
    cpoSignerId: 'CPO-SST-DEMIRCI-2026',
    cpoIpAddress: '192.168.1.100',
    payrollProcessedAt: '2026-09-09T16:45:00Z',
    payrollProcessedBy: 'Paola Comparini (Payroll Coordinator)',
    adpBatchNumber: 'ADP-BATCH-SEP15-2026',
    payrollNotes: 'Direct deposited on Tuesday, September 15, 2026 pay date.',
    history: [
      {
        id: 'hist-4a',
        action: 'Request Submitted by Regional HR',
        actor: 'Kristy Stewart (Houston HR)',
        timestamp: '2026-09-05T08:35:00Z'
      },
      {
        id: 'hist-4b',
        action: 'Approved by Chief People Officer',
        actor: 'Dr. Kevin Demirci (CPO)',
        timestamp: '2026-09-06T15:10:00Z'
      },
      {
        id: 'hist-4c',
        action: 'Executed in ADP Payroll',
        actor: 'Paola Comparini (Payroll)',
        timestamp: '2026-09-09T16:45:00Z',
        notes: 'Included in ADP Batch #ADP-BATCH-SEP15-2026.'
      }
    ]
  }
];

export const SAMPLE_ADP_ROSTER: AdpWorker[] = [
  // 1. Cathy Velasco (Involuntary Separation PAR in progress)
  {
    id: 'ADP-WFN-001',
    adpId: 'JMJRMGNGA',
    associateId: 'JMJRMGNGA',
    positionId: 'POS-CHAMP-MED-01',
    firstName: 'Cathy',
    lastName: 'Velasco',
    fullName: 'Cathy Velasco',
    workEmail: 'cvelasco@ssttx.org',
    phone: '(832) 555-0144',
    jobTitle: 'MEDICAL ASSISTANT',
    department: 'Health & Student Services',
    campus: 'SST Champions Elementary',
    location: 'Houston',
    employmentStatus: 'Pending Termination',
    hireDate: '2026-09-15',
    lastDayWorked: '2026-09-15',
    terminationReason: 'Job Abandonment (Did not report for duty)',
    adpTerminationCode: 'TER_JOB_ABANDON',
    eligibleForRehire: 'No',
    annualSalary: 42000,
    payFrequency: 'Semi-Monthly',
    supervisorName: 'Vanessa Nguyen',
    dpsSid: '14018522',
    trsMember: true,
    contractType: 'At-Will',
    adpSyncTimestamp: '2026-09-24T18:00:00Z',
    linkedParId: 'par-sst-001',
    linkedParTracking: 'PAR-2026-RQdkD7OW',
    alignmentStatus: 'pending_adp_closeout'
  },

  // 2. Marcus Holloway (Voluntary Resignation - Completed & Executed in ADP)
  {
    id: 'ADP-WFN-002',
    adpId: 'MKH88219A',
    associateId: 'MKH88219A',
    positionId: 'POS-CHAMP-SCI-01',
    firstName: 'Marcus',
    lastName: 'Holloway',
    fullName: 'Marcus Holloway',
    workEmail: 'mholloway@ssttx.org',
    phone: '(832) 555-0182',
    jobTitle: 'HIGH SCHOOL SCIENCE TEACHER (AP Physics)',
    department: 'Secondary STEM Instruction',
    campus: 'SST Champions College Prep High School',
    location: 'Houston',
    employmentStatus: 'Terminated',
    hireDate: '2022-08-10',
    terminationDate: '2026-08-30',
    lastDayWorked: '2026-08-30',
    terminationReason: 'Voluntary Resignation (Relocating Out of State)',
    adpTerminationCode: 'TER_VOL_RELOC',
    eligibleForRehire: 'Yes',
    annualSalary: 58500,
    payFrequency: 'Semi-Monthly',
    supervisorName: 'Dr. Tariq Al-Mansoor',
    dpsSid: '13928174',
    trsMember: true,
    contractType: 'At-Will',
    adpBatchNumber: 'ADP-2026-B849',
    adpSyncTimestamp: '2026-09-24T18:00:00Z',
    linkedParId: 'par-sst-002',
    linkedParTracking: 'PAR-2026-N966F0kS',
    alignmentStatus: 'aligned'
  },

  // 3. Elena Garza (Voluntary Resignation - Completed in ADP)
  {
    id: 'ADP-WFN-003',
    adpId: 'ELG49102B',
    associateId: 'ELG49102B',
    positionId: 'POS-CHAMP-STEM-03',
    firstName: 'Elena',
    lastName: 'Garza',
    fullName: 'Elena Garza',
    workEmail: 'egarza@ssttx.org',
    phone: '(832) 555-0199',
    jobTitle: 'ELEMENTARY STEM INSTRUCTOR',
    department: 'Elementary Instruction',
    campus: 'SST Champions Elementary',
    location: 'Houston',
    employmentStatus: 'Terminated',
    hireDate: '2023-08-01',
    terminationDate: '2026-08-31',
    lastDayWorked: '2026-08-31',
    terminationReason: 'Voluntary Resignation (Accepted Higher Ed Position)',
    adpTerminationCode: 'TER_VOL_NEW_POSITION',
    eligibleForRehire: 'Yes',
    annualSalary: 54000,
    payFrequency: 'Semi-Monthly',
    supervisorName: 'Vanessa Nguyen',
    dpsSid: '14102948',
    trsMember: true,
    contractType: 'At-Will',
    adpBatchNumber: 'ADP-2026-B850',
    adpSyncTimestamp: '2026-09-24T18:00:00Z',
    linkedParId: 'par-sst-003',
    linkedParTracking: 'PAR-2026-G82098D7',
    alignmentStatus: 'aligned'
  },

  // 4. Daniel Kovacs (Voluntary Resignation - Benefits Review stage)
  {
    id: 'ADP-WFN-004',
    adpId: 'DKV39108C',
    associateId: 'DKV39108C',
    positionId: 'POS-SA-MATH-02',
    firstName: 'Daniel',
    lastName: 'Kovacs',
    fullName: 'Daniel Kovacs',
    workEmail: 'dkovacs@ssttx.org',
    phone: '(210) 555-0112',
    jobTitle: 'MIDDLE SCHOOL MATH TEACHER',
    department: 'Mathematics',
    campus: 'SST San Antonio College Prep High School',
    location: 'San Antonio',
    employmentStatus: 'Active',
    hireDate: '2021-08-15',
    lastDayWorked: '2026-10-01',
    terminationReason: 'Voluntary Resignation (Personal / Graduate Studies)',
    adpTerminationCode: 'TER_VOL_RESIGN',
    eligibleForRehire: 'Yes',
    annualSalary: 56000,
    payFrequency: 'Semi-Monthly',
    supervisorName: 'Sarah Jenkins',
    dpsSid: '12948190',
    trsMember: true,
    contractType: 'At-Will',
    adpSyncTimestamp: '2026-09-24T18:00:00Z',
    linkedParId: 'par-sst-004',
    linkedParTracking: 'PAR-2026-M49102KD',
    alignmentStatus: 'par_in_progress'
  },

  // 5. Aaliyah Brooks (Voluntary Resignation - Supervisor review)
  {
    id: 'ADP-WFN-005',
    adpId: 'ABR91048D',
    associateId: 'ABR91048D',
    positionId: 'POS-CC-SPED-01',
    firstName: 'Aaliyah',
    lastName: 'Brooks',
    fullName: 'Aaliyah Brooks',
    workEmail: 'abrooks@ssttx.org',
    phone: '(361) 555-0177',
    jobTitle: 'SPECIAL EDUCATION INSTRUCTOR',
    department: 'Special Education Services',
    campus: 'SST Corpus Christi College Prep High School',
    location: 'Corpus Christi',
    employmentStatus: 'Active',
    hireDate: '2022-01-10',
    lastDayWorked: '2026-10-15',
    terminationReason: 'Voluntary Resignation (Relocating to Austin)',
    adpTerminationCode: 'TER_VOL_RELOC',
    eligibleForRehire: 'Yes',
    annualSalary: 55500,
    payFrequency: 'Semi-Monthly',
    supervisorName: 'Robert Vance',
    dpsSid: '13840293',
    trsMember: true,
    contractType: 'At-Will',
    adpSyncTimestamp: '2026-09-24T18:00:00Z',
    linkedParId: 'par-sst-005',
    linkedParTracking: 'PAR-2026-B81940AL',
    alignmentStatus: 'par_in_progress'
  },

  // 6. Marcus Vance (Active Teacher - Recipient of Certification Stipend)
  {
    id: 'ADP-WFN-006',
    adpId: 'ADP-SST-88421',
    associateId: 'ADP-SST-88421',
    positionId: 'POS-CHAMP-SCI-05',
    firstName: 'Marcus',
    lastName: 'Vance',
    fullName: 'Marcus Vance',
    workEmail: 'mvance@ssttx.org',
    phone: '(832) 555-0131',
    jobTitle: 'Lead Science Teacher (Grade 5)',
    department: 'Elementary Instruction',
    campus: 'SST Champions Elementary',
    location: 'Houston',
    employmentStatus: 'Active',
    hireDate: '2020-08-12',
    annualSalary: 58500,
    payFrequency: 'Semi-Monthly',
    supervisorName: 'Vanessa Nguyen',
    dpsSid: '14298104',
    trsMember: true,
    contractType: 'At-Will',
    adpSyncTimestamp: '2026-09-24T18:00:00Z',
    alignmentStatus: 'aligned'
  },

  // 7. Elena Rostova (Active Educator - PTO Deduction Payout)
  {
    id: 'ADP-WFN-007',
    adpId: 'ADP-SST-73192',
    associateId: 'ADP-SST-73192',
    positionId: 'POS-DISC-BIL-02',
    firstName: 'Elena',
    lastName: 'Rostova',
    fullName: 'Elena Rostova',
    workEmail: 'erostova@ssttx.org',
    phone: '(210) 555-0155',
    jobTitle: '5th Grade Bilingual Educator',
    department: 'Bilingual / ESL Instruction',
    campus: 'SST Discovery',
    location: 'San Antonio',
    employmentStatus: 'Active',
    hireDate: '2021-08-10',
    annualSalary: 55200,
    payFrequency: 'Semi-Monthly',
    supervisorName: 'Serdar Bulut',
    dpsSid: '13719284',
    trsMember: true,
    contractType: 'At-Will',
    adpSyncTimestamp: '2026-09-24T18:00:00Z',
    alignmentStatus: 'aligned'
  },

  // 8. David Chen (Active Teacher - Robotics League Coach)
  {
    id: 'ADP-WFN-008',
    adpId: 'ADP-SST-62104',
    associateId: 'ADP-SST-62104',
    positionId: 'POS-CC-CS-01',
    firstName: 'David',
    lastName: 'Chen',
    fullName: 'David Chen',
    workEmail: 'dchen@ssttx.org',
    phone: '(361) 555-0190',
    jobTitle: 'Robotics & Computer Science Teacher',
    department: 'CTE & Computer Science',
    campus: 'SST Corpus Christi College Prep High School',
    location: 'Corpus Christi',
    employmentStatus: 'Active',
    hireDate: '2022-08-15',
    annualSalary: 62000,
    payFrequency: 'Semi-Monthly',
    supervisorName: 'Robert Vance',
    dpsSid: '14820194',
    trsMember: true,
    contractType: 'At-Will',
    adpSyncTimestamp: '2026-09-24T18:00:00Z',
    alignmentStatus: 'aligned'
  },

  // 9. Sarah Jenkins (Active Special Education Coordinator)
  {
    id: 'ADP-WFN-009',
    adpId: 'ADP-SST-51902',
    associateId: 'ADP-SST-51902',
    positionId: 'POS-SPR-SPED-01',
    firstName: 'Sarah',
    lastName: 'Jenkins',
    fullName: 'Sarah Jenkins',
    workEmail: 'sjenkins@ssttx.org',
    phone: '(832) 555-0149',
    jobTitle: 'Special Education Coordinator',
    department: 'Special Education Services',
    campus: 'SST Spring',
    location: 'Houston',
    employmentStatus: 'Active',
    hireDate: '2019-08-01',
    annualSalary: 64500,
    payFrequency: 'Semi-Monthly',
    supervisorName: 'Atnan Ekin',
    dpsSid: '13902914',
    trsMember: true,
    contractType: 'At-Will',
    adpSyncTimestamp: '2026-09-24T18:00:00Z',
    alignmentStatus: 'aligned'
  },

  // 10. Carlos Morales (Active Campus Counselor)
  {
    id: 'ADP-WFN-010',
    adpId: 'CLM92014E',
    associateId: 'CLM92014E',
    positionId: 'POS-ALAMO-CNS-01',
    firstName: 'Carlos',
    lastName: 'Morales',
    fullName: 'Carlos Morales',
    workEmail: 'cmorales@ssttx.org',
    phone: '(210) 555-0163',
    jobTitle: 'Lead Academic & College Counselor',
    department: 'Counseling & Guidance',
    campus: 'SST Alamo',
    location: 'San Antonio',
    employmentStatus: 'Active',
    hireDate: '2023-01-15',
    annualSalary: 59000,
    payFrequency: 'Semi-Monthly',
    supervisorName: 'Serdar Bulut',
    dpsSid: '14918274',
    trsMember: true,
    contractType: 'At-Will',
    adpSyncTimestamp: '2026-09-24T18:00:00Z',
    alignmentStatus: 'aligned'
  },

  // 11. Priya Patel (Active Assistant Principal)
  {
    id: 'ADP-WFN-011',
    adpId: 'PRP83920F',
    associateId: 'PRP83920F',
    positionId: 'POS-SUG-AP-01',
    firstName: 'Priya',
    lastName: 'Patel',
    fullName: 'Priya Patel',
    workEmail: 'ppatel@ssttx.org',
    phone: '(281) 555-0128',
    jobTitle: 'Assistant Principal of Academics',
    department: 'Campus Leadership',
    campus: 'SST Sugar Land',
    location: 'Houston',
    employmentStatus: 'Active',
    hireDate: '2020-07-01',
    annualSalary: 74000,
    payFrequency: 'Semi-Monthly',
    supervisorName: 'Atnan Ekin',
    dpsSid: '12849102',
    trsMember: true,
    contractType: 'At-Will',
    adpSyncTimestamp: '2026-09-24T18:00:00Z',
    alignmentStatus: 'aligned'
  },

  // 12. Brandon Taylor (Active Campus Registrar)
  {
    id: 'ADP-WFN-012',
    adpId: 'BDT49201G',
    associateId: 'BDT49201G',
    positionId: 'POS-NW-REG-01',
    firstName: 'Brandon',
    lastName: 'Taylor',
    fullName: 'Brandon Taylor',
    workEmail: 'btaylor@ssttx.org',
    phone: '(210) 555-0188',
    jobTitle: 'Campus Registrar & PEIMS Clerk',
    department: 'Campus Administration',
    campus: 'SST Northwest',
    location: 'San Antonio',
    employmentStatus: 'Active',
    hireDate: '2022-09-01',
    annualSalary: 45000,
    payFrequency: 'Semi-Monthly',
    supervisorName: 'Serdar Bulut',
    dpsSid: '13948201',
    trsMember: true,
    contractType: 'At-Will',
    adpSyncTimestamp: '2026-09-24T18:00:00Z',
    alignmentStatus: 'aligned'
  }
];
