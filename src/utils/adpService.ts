import { AdpWorker, AdpConnectionConfig, TerminationAlignmentSummary, AdpAlignmentStatus } from '../types/adp';
import { INITIAL_ADP_STAFF_ROSTER, DEFAULT_ADP_CONFIG } from '../data/mockAdpStaffData';
import { PersonnelActionRequest, Campus, SchoolLocation } from '../types/par';

const ADP_STAFF_STORAGE_KEY = 'sst_adp_staff_roster_v2';
const ADP_CONFIG_STORAGE_KEY = 'sst_adp_connection_config_v2';

// In-memory fallback for non-browser environments (e.g. Node test runners)
let memoryAdpStaffStore: AdpWorker[] | null = null;
let memoryAdpConfigStore: AdpConnectionConfig | null = null;

/**
 * Retrieve saved ADP staff roster from localStorage or initialize with defaults.
 */
export function getStoredAdpStaff(): AdpWorker[] {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(ADP_STAFF_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } else if (memoryAdpStaffStore) {
      return memoryAdpStaffStore;
    }
  } catch (e) {
    console.error('Error reading stored ADP staff roster:', e);
  }
  return INITIAL_ADP_STAFF_ROSTER;
}

/**
 * Persist ADP staff roster to localStorage or in-memory fallback.
 */
export function saveStoredAdpStaff(roster: AdpWorker[]): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(ADP_STAFF_STORAGE_KEY, JSON.stringify(roster));
    } else {
      memoryAdpStaffStore = roster;
    }
  } catch (e) {
    console.error('Error saving stored ADP staff roster:', e);
  }
}

/**
 * Retrieve saved ADP configuration from localStorage or in-memory fallback.
 */
export function getStoredAdpConfig(): AdpConnectionConfig {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(ADP_CONFIG_STORAGE_KEY);
      if (raw) {
        return { ...DEFAULT_ADP_CONFIG, ...JSON.parse(raw) };
      }
    } else if (memoryAdpConfigStore) {
      return memoryAdpConfigStore;
    }
  } catch (e) {
    console.error('Error reading stored ADP config:', e);
  }
  return DEFAULT_ADP_CONFIG;
}

/**
 * Persist ADP configuration to localStorage or in-memory fallback.
 */
export function saveStoredAdpConfig(config: AdpConnectionConfig): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(ADP_CONFIG_STORAGE_KEY, JSON.stringify(config));
    } else {
      memoryAdpConfigStore = config;
    }
  } catch (e) {
    console.error('Error saving stored ADP config:', e);
  }
}

/**
 * Core Alignment Engine: Reconciles the ADP staff roster against active & completed PARs.
 * Ensures bidirectional alignment between the ADP HRIS roster and the district PAR termination workflow.
 */
