export type PayoutType = 'payment' | 'deduction';

export type PayoutStatus = 
  | 'pending_cpo'        // Submitted by Regional HR, awaiting CPO review
  | 'approved_by_cpo'    // Approved by CPO, queued for Payroll ADP action
  | 'processed_payroll'  // Executed in ADP by Payroll Coordinator
  | 'rejected'           // Rejected by CPO
  | 'revision_required'; // Returned to Regional HR for additional documentation/revision

export interface PayoutSupportingDoc {
  id: string;
  name: string;
  size: string;
  fileType: string;
  uploadedAt: string;
  uploadedBy: string;
  dataUrl?: string;
}

export interface PayrollCutoffCycle {
  id: string;
  cycleName: string;
  cutoffDate: string; // YYYY-MM-DD
  payDate: string;    // YYYY-MM-DD
  status: 'active' | 'upcoming' | 'closed';
  daysRemaining: number;
}

export interface CpoPayoutRequest {
  id: string;
  trackingNumber: string; // e.g. "SST-PAY-2026-001"
  payoutType: PayoutType; // 'payment' (to staff) | 'deduction' (from staff)
  
  // Staff Details
  employeeId: string;
  employeeName: string;
  adpId: string;
  campus: string;
  region: string;
  jobTitle: string;
  currentSalary?: number;
  
  // Financial Details & Reason
  amount: number;
  category: string; // e.g. "Retroactive Adjustment", "Tutoring Stipend", "Overpayment Recoupment"
  reason: string;   // detailed description/justification
  
  // Target Payroll Cutoff
  payrollCutoffDate: string;
  payrollCycleName: string;
  isUrgentCutoff?: boolean;
  
  // Attached Supporting Documents
  supportingDocs: PayoutSupportingDoc[];
  
  // Submitter (Regional HR Coordinator)
  submittedBy: string;
  submitterEmail: string;
  submitterRole: string;
  submittedAt: string;
  
  // CPO Review & Approval
  status: PayoutStatus;
  cpoDecisionDate?: string;
  cpoDecisionNotes?: string;
  cpoSignerName?: string;
  cpoSignerId?: string;
  cpoIpAddress?: string;
  cpoSignatureImage?: string;
  cpoSigningPin?: string;
  
  // Payroll Execution (ADP Processing)
  payrollProcessedAt?: string;
  payrollProcessedBy?: string;
  adpBatchNumber?: string;
  payrollNotes?: string;
  
  // Audit Trail History
  history: {
    id: string;
    action: string;
    actor: string;
    timestamp: string;
    notes?: string;
  }[];
}
