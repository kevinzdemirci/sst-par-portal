import { Campus, SchoolLocation } from './par';

export type AdpEmploymentStatus = 'Active' | 'Terminated' | 'Leave of Absence' | 'Pending Termination';

export type AdpAlignmentStatus = 
  | 'aligned'                   // Active with no pending termination, OR Terminated with completed PAR
  | 'par_in_progress'           // Active in ADP, Separation PAR currently in routing
  | 'pending_adp_closeout'      // PAR approved/completed, awaiting final Payroll ADP batch execution
  | 'discrepancy_missing_par'   // Marked Terminated in ADP without an approved PAR on file
  | 'discrepancy_pending_adp';  // PAR marked completed, but ADP record is still Active

export interface AdpWorker {
  id: string;
  adpId: string;                // ADP Associate ID / Worker OID (e.g. JMJRMGNGA)
  associateId: string;
  positionId: string;           // ADP Position Control Code (e.g. POS-CHAMP-MED-01)
  firstName: string;
  lastName: string;
  fullName: string;
  workEmail: string;
  phone?: string;
  jobTitle: string;
  department: string;
  campus: Campus;
  location: SchoolLocation;
  employmentStatus: AdpEmploymentStatus;
  hireDate: string;             // YYYY-MM-DD
  terminationDate?: string;     // YYYY-MM-DD
  lastDayWorked?: string;       // YYYY-MM-DD
  terminationReason?: string;
  adpTerminationCode?: string;  // e.g. "TER_VOL_RESIGN", "TER_INVOL_PERF", "TER_JOB_ABANDON"
  eligibleForRehire?: 'Yes' | 'No' | 'Review Required';
  annualSalary: number;
  payFrequency: 'Semi-Monthly';
  supervisorName: string;
  supervisorAdpId?: string;
  dpsSid?: string;              // Texas DPS SID
  trsMember: boolean;           // Texas Teacher Retirement System Member
  contractType: 'At-Will';
  
  // Alignment & Sync Metadata
  adpBatchNumber?: string;      // Last ADP Batch confirmation number
  adpSyncTimestamp: string;     // Last synchronized with ADP
  linkedParId?: string;         // Associated PAR ID (e.g. par-sst-001)
  linkedParTracking?: string;   // Associated PAR Tracking # (e.g. PAR-2026-RQdkD7OW)
  alignmentStatus: AdpAlignmentStatus;
}

export interface AdpConnectionConfig {
  isEnabled: boolean;
  connectionMode: 'api' | 'sheets_relay' | 'sandbox';
  clientId: string;
  clientSecret: string;
  organizationId: string;       // e.g. "SST-TEXAS-CHARTER"
  apiEndpoint: string;
  lastSyncTimestamp?: string;
  autoSyncOnParComplete: boolean;
  webhookUrl?: string;
  environment: 'production' | 'sandbox';
}

export interface TerminationAlignmentSummary {
  totalWorkers: number;
  activeCount: number;
  terminatedCount: number;
  onLeaveCount: number;
  alignedCount: number;
  inProgressParCount: number;
  pendingAdpCloseoutCount: number;
  discrepanciesCount: number;
}