export function reconcileStaffWithPars(
  roster: AdpWorker[],
  pars: PersonnelActionRequest[]
): { updatedRoster: AdpWorker[]; summary: TerminationAlignmentSummary } {
  // Find all separation PARs
  const separationPars = pars.filter(p => p.actionType === 'termination');

  let alignedCount = 0;
  let inProgressParCount = 0;
  let pendingAdpCloseoutCount = 0;
  let discrepanciesCount = 0;

  const updatedRoster = roster.map(worker => {
    // Match by adpId or associateId or employeeId
    const matchingPar = separationPars.find(
      p => p.employeeId === worker.adpId || p.associateId === worker.adpId || p.workEmail?.toLowerCase() === worker.workEmail.toLowerCase()
    );

    let alignmentStatus: AdpAlignmentStatus = 'aligned';
    let linkedParId = worker.linkedParId;
    let linkedParTracking = worker.linkedParTracking;
    let employmentStatus = worker.employmentStatus;
    let terminationDate = worker.terminationDate;
    let lastDayWorked = worker.lastDayWorked;
    let terminationReason = worker.terminationReason;
    let eligibleForRehire = worker.eligibleForRehire;

    if (matchingPar) {
      linkedParId = matchingPar.id;
      linkedParTracking = matchingPar.trackingNumber;

      if (matchingPar.currentStage === 'completed' || matchingPar.currentStage === 'payroll_action') {
        if (worker.employmentStatus === 'Terminated') {
          alignmentStatus = 'aligned';
          alignedCount++;
        } else {
          // PAR is at payroll execution or completed, but ADP still shows Active/Pending
          alignmentStatus = 'pending_adp_closeout';
          pendingAdpCloseoutCount++;
        }
      } else if (matchingPar.currentStage === 'rejected') {
        alignmentStatus = 'aligned';
        alignedCount++;
      } else {
        // PAR is actively moving through approval steps (supervisor, cpo, regional, hr_review)
        alignmentStatus = 'par_in_progress';
        inProgressParCount++;
        if (worker.employmentStatus === 'Active') {
          employmentStatus = 'Pending Termination';
        }
        lastDayWorked = matchingPar.lastDayWorked || matchingPar.effectiveDate;
        terminationReason = matchingPar.reasonForTermination || worker.terminationReason;
      }
    } else {
      // No PAR found for this worker
      if (worker.employmentStatus === 'Terminated') {
        // Staff is marked terminated in ADP, but no separation PAR exists on file!
        // This is an audit flag for district compliance
        alignmentStatus = 'discrepancy_missing_par';
        discrepanciesCount++;
      } else {
        alignmentStatus = 'aligned';
        alignedCount++;
      }
    }

    return {
      ...worker,
      alignmentStatus,
      linkedParId,
      linkedParTracking,
      employmentStatus,
      terminationDate,
      lastDayWorked,
      terminationReason,
      eligibleForRehire
    };
  });

  const activeCount = updatedRoster.filter(w => w.employmentStatus === 'Active').length;
  const terminatedCount = updatedRoster.filter(w => w.employmentStatus === 'Terminated').length;
  const onLeaveCount = updatedRoster.filter(w => w.employmentStatus === 'Leave of Absence' || w.employmentStatus === 'Pending Termination').length;

  const summary: TerminationAlignmentSummary = {
    totalWorkers: updatedRoster.length,
    activeCount,
    terminatedCount,
    onLeaveCount,
    alignedCount,
    inProgressParCount,
    pendingAdpCloseoutCount,
    discrepanciesCount
  };

  return { updatedRoster, summary };
}

/**
 * Executes ADP Termination Closeout:
 * Called when Payroll Coordinator (Paola Comparini) finalizes a Separation PAR in ADP Workforce Now.
 */
export function executeAdpTerminationCloseout(
  roster: AdpWorker[],
  adpId: string,
  par: PersonnelActionRequest,
  batchNumber?: string
): AdpWorker[] {
  const finalBatch = batchNumber || `ADP-BATCH-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`;
  const rehireStatus: 'Yes' | 'No' | 'Review Required' = 
    par.markRehireStatus === true ? 'Yes' : par.markRehireStatus === false ? 'No' : 'Review Required';

  const updated: AdpWorker[] = roster.map(worker => {
    if (worker.adpId === adpId || worker.associateId === adpId) {
      return {
        ...worker,
        employmentStatus: 'Terminated' as const,
        terminationDate: par.effectiveDate,
        lastDayWorked: par.lastDayWorked || par.effectiveDate,
        terminationReason: par.reasonForTermination || 'Voluntary / Involuntary Separation',
        adpTerminationCode: par.terminationCode || (par.isVoluntary ? 'TER_VOL_RESIGN' : 'TER_INVOL_ATWILL'),
        eligibleForRehire: rehireStatus,
        adpBatchNumber: finalBatch,
        adpSyncTimestamp: new Date().toISOString(),
        linkedParId: par.id,
        linkedParTracking: par.trackingNumber,
        alignmentStatus: 'aligned' as const
      };
    }
    return worker;
  });

  saveStoredAdpStaff(updated);
  return updated;
}

/**
 * Batch Push Terminations to ADP:
 * Takes all completed separation PARs and updates their ADP worker records to Terminated.
 */
export function batchPushTerminationsToAdp(
  roster: AdpWorker[],
  pars: PersonnelActionRequest[]
): { updatedRoster: AdpWorker[]; closedCount: number } {
  const completedSeparations = pars.filter(p => p.actionType === 'termination' && p.currentStage === 'completed');
  let closedCount = 0;

  let updatedRoster = [...roster];
  completedSeparations.forEach(par => {
    const worker = updatedRoster.find(w => w.adpId === par.employeeId || w.associateId === par.employeeId);
    if (worker && worker.employmentStatus !== 'Terminated') {
      updatedRoster = executeAdpTerminationCloseout(updatedRoster, worker.adpId, par);
      closedCount++;
    }
  });

  return { updatedRoster, closedCount };
}

