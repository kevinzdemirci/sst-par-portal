import { AdpWorker, AdpConnectionConfig, TerminationAlignmentSummary, AdpAlignmentStatus } from '../types/adp';
import { INITIAL_ADP_STAFF_ROSTER, DEFAULT_ADP_CONFIG } from '../data/mockAdpStaffData';
import { PersonnelActionRequest, SchoolLocation } from '../types/par';
import { locationForCampus, matchSstCampus } from './formatters';

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

/** Staff record returned by the SST ADP relay (adp-relay/src/mapWorker.js). */
export interface AdpRelayWorker {
  associateOID: string;
  workerId: string;
  firstName: string;
  lastName: string;
  preferredName?: string;
  workEmail: string;
  jobTitle: string;
  positionId: string;
  department: string;
  locationName: string;
  status: 'Active' | 'Leave of Absence' | 'Terminated';
  workerType: 'Full-time' | 'Part-time' | null;
  hireDate: string;
  terminationDate?: string;
  annualSalary?: number;
  supervisorName: string;
  supervisorAssociateOID?: string;
  dpsSid?: string;
  trsMember?: boolean;
}

function regionFromLocationName(name: string): SchoolLocation {
  const n = name.toLowerCase();
  if (n.includes('san antonio')) return 'San Antonio';
  if (n.includes('corpus')) return 'Corpus Christi';
  if (n.includes('houston')) return 'Houston';
  return 'Central Administration';
}

export function workerFromRelayRecord(rec: AdpRelayWorker, syncedAt: string): AdpWorker {
  const campus = matchSstCampus(rec.locationName) || '';
  return {
    id: rec.associateOID,
    adpId: rec.workerId || rec.associateOID,
    associateId: rec.associateOID,
    positionId: rec.positionId || '',
    firstName: rec.firstName,
    lastName: rec.lastName,
    fullName: `${rec.firstName} ${rec.lastName}`.trim(),
    workEmail: rec.workEmail || '',
    jobTitle: rec.jobTitle || '',
    department: rec.department || '',
    campus,
    location: campus ? locationForCampus(campus) : regionFromLocationName(rec.locationName || ''),
    locationName: rec.locationName || undefined,
    employmentStatus: rec.status,
    workerType: rec.workerType || undefined,
    hireDate: rec.hireDate || '',
    terminationDate: rec.terminationDate,
    annualSalary: rec.annualSalary ?? 0,
    payFrequency: 'Semi-Monthly',
    supervisorName: rec.supervisorName || '',
    supervisorAdpId: rec.supervisorAssociateOID,
    dpsSid: rec.dpsSid,
    trsMember: rec.trsMember ?? true,
    contractType: 'At-Will',
    adpSyncTimestamp: syncedAt,
    alignmentStatus: 'aligned'
  };
}

/**
 * Merges freshly synced ADP records into the stored roster, keeping each worker's
 * PAR linkage and alignment state.
 */
export function mergeAdpRoster(current: AdpWorker[], incoming: AdpWorker[]): AdpWorker[] {
  const byId = new Map(current.map(w => [w.associateId || w.adpId, w]));
  const merged = incoming.map(w => {
    const existing = byId.get(w.associateId) || current.find(c => c.adpId === w.adpId);
    return existing
      ? {
          ...w,
          linkedParId: existing.linkedParId,
          linkedParTracking: existing.linkedParTracking,
          adpBatchNumber: existing.adpBatchNumber,
          alignmentStatus: existing.alignmentStatus,
          lastDayWorked: existing.lastDayWorked,
          terminationReason: existing.terminationReason,
          eligibleForRehire: existing.eligibleForRehire
        }
      : w;
  });
  // Keep workers that are linked to a PAR even if ADP no longer returns them.
  const incomingIds = new Set(incoming.map(w => w.associateId));
  const orphanedLinked = current.filter(w => w.linkedParId && !incomingIds.has(w.associateId || w.adpId));
  return [...merged, ...orphanedLinked];
}

/**
 * Pulls the staff roster from ADP Workforce Now through the SST ADP relay.
 * The relay holds the ADP credentials; the browser only sends the user's sign-in cookie.
 */
