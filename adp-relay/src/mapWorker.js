/**
 * Maps an ADP Workforce Now `hr/v2/workers` record to the slim staff record the
 * PAR portal uses. Only the fields a PAR needs leave the relay; everything else
 * in the ADP payload (SSN, birth date, home address, bank data) is dropped here.
 */

function primaryAssignment(worker) {
  const assignments = worker.workAssignments || [];
  return assignments.find(a => a.primaryIndicator) || assignments[0] || {};
}

function findCustomString(worker, fieldName) {
  if (!fieldName) return undefined;
  const wanted = fieldName.toLowerCase();
  const groups = [worker.customFieldGroup, primaryAssignment(worker).customFieldGroup].filter(Boolean);
  for (const group of groups) {
    for (const field of group.stringFields || []) {
      const code = (field.nameCode?.codeValue || '').toLowerCase();
      const name = (field.nameCode?.shortName || field.nameCode?.longName || '').toLowerCase();
      if (code === wanted || name === wanted) return field.stringValue || undefined;
    }
  }
  return undefined;
}

function findCustomIndicator(worker, fieldName) {
  if (!fieldName) return undefined;
  const wanted = fieldName.toLowerCase();
  const groups = [worker.customFieldGroup, primaryAssignment(worker).customFieldGroup].filter(Boolean);
  for (const group of groups) {
    for (const field of group.indicatorFields || []) {
      const code = (field.nameCode?.codeValue || '').toLowerCase();
      const name = (field.nameCode?.shortName || field.nameCode?.longName || '').toLowerCase();
      if (code === wanted || name === wanted) return Boolean(field.indicatorValue);
    }
  }
  return undefined;
}

function mapStatus(worker, assignment) {
  const code = (assignment.assignmentStatus?.statusCode?.codeValue || '').toUpperCase();
  if (code === 'T') return 'Terminated';
  if (code === 'L') return 'Leave of Absence';
  if (code === 'A') return 'Active';
  const workerStatus = (worker.workerStatus?.statusCode?.codeValue || '').toLowerCase();
  if (workerStatus.startsWith('term') || workerStatus === 'inactive') return 'Terminated';
  return 'Active';
}

function mapWorkerType(assignment) {
  const code = (assignment.workerTypeCode?.codeValue || '').toUpperCase();
  const raw = `${code} ${assignment.workerTypeCode?.shortName || ''}`.trim().toLowerCase();
  if (!raw) return null;
  // SST uses SUB (On-Call Substitute) and LTS (Long Term Substitute)
  if (code === 'SUB' || code === 'LTS' || raw.includes('substitute')) return 'Sub';
  if (raw.startsWith('f') || raw.includes('full')) return 'Full-time';
  if (raw.startsWith('p') || raw.includes('part')) return 'Part-time';
  return null;
}

/**
 * @param {object} worker ADP worker record
 * @param {{ dpsSidField?: string, trsField?: string, includeSalary?: boolean }} options
 */
export function mapWorker(worker, options = {}) {
  const assignment = primaryAssignment(worker);
  const legalName = worker.person?.legalName || {};
  const email = (worker.businessCommunication?.emails || []).find(e => e.emailUri)?.emailUri || '';
  const reportsTo = (assignment.reportsTo || [])[0] || {};
  const department = (assignment.homeOrganizationalUnits || []).find(
    u => (u.typeCode?.codeValue || '').toLowerCase().startsWith('department')
  );
  const annual = Number(assignment.baseRemuneration?.annualRateAmount?.amountValue);

  return {
    associateOID: worker.associateOID,
    workerId: worker.workerID?.idValue || worker.associateOID,
    firstName: legalName.givenName || '',
    lastName: legalName.familyName1 || '',
    preferredName: worker.person?.preferredName?.givenName || undefined,
    workEmail: email,
    jobTitle: assignment.jobTitle || assignment.jobCode?.shortName || '',
    positionId: assignment.positionID || '',
    department: department?.nameCode?.shortName || department?.nameCode?.longName || '',
    locationName:
      assignment.homeWorkLocation?.nameCode?.shortName ||
      assignment.homeWorkLocation?.nameCode?.longName ||
      assignment.homeWorkLocation?.nameCode?.codeValue ||
      '',
    status: mapStatus(worker, assignment),
    workerType: mapWorkerType(assignment),
    hireDate: worker.workerDates?.originalHireDate || assignment.hireDate || '',
    terminationDate: worker.workerDates?.terminationDate || assignment.terminationDate || undefined,
    annualSalary: options.includeSalary === false || !Number.isFinite(annual) ? undefined : annual,
    supervisorName: reportsTo.reportsToWorkerName?.formattedName || '',
    supervisorAssociateOID: reportsTo.associateOID || undefined,
    dpsSid: findCustomString(worker, options.dpsSidField),
    trsMember: findCustomIndicator(worker, options.trsField)
  };
}