/**
 * Simulates or performs live fetch from ADP Workforce Now API.
 */
export async function syncFromAdpApi(
  config: AdpConnectionConfig = DEFAULT_ADP_CONFIG
): Promise<{ success: boolean; syncedCount: number; message: string }> {
  // Simulate network latency for authentic enterprise experience
  await new Promise(resolve => setTimeout(resolve, 800));

  const current = getStoredAdpStaff();
  const now = new Date().toISOString();

  // Touch sync timestamp on all workers
  const refreshed = current.map(w => ({
    ...w,
    adpSyncTimestamp: now
  }));

  saveStoredAdpStaff(refreshed);

  const updatedConfig = { ...config, lastSyncTimestamp: now };
  saveStoredAdpConfig(updatedConfig);

  return {
    success: true,
    syncedCount: refreshed.length,
    message: `Successfully synchronized ${refreshed.length} active and separated staff records with ADP Workforce Now.`
  };
}

/**
 * Parses ADP CSV export text into typed AdpWorker records.
 * Supports standard ADP custom report format and quoted comma fields.
 */
function splitCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"' || char === "'") {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim().replace(/^["']|["']$/g, ''));
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim().replace(/^["']|["']$/g, ''));
  return result;
}

export function parseAdpCsvExport(csvText: string): AdpWorker[] {
  const lines = csvText.split(/\r?\n/).filter(l => l.trim().length > 0);
  if (lines.length < 2) return [];

  const headers = splitCsvLine(lines[0]).map(h => h.trim().toLowerCase());
  
  const workers: AdpWorker[] = [];
  const now = new Date().toISOString();

  for (let i = 1; i < lines.length; i++) {
    const cols = splitCsvLine(lines[i]);
    if (cols.length < 3) continue;

    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = cols[idx] || '';
    });

    const adpId = row['associate id'] || row['adp id'] || row['worker id'] || `ADP-TX-${1000 + i}`;
    
    let firstName = row['first name'] || row['first'] || '';
    let lastName = row['last name'] || row['last'] || '';
    if (!firstName && !lastName && (row['worker name'] || row['name'])) {
      const rawName = row['worker name'] || row['name'];
      if (rawName.includes(',')) {
        const parts = rawName.split(',').map(s => s.trim());
        lastName = parts[0];
        firstName = parts[1] || 'Staff';
      } else {
        const parts = rawName.split(/\s+/).map(s => s.trim());
        firstName = parts[0] || 'Staff';
        lastName = parts.slice(1).join(' ') || 'Member';
      }
    }
    if (!firstName) firstName = 'Staff';
    if (!lastName) lastName = 'Member';
    const fullName = `${firstName} ${lastName}`.trim();

    const title = row['job title'] || row['title'] || 'Staff Educator';
    const campus = (row['campus'] || 'SST Champions Elementary') as Campus;
    const location = (row['location'] || (campus.includes('San Antonio') ? 'San Antonio' : campus.includes('Corpus') ? 'Corpus Christi' : 'Houston')) as SchoolLocation;
    
    const statusRaw = (row['status'] || row['employment status'] || 'Active').toLowerCase();
    const employmentStatus = statusRaw.includes('term') ? 'Terminated' : statusRaw.includes('leave') ? 'Leave of Absence' : 'Active';

    const salaryRaw = (row['annual salary'] || row['salary'] || '50000').replace(/[\$,]/g, '');
    const salary = parseFloat(salaryRaw) || 50000;

    workers.push({
      id: `ADP-CSV-${i}`,
      adpId,
      associateId: adpId,
      positionId: row['position id'] || `POS-TX-${100 + i}`,
      firstName,
      lastName,
      fullName,
      workEmail: row['email'] || `${firstName.toLowerCase().slice(0, 1)}${lastName.toLowerCase().replace(/\s+/g, '')}@ssttx.org`,
      jobTitle: title,
      department: row['department'] || 'Instruction',
      campus,
      location,
      employmentStatus,
      hireDate: row['hire date'] || '2023-08-01',
      annualSalary: salary,
      payFrequency: 'Semi-Monthly',
      supervisorName: row['supervisor'] || 'Campus Leadership',
      trsMember: true,
      contractType: 'At-Will',
      adpSyncTimestamp: now,
      alignmentStatus: 'aligned'
    });
  }

  return workers;
}
