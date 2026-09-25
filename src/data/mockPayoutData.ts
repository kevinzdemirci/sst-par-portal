import { CpoPayoutRequest, PayrollCutoffCycle } from '../types/payout';

export const SST_PAYROLL_CYCLES: PayrollCutoffCycle[] = [
  {
    id: 'cycle-2026-01',
    periodNumber: 1,
    cycleName: 'Period 1: 07/13/2026 – 08/02/2026',
    startDate: '2026-07-13',
    endDate: '2026-08-02',
    cutoffDate: '2026-08-04',
    payDate: '2026-08-14',
    periodStartFormatted: '7/13/2026',
    periodEndFormatted: '8/2/2026',
    correctionsDueFormatted: '8/4/2026',
    payDateFormatted: 'Friday, August 14, 2026',
    status: 'closed',
    daysRemaining: 0
  },
  {
    id: 'cycle-2026-02',
    periodNumber: 2,
    cycleName: 'Period 2: 08/03/2026 – 08/16/2026',
    startDate: '2026-08-03',
    endDate: '2026-08-16',
    cutoffDate: '2026-08-18',
    payDate: '2026-08-31',
    periodStartFormatted: '8/3/2026',
    periodEndFormatted: '8/16/2026',
    correctionsDueFormatted: '8/18/2026',
    payDateFormatted: 'Monday, August 31, 2026',
    status: 'closed',
    daysRemaining: 0
  },
  {
    id: 'cycle-2026-03',
    periodNumber: 3,
    cycleName: 'Period 3: 08/17/2026 – 08/30/2026',
    startDate: '2026-08-17',
    endDate: '2026-08-30',
    cutoffDate: '2026-09-01',
    payDate: '2026-09-15',
    periodStartFormatted: '8/17/2026',
    periodEndFormatted: '8/30/2026',
    correctionsDueFormatted: '9/1/2026',
    payDateFormatted: 'Tuesday, September 15, 2026',
    status: 'closed',
    daysRemaining: 0
  },
  {
    id: 'cycle-2026-04',
    periodNumber: 4,
    cycleName: 'Period 4: 08/31/2026 – 09/13/2026',
    startDate: '2026-08-31',
    endDate: '2026-09-13',
    cutoffDate: '2026-09-15',
    payDate: '2026-09-30',
    periodStartFormatted: '8/31/2026',
    periodEndFormatted: '9/13/2026',
    correctionsDueFormatted: '9/15/2026',
    payDateFormatted: 'Wednesday, September 30, 2026',
    status: 'closed',
    daysRemaining: 0
  },
  {
    id: 'cycle-2026-05',
    periodNumber: 5,
    cycleName: 'Period 5: 09/14/2026 – 09/27/2026',
    startDate: '2026-09-14',
    endDate: '2026-09-27',
    cutoffDate: '2026-09-29',
    payDate: '2026-10-15',
    periodStartFormatted: '9/14/2026',
    periodEndFormatted: '9/27/2026',
    correctionsDueFormatted: '9/29/2026',
    payDateFormatted: 'Thursday, October 15, 2026',
    status: 'active',
    daysRemaining: 5
  },
  {
    id: 'cycle-2026-06',
    periodNumber: 6,
    cycleName: 'Period 6: 09/28/2026 – 10/11/2026',
    startDate: '2026-09-28',
    endDate: '2026-10-11',
    cutoffDate: '2026-10-13',
    payDate: '2026-10-30',
    periodStartFormatted: '9/28/2026',
    periodEndFormatted: '10/11/2026',
    correctionsDueFormatted: '10/13/2026',
    payDateFormatted: 'Friday, October 30, 2026',
    status: 'upcoming',
    daysRemaining: 19
  },
  {
    id: 'cycle-2026-07',
    periodNumber: 7,
    cycleName: 'Period 7: 10/12/2026 – 11/01/2026',
    startDate: '2026-10-12',
    endDate: '2026-11-01',
    cutoffDate: '2026-11-03',
    payDate: '2026-11-13',
    periodStartFormatted: '10/12/2026',
    periodEndFormatted: '11/1/2026',
    correctionsDueFormatted: '11/3/2026',
    payDateFormatted: 'Friday, November 13, 2026',
    status: 'upcoming',
    daysRemaining: 40
  },
  {
    id: 'cycle-2026-08',
    periodNumber: 8,
    cycleName: 'Period 8: 11/02/2026 – 11/15/2026',
    startDate: '2026-11-02',
    endDate: '2026-11-15',
    cutoffDate: '2026-11-17',
    payDate: '2026-11-30',
    periodStartFormatted: '11/2/2026',
    periodEndFormatted: '11/15/2026',
    correctionsDueFormatted: '11/17/2026',
    payDateFormatted: 'Monday, November 30, 2026',
    status: 'upcoming',
    daysRemaining: 54
  },
  {
    id: 'cycle-2026-09',
    periodNumber: 9,
    cycleName: 'Period 9: 11/16/2026 – 11/29/2026',
    startDate: '2026-11-16',
    endDate: '2026-11-29',
    cutoffDate: '2026-12-01',
    payDate: '2026-12-15',
    periodStartFormatted: '11/16/2026',
    periodEndFormatted: '11/29/2026',
    correctionsDueFormatted: '12/1/2026',
    payDateFormatted: 'Tuesday, December 15, 2026',
    status: 'upcoming',
    daysRemaining: 68
  },
  {
    id: 'cycle-2026-10',
    periodNumber: 10,
    cycleName: 'Period 10: 11/30/2026 – 12/13/2026',
    startDate: '2026-11-30',
    endDate: '2026-12-13',
    cutoffDate: '2026-12-15',
    payDate: '2026-12-31',
    periodStartFormatted: '11/30/2026',
    periodEndFormatted: '12/13/2026',
    correctionsDueFormatted: '12/15/2026',
    payDateFormatted: 'Thursday, December 31, 2026',
    status: 'upcoming',
    daysRemaining: 82
  },
  {
    id: 'cycle-2026-11',
    periodNumber: 11,
    cycleName: 'Period 11: 12/14/2026 – 01/03/2027',
    startDate: '2026-12-14',
    endDate: '2027-01-03',
    cutoffDate: '2027-01-05',
    payDate: '2027-01-15',
    periodStartFormatted: '12/14/2026',
    periodEndFormatted: '1/3/2027',
    correctionsDueFormatted: '1/5/2027',
    payDateFormatted: 'Friday, January 15, 2027',
    status: 'upcoming',
    daysRemaining: 103
  },
  {
    id: 'cycle-2027-12',
    periodNumber: 12,
    cycleName: 'Period 12: 01/04/2027 – 01/17/2027',
    startDate: '2027-01-04',
    endDate: '2027-01-17',
    cutoffDate: '2027-01-19',
    payDate: '2027-01-29',
    periodStartFormatted: '1/4/2027',
    periodEndFormatted: '1/17/2027',
    correctionsDueFormatted: '1/19/2027',
    payDateFormatted: 'Friday, January 29, 2027',
    status: 'upcoming',
    daysRemaining: 117
  },
  {
    id: 'cycle-2027-13',
    periodNumber: 13,
    cycleName: 'Period 13: 01/18/2027 – 01/31/2027',
    startDate: '2027-01-18',
    endDate: '2027-01-31',
    cutoffDate: '2027-02-02',
    payDate: '2027-02-15',
    periodStartFormatted: '1/18/2027',
    periodEndFormatted: '1/31/2027',
    correctionsDueFormatted: '2/2/2027',
    payDateFormatted: 'Monday, February 15, 2027',
    status: 'upcoming',
    daysRemaining: 131
  },
  {
    id: 'cycle-2027-14',
    periodNumber: 14,
    cycleName: 'Period 14: 02/01/2027 – 02/14/2027',
    startDate: '2027-02-01',
    endDate: '2027-02-14',
    cutoffDate: '2027-02-16',
    payDate: '2027-02-26',
    periodStartFormatted: '2/1/2027',
    periodEndFormatted: '2/14/2027',
    correctionsDueFormatted: '2/16/2027',
    payDateFormatted: 'Friday, February 26, 2027',
    status: 'upcoming',
    daysRemaining: 145
  },
  {
    id: 'cycle-2027-15',
    periodNumber: 15,
    cycleName: 'Period 15: 02/15/2027 – 02/28/2027',
    startDate: '2027-02-15',
    endDate: '2027-02-28',
    cutoffDate: '2027-03-02',
    payDate: '2027-03-15',
    periodStartFormatted: '2/15/2027',
    periodEndFormatted: '2/28/2027',
    correctionsDueFormatted: '3/2/2027',
    payDateFormatted: 'Monday, March 15, 2027',
    status: 'upcoming',
    daysRemaining: 159
  },
  {
    id: 'cycle-2027-16',
    periodNumber: 16,
    cycleName: 'Period 16: 03/01/2027 – 03/14/2027',
    startDate: '2027-03-01',
    endDate: '2027-03-14',
    cutoffDate: '2027-03-16',
    payDate: '2027-03-31',
    periodStartFormatted: '3/1/2027',
    periodEndFormatted: '3/14/2027',
    correctionsDueFormatted: '3/16/2027',
    payDateFormatted: 'Wednesday, March 31, 2027',
    status: 'upcoming',
    daysRemaining: 173
  },
  {
    id: 'cycle-2027-17',
    periodNumber: 17,
    cycleName: 'Period 17: 03/15/2027 – 04/04/2027',
    startDate: '2027-03-15',
    endDate: '2027-04-04',
    cutoffDate: '2027-04-06',
    payDate: '2027-04-15',
    periodStartFormatted: '3/15/2027',
    periodEndFormatted: '4/4/2027',
    correctionsDueFormatted: '4/6/2027',
    payDateFormatted: 'Thursday, April 15, 2027',
    status: 'upcoming',
    daysRemaining: 194
  },
  {
    id: 'cycle-2027-18',
    periodNumber: 18,
    cycleName: 'Period 18: 04/05/2027 – 04/18/2027',
    startDate: '2027-04-05',
    endDate: '2027-04-18',
    cutoffDate: '2027-04-20',
    payDate: '2027-04-30',
    periodStartFormatted: '4/5/2027',
    periodEndFormatted: '4/18/2027',
    correctionsDueFormatted: '4/20/2027',
    payDateFormatted: 'Friday, April 30, 2027',
    status: 'upcoming',
    daysRemaining: 208
  },
  {
    id: 'cycle-2027-19',
    periodNumber: 19,
    cycleName: 'Period 19: 04/19/2027 – 05/02/2027',
    startDate: '2027-04-19',
    endDate: '2027-05-02',
    cutoffDate: '2027-05-04',
    payDate: '2027-05-14',
    periodStartFormatted: '4/19/2027',
    periodEndFormatted: '5/2/2027',
    correctionsDueFormatted: '5/4/2027',
    payDateFormatted: 'Friday, May 14, 2027',
    status: 'upcoming',
    daysRemaining: 222
  },
  {
    id: 'cycle-2027-20',
    periodNumber: 20,
    cycleName: 'Period 20: 05/03/2027 – 05/16/2027',
    startDate: '2027-05-03',
    endDate: '2027-05-16',
    cutoffDate: '2027-05-18',
    payDate: '2027-05-31',
    periodStartFormatted: '5/3/2027',
    periodEndFormatted: '5/16/2027',
    correctionsDueFormatted: '5/18/2027',
    payDateFormatted: 'Monday, May 31, 2027',
    status: 'upcoming',
    daysRemaining: 236
  },
  {
    id: 'cycle-2027-21',
    periodNumber: 21,
    cycleName: 'Period 21: 05/17/2027 – 05/30/2027',
    startDate: '2027-05-17',
    endDate: '2027-05-30',
    cutoffDate: '2027-06-01',
    payDate: '2027-06-15',
    periodStartFormatted: '5/17/2027',
    periodEndFormatted: '5/30/2027',
    correctionsDueFormatted: '6/1/2027',
    payDateFormatted: 'Tuesday, June 15, 2027',
    status: 'upcoming',
    daysRemaining: 250
  },
  {
    id: 'cycle-2027-22',
    periodNumber: 22,
    cycleName: 'Period 22: 05/31/2027 – 06/13/2027',
    startDate: '2027-05-31',
    endDate: '2027-06-13',
    cutoffDate: '2027-06-15',
    payDate: '2027-06-30',
    periodStartFormatted: '5/31/2027',
    periodEndFormatted: '6/13/2027',
    correctionsDueFormatted: '6/15/2027',
    payDateFormatted: 'Wednesday, June 30, 2027',
    status: 'upcoming',
    daysRemaining: 264
  },
  {
    id: 'cycle-2027-23',
    periodNumber: 23,
    cycleName: 'Period 23: 06/14/2027 – 06/27/2027',
    startDate: '2027-06-14',
    endDate: '2027-06-27',
    cutoffDate: '2027-06-29',
    payDate: '2027-07-15',
    periodStartFormatted: '6/14/2027',
    periodEndFormatted: '6/27/2027',
    correctionsDueFormatted: '6/29/2027',
    payDateFormatted: 'Thursday, July 15, 2027',
    status: 'upcoming',
    daysRemaining: 278
  },
  {
    id: 'cycle-2027-24',
    periodNumber: 24,
    cycleName: 'Period 24: 06/28/2027 – 07/11/2027',
    startDate: '2027-06-28',
    endDate: '2027-07-11',
    cutoffDate: '2027-07-13',
    payDate: '2027-07-30',
    periodStartFormatted: '6/28/2027',
    periodEndFormatted: '7/11/2027',
    correctionsDueFormatted: '7/13/2027',
    payDateFormatted: 'Friday, July 30, 2027',
    status: 'upcoming',
    daysRemaining: 292
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

export function getActivePayrollCycle(): PayrollCutoffCycle {
  return SST_PAYROLL_CYCLES.find(c => c.status === 'active') || SST_PAYROLL_CYCLES[4];
}

export function getUpcomingPayrollCycles(): PayrollCutoffCycle[] {
  return SST_PAYROLL_CYCLES.filter(c => c.status === 'upcoming');
}

export function getClosedPayrollCycles(): PayrollCutoffCycle[] {
  return SST_PAYROLL_CYCLES.filter(c => c.status === 'closed');
}