export async function fetchLiveAdpRoster(relayUrl: string): Promise<{ workers: AdpWorker[]; syncedAt: string }> {
  const res = await fetch(`${relayUrl.replace(/\/+$/, '')}/workers`, {
    credentials: 'include',
    headers: { Accept: 'application/json' }
  });
  if (!res.ok) {
    let detail = '';
    try {
      detail = (await res.json()).error || '';
    } catch {
      // non-JSON error body
    }
    throw new Error(detail || `ADP relay returned ${res.status}`);
  }
  const data: { syncedAt: string; workers: AdpRelayWorker[] } = await res.json();
  return { syncedAt: data.syncedAt, workers: data.workers.map(w => workerFromRelayRecord(w, data.syncedAt)) };
}

/**
 * Syncs the staff roster. With a relay URL configured this pulls live data from ADP;
 * without one it only refreshes the sample roster's timestamps.
 */
export async function syncFromAdpApi(
  config: AdpConnectionConfig = DEFAULT_ADP_CONFIG
): Promise<{ success: boolean; syncedCount: number; message: string; isLive: boolean }> {
  const current = getStoredAdpStaff();

  if (config.relayUrl) {
    const { workers, syncedAt } = await fetchLiveAdpRoster(config.relayUrl);
    const merged = mergeAdpRoster(current, workers);
    saveStoredAdpStaff(merged);
    saveStoredAdpConfig({ ...config, lastSyncTimestamp: syncedAt });
    return {
      success: true,
      syncedCount: workers.length,
      isLive: true,
      message: `Synced ${workers.length} staff records from ADP Workforce Now.`
    };
  }

  const now = new Date().toISOString();
  const refreshed = current.map(w => ({ ...w, adpSyncTimestamp: now }));
  saveStoredAdpStaff(refreshed);
  saveStoredAdpConfig({ ...config, lastSyncTimestamp: now });
  return {
    success: true,
    syncedCount: refreshed.length,
    isLive: false,
    message: 'No ADP relay is configured, so no live data was pulled. Add the relay URL under Settings to sync from ADP.'
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

    const pick = (...keys: string[]) => {
      for (const k of keys) if (row[k]) return row[k].trim();
      return '';
    };

    const associateId = pick('associate id', 'adp id', 'worker id');
    const adpId = associateId || pick('file number', 'employee id');

    let firstName = pick('legal first name', 'first name', 'first');
    let lastName = pick('legal last name', 'last name', 'last');
    const rawName = pick('worker name', 'name', 'legal name');
    if (!firstName && !lastName && rawName) {
      if (rawName.includes(',')) {
        const parts = rawName.split(',').map(p => p.trim());
        lastName = parts[0];
        firstName = parts[1] || '';
      } else {
        const parts = rawName.split(/\s+/);
        firstName = parts[0] || '';
        lastName = parts.slice(1).join(' ');
      }
    }
    // Skip rows without an ID or a name rather than inventing values.
    if (!adpId || (!firstName && !lastName)) continue;

    const locationName = pick('campus', 'home work location', 'work location', 'location description', 'location');
    const campus = matchSstCampus(locationName) || '';

    const statusRaw = pick('status', 'employment status', 'position status', 'worker status').toLowerCase();
    const employmentStatus = statusRaw.startsWith('term') || statusRaw === 't'
      ? 'Terminated'
      : statusRaw.includes('leave') || statusRaw === 'l' ? 'Leave of Absence' : 'Active';

    const salary = parseFloat(pick('annual salary', 'salary', 'annual rate amount').replace(/[$,]/g, '')) || 0;
    const workerCategory = pick('worker category', 'worker type', 'employment type').toLowerCase();

    workers.push({
      id: associateId || adpId,
      adpId,
      associateId: associateId || adpId,
      positionId: pick('position id'),
      firstName,
      lastName,
      fullName: `${firstName} ${lastName}`.trim(),
      workEmail: pick('work contact: work email', 'work email', 'email'),
      jobTitle: pick('job title description', 'job title', 'title'),
      department: pick('home department description', 'department'),
      campus,
      location: campus ? locationForCampus(campus) : regionFromLocationName(locationName),
      locationName: locationName || undefined,
      employmentStatus,
      workerType: workerCategory.startsWith('f') ? 'Full-time' : workerCategory.startsWith('p') ? 'Part-time' : undefined,
      hireDate: pick('hire date', 'original hire date'),
      terminationDate: pick('termination date') || undefined,
      annualSalary: salary,
      payFrequency: 'Semi-Monthly',
      supervisorName: pick('reports to name', 'supervisor', 'manager'),
      dpsSid: pick('dps sid') || undefined,
      trsMember: true,
      contractType: 'At-Will',
      adpSyncTimestamp: now,
      alignmentStatus: 'aligned'
    });
  }

  return workers;
}
