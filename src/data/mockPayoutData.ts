import { CpoPayoutRequest, PayrollCutoffCycle } from '../types/payout';

export const SST_PAYROLL_CYCLES: PayrollCutoffCycle[] = [
  {
    id: 'cycle-sep-25-2026',
    cycleName: 'September 2026 (Semi-Monthly Cycle 2)',
    cutoffDate: '2026-09-25',
    payDate: '2026-09-30',
    status: 'active',
    daysRemaining: 5
  },
  {
    id: 'cycle-oct-10-2026',
    cycleName: 'October 2026 (Semi-Monthly Cycle 1)',
    cutoffDate: '2026-10-10',
    payDate: '2026-10-15',
    status: 'upcoming',
    daysRemaining: 20
  },
  {
    id: 'cycle-oct-25-2026',
    cycleName: 'October 2026 (Semi-Monthly Cycle 2)',
    cutoffDate: '2026-10-25',
    payDate: '2026-10-31',
    status: 'upcoming',
    daysRemaining: 35
  }
];

export const PAYOUT_CATEGORIES = {
  payment: [
    'Retroactive Pay / Salary Adjustment',
    'Extra Duty & Tutoring Stipend',
    'Department Chair / Lead Teacher Stipend',
    'Sign-on / Retention Bonus',
    'Mileage & Travel Expense Reimbursement',
    'Unused PTO / Vacation Separation Payout',
    'Performance & UIL Academic Coaching Award',
    'Other Employee Payout'
  ],
  deduction: [
    'Overpayment Recoupment (Prior Cycle Correction)',
    'Unearned PTO Days Recoupment',
    'Unreturned District Equipment (Laptop/Keycards)',
    'Employee Uniform / Badge Replacement Fee',
    'Benefit / Insurance Premium Catch-up',
    'Voluntary Benefit Adjustment',
    'Other Payroll Deduction'
  ]
};

export const INITIAL_PAYOUT_REQUESTS: CpoPayoutRequest[] = [
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
    payrollCutoffDate: '2026-09-25',
    payrollCycleName: 'September 2026 (Semi-Monthly Cycle 2)',
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
        notes: 'Submitted for CPO review ahead of Sept 25 ADP cut-off.'
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
    payrollCutoffDate: '2026-09-25',
    payrollCycleName: 'September 2026 (Semi-Monthly Cycle 2)',
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
    payrollCutoffDate: '2026-09-25',
    payrollCycleName: 'September 2026 (Semi-Monthly Cycle 2)',
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
    cpoDecisionNotes: 'Approved for Sept 25 ADP payroll execution. Extra duty verified with campus leadership.',
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
    payrollCutoffDate: '2026-09-10',
    payrollCycleName: 'September 2026 (Semi-Monthly Cycle 1)',
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
    adpBatchNumber: 'ADP-BATCH-SEP01-2026',
    payrollNotes: 'Direct deposited on September 15, 2026 pay date.',
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
        notes: 'Included in ADP Batch #ADP-BATCH-SEP01-2026.'
      }
    ]
  }
];
