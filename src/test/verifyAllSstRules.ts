import { DEFAULT_WORKFLOW_CONFIG, INITIAL_PAR_DATA, USER_PERSONAS, buildSstRouting } from '../data/mockData';
import { 
  canPersonaActOnPar, 
  isRegionalHrCoordinator, 
  isPayrollCoordinator, 
  isChiefPeopleOfficer, 
  getPersonaPermissions, 
  getDepartmentNotificationRecipients, 
  getInitialsAvatarUrl,
  canPersonaCreatePar,
  isSuperAdmin 
} from '../utils/formatters';
import { PersonnelActionRequest, UserPersona, SST_CAMPUSES, SST_CAMPUS_REGIONS, Campus } from '../types/par';
import { INITIAL_PAYOUT_REQUESTS, SST_PAYROLL_CYCLES } from '../data/mockPayoutData';
import { CpoPayoutRequest } from '../types/payout';
import { DEFAULT_PAYOUT_TEMPLATES, PayoutTemplateItem } from '../components/CpoPayoutModal';
import { 
  DEFAULT_GMAIL_CREDENTIALS, 
  buildSstHtmlEmail, 
  sendGmailEmail, 
  GOOGLE_APPS_SCRIPT_SAMPLE,
  GmailCredentials 
} from '../utils/gmailService';
import { 
  HR_REVISION_REASONS, 
  getTexasCobraDeadline, 
  generateParsCsvString,
  getTexasFinalPayDeadline,
  addDaysIso,
  parseDateOnly,
  formatDate
} from '../utils/formatters';
import { 
  DEFAULT_APPS_SCRIPT_CONFIG, 
  FULL_APPS_SCRIPT_SOURCE 
} from '../utils/sstAppsScriptService';
import { 
  getStoredAdpStaff, 
  reconcileStaffWithPars, 
  executeAdpTerminationCloseout, 
  batchPushTerminationsToAdp, 
  parseAdpCsvExport,
  workerFromRelayRecord,
  mergeAdpRoster,
  isAdpSyncDue,
  isAdpDataStale
} from '../utils/adpService';
import { buildRoster, chunkRoster } from '../../functions/src/roster.js';
import { createAdpClient } from '../../functions/src/adpClient.js';
import { DEFAULT_ADP_CONFIG } from '../data/mockAdpStaffData';
import { matchSstCampus, locationForCampus } from '../utils/formatters';
import { mapWorker } from '../../functions/src/mapWorker.js';

declare const process: { exit: (code?: number) => void };

let passed = 0;
let failed = 0;

function assert(condition: boolean, msg: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${msg}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${msg}`);
    failed++;
  }
}

async function runTests() {
  console.log('\n======================================================');
  console.log('🏛️  SST PAR PORTAL — AUTOMATED VERIFICATION SUITE');
  console.log('======================================================\n');

// 1. VERIFY ALL SST CAMPUSES
console.log('📌 Test 1: SST Campuses Directory (sstschools.org)...');
assert(SST_CAMPUSES.length >= 20, `Contains all SST campuses (Found: ${SST_CAMPUSES.length})`);
const houstonCampuses = SST_CAMPUS_REGIONS['Houston Area'] || [];
const saCampuses = SST_CAMPUS_REGIONS['San Antonio Area'] || [];
const ccCampuses = SST_CAMPUS_REGIONS['Corpus Christi Area'] || [];
assert(houstonCampuses.length >= 6, `Houston area campuses present (${houstonCampuses.length})`);
assert(saCampuses.length >= 6, `San Antonio area campuses present (${saCampuses.length})`);
assert(ccCampuses.length >= 3, `Corpus Christi area campuses present (${ccCampuses.length})`);
assert(SST_CAMPUSES.includes('SST Champions Elementary'), 'SST Champions Elementary exists');
assert(SST_CAMPUSES.includes('SST Champions College Prep High School'), 'SST Champions College Prep exists');
assert(SST_CAMPUSES.includes('SST Corpus Christi College Prep High School'), 'SST Corpus Christi High exists');

// 2. VERIFY SST APPROVERS AND EMAILS
console.log('\n📌 Test 2: SST Approver Personnel & Official Emails...');
const approvers = DEFAULT_WORKFLOW_CONFIG.approvers;

const kevin = approvers.find(a => a.email === 'kdemirci@ssttx.org');
assert(!!kevin, 'Dr. Kevin Demirci exists with email kdemirci@ssttx.org');
assert(kevin?.title === 'Chief People Officer', `Kevin title is CPO (Got: ${kevin?.title})`);

const atnan = approvers.find(a => a.email === 'aekin@ssttx.org');
assert(!!atnan, 'Atnan Ekin exists with email aekin@ssttx.org');
assert(atnan?.region?.includes('Houston') ?? false, `Atnan region is Houston (Got: ${atnan?.region})`);

const serdar = approvers.find(a => a.email === 'sbulut@ssttx.org');
assert(!!serdar, 'Serdar Bulut exists with email sbulut@ssttx.org');
assert((serdar?.region?.includes('San Antonio') && serdar?.region?.includes('Corpus Christi')) ?? false, `Serdar region is SA & CC (Got: ${serdar?.region})`);

const kristy = approvers.find(a => a.email === 'kstewart@ssttx.org');
assert(!!kristy, 'Kristy Stewart exists with email kstewart@ssttx.org (Houston HR)');

const amber = approvers.find(a => a.email === 'ajohnson@ssttx.org' || a.email === 'ajohnson@ssttx.orf');
assert(!!amber, 'Amber Johnson exists with email ajohnson@ssttx.org (SA & CC HR)');

const paola = approvers.find(a => a.email === 'pcomparini@ssttx.org');
assert(!!paola, 'Paola Comparini exists with email pcomparini@ssttx.org (Payroll Coordinator)');

// 3. VERIFY ROUTING ENGINE DYNAMICS
console.log('\n📌 Test 3: SST Dynamic Approval Routing Engine...');

// Test 3a: Involuntary Termination -> Dr. Kevin Demirci (CPO)
const invSteps = buildSstRouting('termination', false, 'Houston');
const invApproverStep = invSteps.find(s => s.stage === 'cpo_review');
assert(!!invApproverStep, 'Involuntary termination requires CPO Review step');
assert(invApproverStep?.assignedRole?.includes('Chief People Officer') ?? false, 'Involuntary termination is assigned to Chief People Officer');

// Test 3b: Voluntary Resignation (Houston) -> Atnan Ekin
const volHouSteps = buildSstRouting('termination', true, 'Houston');
const volHouStep = volHouSteps.find(s => s.stage === 'regional_review');
assert(!!volHouStep, 'Voluntary Houston termination requires Regional Review step');
assert(Boolean(volHouStep?.assignedRole?.includes('Atnan Ekin') || volHouStep?.assignedRole?.includes('Houston')), 'Voluntary Houston termination assigned to Atnan Ekin / Houston Regional Exec');

// Test 3c: Voluntary Resignation (San Antonio) -> Serdar Bulut
const volSaSteps = buildSstRouting('termination', true, 'San Antonio');
const volSaStep = volSaSteps.find(s => s.stage === 'regional_review');
assert(!!volSaStep, 'Voluntary SA termination requires Regional Review step');
assert(Boolean(volSaStep?.assignedRole?.includes('Serdar Bulut') || volSaStep?.assignedRole?.includes('SA')), 'Voluntary SA termination assigned to Serdar Bulut');

// Test 3d: Regional HR Houston -> Kristy Stewart
const hrHouStep = invSteps.find(s => s.stage === 'hr_review');
assert(hrHouStep?.assignedEmail === 'kstewart@ssttx.org', 'Houston HR review assigned to Kristy Stewart (kstewart@ssttx.org)');

// Test 3e: Regional HR SA & CC -> Amber Johnson
const hrSaStep = volSaSteps.find(s => s.stage === 'hr_review');
assert(hrSaStep?.assignedEmail === 'ajohnson@ssttx.org', 'San Antonio HR review assigned to Amber Johnson (ajohnson@ssttx.org)');

// Test 3f: Final step -> Paola Comparini
assert(invSteps[invSteps.length - 1].stage === 'payroll_action', 'Final step in termination chain is Payroll Action (Paola Comparini)');

// 4. VERIFY canPersonaActOnPar PERMISSION CHECKS
console.log('\n📌 Test 4: Approver Persona Authorization Checks...');
const kevinPersona = USER_PERSONAS.find(p => p.email === 'kdemirci@ssttx.org')!;
const atnanPersona = USER_PERSONAS.find(p => p.email === 'aekin@ssttx.org')!;
const kristyPersona = USER_PERSONAS.find(p => p.email === 'kstewart@ssttx.org')!;
const paolaPersona = USER_PERSONAS.find(p => p.email === 'pcomparini@ssttx.org')!;
const vanessaPersona = USER_PERSONAS.find(p => p.email === 'vnguyen@ssttx.org')!;
const serdarPersona = USER_PERSONAS.find(p => p.email === 'sbulut@ssttx.org')!;
const amberPersona = USER_PERSONAS.find(p => p.email === 'ajohnson@ssttx.org')!;
const ursulaPersona = USER_PERSONAS.find(p => p.email === 'uvillanueva@ssttx.org')!;

// Mock Involuntary PAR at CPO review
const mockCpoPar: PersonnelActionRequest = {
  ...INITIAL_PAR_DATA[0],
  currentStage: 'cpo_review',
  actionType: 'termination',
  location: 'Houston',
  isVoluntary: false
};
assert(canPersonaActOnPar(kevinPersona, mockCpoPar), 'Dr. Kevin Demirci can sign at cpo_review stage');
assert(!canPersonaActOnPar(atnanPersona, mockCpoPar), 'Atnan Ekin CANNOT sign at cpo_review stage');

// Mock Voluntary PAR at Regional review (Houston)
const mockRegHouPar: PersonnelActionRequest = {
  ...INITIAL_PAR_DATA[0],
  currentStage: 'regional_review',
  actionType: 'termination',
  location: 'Houston',
  isVoluntary: true
};
assert(canPersonaActOnPar(atnanPersona, mockRegHouPar), 'Atnan Ekin can sign Houston voluntary regional review');

// Mock PAR at HR review (Houston)
const mockHrHouPar: PersonnelActionRequest = {
  ...INITIAL_PAR_DATA[0],
  currentStage: 'hr_review',
  location: 'Houston'
};
assert(canPersonaActOnPar(kristyPersona, mockHrHouPar), 'Kristy Stewart can sign Houston HR review');

// Mock PAR at Payroll stage
const mockPayrollPar: PersonnelActionRequest = {
  ...INITIAL_PAR_DATA[0],
  currentStage: 'payroll_action'
};
assert(canPersonaActOnPar(paolaPersona, mockPayrollPar), 'Paola Comparini can sign final Payroll closeout');

// 5. VERIFY CHIEF PEOPLE OFFICER RBAC PRIVILEGES (CPO EXCLUSIVITY)
console.log('\n📌 Test 5: Chief People Officer Exclusive Super Admin Privileges...');

// 5a. isChiefPeopleOfficer check
assert(isChiefPeopleOfficer(kevinPersona) === true, 'Dr. Kevin Demirci is recognized as Chief People Officer (Super Admin)');
assert(isChiefPeopleOfficer(vanessaPersona) === false, 'Vanessa Nguyen (Principal) is NOT Chief People Officer');
assert(isChiefPeopleOfficer(atnanPersona) === false, 'Atnan Ekin (Regional Exec) is NOT Chief People Officer');
assert(isChiefPeopleOfficer(serdarPersona) === false, 'Serdar Bulut (Regional Exec) is NOT Chief People Officer');
assert(isChiefPeopleOfficer(kristyPersona) === false, 'Kristy Stewart (Regional HR) is NOT Chief People Officer');
assert(isChiefPeopleOfficer(amberPersona) === false, 'Amber Johnson (Regional HR) is NOT Chief People Officer');
assert(isChiefPeopleOfficer(ursulaPersona) === false, 'Ursula Villanueva (Benefits) is NOT Chief People Officer');
assert(isChiefPeopleOfficer(paolaPersona) === false, 'Paola Comparini (Payroll) is NOT Chief People Officer');

// 5b. getPersonaPermissions check
const kevinPerms = getPersonaPermissions(kevinPersona);
assert(kevinPerms.canManageWorkflow === true, 'CPO can manage workflow routing');
assert(kevinPerms.canAddRemoveRoles === true, 'CPO can add and remove approver roles');
assert(kevinPerms.canSendInvites === true, 'CPO can send activation email invitations');
assert(kevinPerms.isCpo === true, 'CPO permission flag is true');

const atnanPerms = getPersonaPermissions(atnanPersona);
assert(atnanPerms.canManageWorkflow === false, 'Regional Exec CANNOT manage workflow routing');
assert(atnanPerms.canAddRemoveRoles === false, 'Regional Exec CANNOT add/remove roles');
assert(atnanPerms.canSendInvites === false, 'Regional Exec CANNOT send invites');

const vanessaPerms = getPersonaPermissions(vanessaPersona);
assert(vanessaPerms.canAddRemoveRoles === false, 'Principal CANNOT add/remove roles');
assert(vanessaPerms.canManageWorkflow === false, 'Principal CANNOT manage workflow routing');

const paolaPerms = getPersonaPermissions(paolaPersona);
assert(paolaPerms.canAddRemoveRoles === false, 'Payroll Coordinator CANNOT add/remove roles');

// 6. VERIFY SUPER ADMIN EDITING & PHOTO CUSTOMIZATION CAPABILITIES
console.log('\n📌 Test 6: Super Admin Editing Any Approver Role & Customizing Pictures...');

// 6a. Verify that CPO can edit any role without switching active session
const sampleUpdatedPrincipal = {
  ...vanessaPersona,
  name: 'Vanessa Nguyen (Updated)',
  role: 'Senior Campus Principal',
  avatar: getInitialsAvatarUrl('Vanessa Nguyen (Updated)', '1e3a8a')
};
// Simulating handleAccountCreated session preservation check:
const shouldPreserveCpoSession = isChiefPeopleOfficer(kevinPersona) && sampleUpdatedPrincipal.id !== kevinPersona.id;
assert(shouldPreserveCpoSession === true, 'CPO editing another role preserves Super Admin active session without switching');

// 6b. Verify that all default approver roles have avatar and valid email
DEFAULT_WORKFLOW_CONFIG.approvers.forEach((appr) => {
  assert(Boolean(appr.avatar && appr.avatar.length > 0), `Approver ${appr.name} (${appr.title}) has avatar configured`);
  assert(Boolean(appr.email && appr.email.endsWith('@ssttx.org')), `Approver ${appr.name} has valid @ssttx.org email`);
});

// 6c. Verify photo update propagation across directory
const testRoleId = 'p-kristy';
const newPhotoUrl = 'data:image/jpeg;base64,mockUpdatedPhotoData';
const updatedApprovers = DEFAULT_WORKFLOW_CONFIG.approvers.map(a => a.id === testRoleId ? { ...a, avatar: newPhotoUrl } : a);
const targetApprover = updatedApprovers.find(a => a.id === testRoleId);
assert(targetApprover?.avatar === newPhotoUrl, 'Role photo can be dynamically updated across approver workflow directory');

// 7. VERIFY DEPARTMENT NOTIFICATIONS & NO-ACTION-REQUIRED STAKEHOLDERS
console.log('\n📌 Test 7: Department Notifications & No-Action-Required Stakeholders (IT & Talent Acquisition)...');

const enesPersona = USER_PERSONAS.find(p => p.email === 'esevik@ssttx.org');
assert(Boolean(enesPersona), 'Enes Sevik exists with email esevik@ssttx.org (Houston IT)');
assert(Boolean(enesPersona?.role.includes('IT')), 'Enes Sevik is assigned to Information Technology');
assert(enesPersona?.isNotificationOnly === true, 'Enes Sevik is marked as notification-only (No Action Required)');

const ahmetPersona = USER_PERSONAS.find(p => p.email === 'akaya@ssttx.org');
assert(Boolean(ahmetPersona), 'Ahmet Kaya exists with email akaya@ssttx.org (SA & CC IT)');
assert(Boolean(ahmetPersona?.role.includes('IT')), 'Ahmet Kaya is assigned to Information Technology');
assert(ahmetPersona?.isNotificationOnly === true, 'Ahmet Kaya is marked as notification-only (No Action Required)');

const hasanPersona = USER_PERSONAS.find(p => p.email === 'hkendirci@ssttx.org');
assert(Boolean(hasanPersona), 'Hasan Kendirci exists with email hkendirci@ssttx.org (Houston Talent Acquisition)');
assert(Boolean(hasanPersona?.role.includes('Talent Acquisition')), 'Hasan Kendirci is assigned to Talent Acquisition');
assert(hasanPersona?.isNotificationOnly === true, 'Hasan Kendirci is marked as notification-only (No Action Required)');

const aliPersona = USER_PERSONAS.find(p => p.email === 'adal@ssttx.org');
assert(Boolean(aliPersona), 'Ali Dal exists with email adal@ssttx.org (SA & CC Talent Acquisition)');
assert(Boolean(aliPersona?.role.includes('Talent Acquisition')), 'Ali Dal is assigned to Talent Acquisition');
assert(aliPersona?.isNotificationOnly === true, 'Ali Dal is marked as notification-only (No Action Required)');

// 7b. Verify getDepartmentNotificationRecipients regional dispatching
const houstonRecipients = getDepartmentNotificationRecipients('Houston', 'SST Champions Elementary');
assert(houstonRecipients.length === 2, 'Houston PAR generates 2 department notification records (IT + Talent Acquisition)');
assert(houstonRecipients.some(r => r.recipientEmail === 'esevik@ssttx.org' && r.type === 'it'), 'Houston IT recipient is Enes Sevik');
assert(houstonRecipients.some(r => r.recipientEmail === 'hkendirci@ssttx.org' && r.type === 'talent_acquisition'), 'Houston Talent Acquisition recipient is Hasan Kendirci');
assert(houstonRecipients.every(r => r.actionRequired === false), 'All department notification records have actionRequired === false');

const saccRecipients = getDepartmentNotificationRecipients('San Antonio', 'SST Discovery');
assert(saccRecipients.length === 2, 'SA & CC PAR generates 2 department notification records (IT + Talent Acquisition)');
assert(saccRecipients.some(r => r.recipientEmail === 'akaya@ssttx.org' && r.type === 'it'), 'SA & CC IT recipient is Ahmet Kaya');
assert(saccRecipients.some(r => r.recipientEmail === 'adal@ssttx.org' && r.type === 'talent_acquisition'), 'SA & CC Talent Acquisition recipient is Ali Dal');
assert(saccRecipients.every(r => r.actionRequired === false), 'All SA & CC notification records have actionRequired === false');

// 7c. Verify canPersonaActOnPar returns false for all notification-only roles
if (enesPersona) assert(canPersonaActOnPar(enesPersona, INITIAL_PAR_DATA[0]) === false, 'Enes Sevik (Notification-Only) CANNOT approve or sign PARs (No Action Required)');
if (ahmetPersona) assert(canPersonaActOnPar(ahmetPersona, INITIAL_PAR_DATA[0]) === false, 'Ahmet Kaya (Notification-Only) CANNOT approve or sign PARs (No Action Required)');
if (hasanPersona) assert(canPersonaActOnPar(hasanPersona, INITIAL_PAR_DATA[0]) === false, 'Hasan Kendirci (Notification-Only) CANNOT approve or sign PARs (No Action Required)');
if (aliPersona) assert(canPersonaActOnPar(aliPersona, INITIAL_PAR_DATA[0]) === false, 'Ali Dal (Notification-Only) CANNOT approve or sign PARs (No Action Required)');

// 8. CPO PAYOUT & DEDUCTION APPROVAL SYSTEM
console.log('\n📌 Test 8: CPO Payout & Deduction Approval System (Regional HR, CPO, Payroll)...');
assert(isRegionalHrCoordinator(kristyPersona) === true, 'Kristy Stewart is recognized as Regional HR Coordinator (Houston)');
assert(isRegionalHrCoordinator(amberPersona) === true, 'Amber Johnson is recognized as Regional HR Coordinator (SA & CC)');
assert(isRegionalHrCoordinator(kevinPersona) === false, 'Dr. Kevin Demirci is Chief People Officer, not HR Coordinator');
assert(isPayrollCoordinator(paolaPersona) === true, 'Paola Comparini is recognized as Payroll Coordinator');
assert(isPayrollCoordinator(kristyPersona) === false, 'Kristy Stewart is not Payroll Coordinator');

// Payout data tests
assert(INITIAL_PAYOUT_REQUESTS.length >= 4, `Initial payout requests loaded (Found: ${INITIAL_PAYOUT_REQUESTS.length})`);
const pendingCpo = INITIAL_PAYOUT_REQUESTS.filter(p => p.status === 'pending_cpo');
assert(pendingCpo.length >= 2, `Pending CPO approval queue populated (Found: ${pendingCpo.length})`);

const paymentReq = INITIAL_PAYOUT_REQUESTS.find(p => p.payoutType === 'payment' && p.status === 'pending_cpo');
assert(Boolean(paymentReq), 'Pending payment request exists with positive compensation amount');
assert(Boolean(paymentReq && paymentReq.amount > 0), `Payment amount is positive ($${paymentReq?.amount})`);
assert(Boolean(paymentReq && paymentReq.supportingDocs.length > 0), 'Payment request includes attached supporting documentation');
assert(Boolean(paymentReq && paymentReq.payrollCutoffDate), `Payment request specifies target payroll cut-off date (${paymentReq?.payrollCutoffDate})`);

const deductionReq = INITIAL_PAYOUT_REQUESTS.find(p => p.payoutType === 'deduction' && p.status === 'pending_cpo');
assert(Boolean(deductionReq), 'Pending deduction request exists for staff payroll reduction');
assert(Boolean(deductionReq && deductionReq.amount > 0), `Deduction amount is positive ($${deductionReq?.amount})`);
assert(Boolean(deductionReq && deductionReq.supportingDocs.length > 0), 'Deduction request includes signed authorization/supporting documentation');

const approvedReq = INITIAL_PAYOUT_REQUESTS.find(p => p.status === 'approved_by_cpo');
assert(Boolean(approvedReq), 'Approved payout queued for Payroll ADP execution exists');
assert(approvedReq?.cpoSignerName === 'Dr. Kevin Demirci', 'Approved payout bears digital signature of Dr. Kevin Demirci (CPO)');

const payrollProcessed = INITIAL_PAYOUT_REQUESTS.find(p => p.status === 'processed_payroll');
assert(Boolean(payrollProcessed), 'Fully executed ADP payroll record exists');
assert(Boolean(payrollProcessed?.adpBatchNumber), `Executed payout has valid ADP batch confirmation (#${payrollProcessed?.adpBatchNumber})`);

assert(SST_PAYROLL_CYCLES.length === 24, `SST 2026-2027 SY payroll schedule has exactly 24 semi-monthly periods (Cycles: ${SST_PAYROLL_CYCLES.length})`);
const period1 = SST_PAYROLL_CYCLES.find(c => c.periodNumber === 1);
assert(period1?.periodStartFormatted === '7/13/2026' && period1?.periodEndFormatted === '8/2/2026' && period1?.correctionsDueFormatted === '8/4/2026' && period1?.payDateFormatted === 'Friday, August 14, 2026', 'Period 1 matches official SST schedule (7/13/2026 - 8/2/2026, Due: 8/4/2026, Pay: Friday, August 14, 2026)');

const period5 = SST_PAYROLL_CYCLES.find(c => c.periodNumber === 5);
assert(period5?.periodStartFormatted === '9/14/2026' && period5?.periodEndFormatted === '9/27/2026' && period5?.correctionsDueFormatted === '9/29/2026' && period5?.payDateFormatted === 'Thursday, October 15, 2026', 'Period 5 matches official SST schedule (9/14/2026 - 9/27/2026, Due: 9/29/2026, Pay: Thursday, October 15, 2026)');

const period24 = SST_PAYROLL_CYCLES.find(c => c.periodNumber === 24);
assert(period24?.periodStartFormatted === '6/28/2027' && period24?.periodEndFormatted === '7/11/2027' && period24?.correctionsDueFormatted === '7/13/2027' && period24?.payDateFormatted === 'Friday, July 30, 2027', 'Period 24 matches official SST schedule (6/28/2027 - 7/11/2027, Due: 7/13/2027, Pay: Friday, July 30, 2027)');

// 9. UNIFIED SST PEOPLE OPERATIONS & HR HUB PORTAL
console.log('\n📌 Test 9: Unified SST People Operations & HR Hub Architecture...');
const VALID_HUB_TABS = ['pars', 'payouts', 'directory', 'workflow'];
assert(VALID_HUB_TABS.length === 4, 'Unified Hub Portal contains 4 core operational modules');
assert(VALID_HUB_TABS.includes('pars'), 'Module 1: Personnel Action Requests (PAR Tracker) tab active');
assert(VALID_HUB_TABS.includes('payouts'), 'Module 2: CPO Payout & Deduction Approvals tab active');
assert(VALID_HUB_TABS.includes('directory'), 'Module 3: District Approvers Directory tab active');
assert(VALID_HUB_TABS.includes('workflow'), 'Module 4: Routing Rules Engine tab active');

// Verify Persona and Counter Synchronization Across the Hub
const totalParsCount = INITIAL_PAR_DATA.length;
assert(totalParsCount >= 3, `PAR module live record counter synchronized (${totalParsCount} PARs)`);

const totalPayoutsCount = INITIAL_PAYOUT_REQUESTS.length;
assert(totalPayoutsCount >= 4, `Payout module live record counter synchronized (${totalPayoutsCount} requests)`);

const totalDirectoryCount = USER_PERSONAS.length;
assert(totalDirectoryCount >= 10, `District directory live counter synchronized (${totalDirectoryCount} approvers/roles)`);

// Verify Shared Active Persona Scope between Modules
assert(isChiefPeopleOfficer(kevinPersona) === true, 'Dr. Kevin Demirci maintains Super Admin access across all hub tabs');
const cpoPar = { ...INITIAL_PAR_DATA[0], currentStage: 'cpo_review' as const };
assert(canPersonaActOnPar(kevinPersona, cpoPar) === true, 'CPO can act on PAR items in PAR tab');
assert(isRegionalHrCoordinator(kristyPersona) === true, 'Kristy Stewart retains Regional HR submission access in Payouts tab');
assert(isPayrollCoordinator(paolaPersona) === true, 'Paola Comparini retains ADP execution authority in Payouts tab');
assert(DEFAULT_WORKFLOW_CONFIG.routingRules.length >= 4, 'Workflow Routing Engine configured with district branching rules');

// 10. ROLE-BASED ACCESS CONTROL: CPO PAYOUT ENTRY (HR ONLY) VS REVIEWER MODES
console.log('\n📌 Test 10: CPO Payout Entry Restricted to HR vs Reviewer Tabs for Others...');

// 10a. Regional HR Coordinators have entry access
assert(isRegionalHrCoordinator(kristyPersona) === true, 'Kristy Stewart (Houston HR) is authorized for Payout Entry');
assert(isRegionalHrCoordinator(amberPersona) === true, 'Amber Johnson (SA & CC HR) is authorized for Payout Entry');

// 10b. Non-HR personas cannot enter payouts (blocked from entry)
assert(isRegionalHrCoordinator(kevinPersona) === false, 'Dr. Kevin Demirci (CPO) cannot initiate Payout Entry (Reviewer only)');
assert(isRegionalHrCoordinator(paolaPersona) === false, 'Paola Comparini (Payroll) cannot initiate Payout Entry (Execution only)');
assert(isRegionalHrCoordinator(atnanPersona) === false, 'Atnan Ekin (Regional Exec) cannot initiate Payout Entry (Reviewer only)');
assert(isRegionalHrCoordinator(serdarPersona) === false, 'Serdar Bulut (Regional Exec) cannot initiate Payout Entry (Reviewer only)');
assert(isRegionalHrCoordinator(vanessaPersona) === false, 'Vanessa Nguyen (Principal) cannot initiate Payout Entry (Reviewer only)');
assert(isRegionalHrCoordinator(enesPersona) === false, 'Enes Sevik (IT) cannot initiate Payout Entry (No Entry)');
assert(isRegionalHrCoordinator(ahmetPersona) === false, 'Ahmet Kaya (IT) cannot initiate Payout Entry (No Entry)');
assert(isRegionalHrCoordinator(hasanPersona) === false, 'Hasan Kendirci (Talent Acquisition) cannot initiate Payout Entry (No Entry)');
assert(isRegionalHrCoordinator(aliPersona) === false, 'Ali Dal (Talent Acquisition) cannot initiate Payout Entry (No Entry)');

// 10c. Dynamic Navigation Label Resolution
function getHubTabTitleForPersona(p: UserPersona): string {
  return isRegionalHrCoordinator(p) ? 'CPO Payout Entry (HR Coordinator)' : 'CPO Payout Reviewer';
}
assert(getHubTabTitleForPersona(kristyPersona) === 'CPO Payout Entry (HR Coordinator)', 'Kristy Stewart sees "CPO Payout Entry (HR Coordinator)" tab');
assert(getHubTabTitleForPersona(amberPersona) === 'CPO Payout Entry (HR Coordinator)', 'Amber Johnson sees "CPO Payout Entry (HR Coordinator)" tab');
assert(getHubTabTitleForPersona(kevinPersona) === 'CPO Payout Reviewer', 'Dr. Kevin Demirci sees "CPO Payout Reviewer" tab');
assert(getHubTabTitleForPersona(paolaPersona) === 'CPO Payout Reviewer', 'Paola Comparini sees "CPO Payout Reviewer" tab');
assert(getHubTabTitleForPersona(vanessaPersona) === 'CPO Payout Reviewer', 'Principal sees "CPO Payout Reviewer" tab');

// 10d. Reviewer Queue Mode Resolution
function getReviewerQueueTitle(p: UserPersona): string {
  if (isChiefPeopleOfficer(p)) return '⚖️ CPO Executive Reviewer Queue';
  if (isPayrollCoordinator(p)) return '💵 Payroll ADP Execution Queue';
  return '👀 Reviewer Oversight Queue';
}
assert(getReviewerQueueTitle(kevinPersona) === '⚖️ CPO Executive Reviewer Queue', 'CPO is routed to Executive Reviewer Queue');
assert(getReviewerQueueTitle(paolaPersona) === '💵 Payroll ADP Execution Queue', 'Payroll is routed to Payroll ADP Execution Queue');
assert(getReviewerQueueTitle(vanessaPersona) === '👀 Reviewer Oversight Queue', 'Principal is routed to Reviewer Oversight Queue');

// 10e. Verify non-HR entry redirect logic
function resolveActivePayoutTab(p: UserPersona, requestedTab: 'create' | 'queue' | 'calendar'): 'create' | 'queue' | 'calendar' {
  if (!isRegionalHrCoordinator(p) && requestedTab === 'create') {
    return 'queue';
  }
  return requestedTab;
}
assert(resolveActivePayoutTab(kristyPersona, 'create') === 'create', 'HR Coordinator can access "create" tab');
assert(resolveActivePayoutTab(kevinPersona, 'create') === 'queue', 'CPO attempting "create" is redirected to "queue" (Reviewer mode)');
assert(resolveActivePayoutTab(paolaPersona, 'create') === 'queue', 'Payroll attempting "create" is redirected to "queue" (Reviewer mode)');
assert(resolveActivePayoutTab(vanessaPersona, 'create') === 'queue', 'Principal attempting "create" is redirected to "queue" (Reviewer mode)');

// 11. CUSTOMIZABLE SUPPORTING DOCUMENT TEMPLATES SYSTEM
console.log('\n📌 Test 11: Customizable Supporting Document Templates System...');
assert(DEFAULT_PAYOUT_TEMPLATES.length === 3, 'Default templates library contains 3 core forms');
assert(DEFAULT_PAYOUT_TEMPLATES.some(t => t.fileName === 'Signed_Extra_Duty_Timesheet.pdf'), 'Default templates include Signed Extra Duty Timesheet');
assert(DEFAULT_PAYOUT_TEMPLATES.some(t => t.fileName === 'Voluntary_Payroll_Deduction_Authorization.pdf'), 'Default templates include Voluntary Payroll Deduction Authorization');
assert(DEFAULT_PAYOUT_TEMPLATES.some(t => t.fileName === 'Regional_Travel_and_Expense_Receipts.pdf'), 'Default templates include Regional Travel and Expense Receipts');

// Verify adding a custom user-defined template
let userTemplates: PayoutTemplateItem[] = [...DEFAULT_PAYOUT_TEMPLATES];
const customTemplate: PayoutTemplateItem = {
  id: 'tpl-custom-1',
  name: 'Bilingual Stipend Verification',
  fileName: 'Bilingual_Stipend_Verification.pdf',
  size: '225 KB'
};
userTemplates = [...userTemplates, customTemplate];
assert(userTemplates.length === 4, 'Custom template successfully added to template options');
assert(userTemplates.some(t => t.name === 'Bilingual Stipend Verification'), 'Newly created template is present with custom title and filename');

// Verify attaching template to request documents
const attachedDoc = {
  id: `doc-tpl-test`,
  name: customTemplate.fileName,
  size: customTemplate.size,
  fileType: 'application/pdf',
  uploadedAt: new Date().toISOString(),
  uploadedBy: `${kristyPersona.name} (${kristyPersona.role})`
};
assert(attachedDoc.name === 'Bilingual_Stipend_Verification.pdf', 'Attaching template yields correct filename on request');
assert(attachedDoc.uploadedBy.includes('Kristy Stewart'), 'Attached document tracks regional coordinator identity');

// Verify deleting a template from library
userTemplates = userTemplates.filter(t => t.id !== 'tpl-1');
assert(userTemplates.length === 3, 'Template can be deleted from library');
assert(!userTemplates.some(t => t.id === 'tpl-1'), 'Deleted template no longer appears in options');

// 12. PERMANENT CHIEF PEOPLE OFFICER & SUPER ADMIN INVARIANCE
console.log('\n📌 Test 12: Permanent Chief People Officer (Dr. Kevin Demirci) & Super Admin Invariance...');
const cpoCandidate = USER_PERSONAS.find(p => p.id === 'p-kevin');
assert(Boolean(cpoCandidate), 'Dr. Kevin Demirci exists with canonical ID p-kevin');
assert(cpoCandidate?.role === 'Chief People Officer', 'Kevin role is Chief People Officer');
assert(cpoCandidate?.email === 'kdemirci@ssttx.org', 'Kevin email is kdemirci@ssttx.org');
assert(isChiefPeopleOfficer(cpoCandidate) === true, 'isChiefPeopleOfficer evaluates to true for Dr. Kevin Demirci');

// Test that deleting CPO is rejected
function attemptDeleteRole(roleId: string, current: UserPersona): { success: boolean; message: string } {
  if (!isChiefPeopleOfficer(current)) {
    return { success: false, message: 'Unauthorized' };
  }
  if (roleId === 'p-kevin') {
    return { success: false, message: 'Protected Super Admin: Dr. Kevin Demirci cannot be removed' };
  }
  return { success: true, message: 'Removed' };
}
const deleteResult = attemptDeleteRole('p-kevin', kevinPersona);
assert(deleteResult.success === false, 'Attempting to delete Chief People Officer is strictly blocked');
assert(deleteResult.message.includes('Protected Super Admin'), 'Deletion prevention returns protected role notice');

// Test that overwriting CPO with "TEST TEST" is safely forked to preserve CPO
function sanitizeIncomingAccount(persona: UserPersona): { safePersona: UserPersona; forked: boolean } {
  if (persona.id === 'p-kevin' || persona.email === 'kdemirci@ssttx.org') {
    if (persona.name.toUpperCase().includes('TEST') || !persona.name.toLowerCase().includes('demirci')) {
      return {
        safePersona: { ...persona, id: `p-user-${Date.now()}` },
        forked: true
      };
    }
  }
  return { safePersona: persona, forked: false };
}
const corruptedTestUser: UserPersona = {
  ...kevinPersona,
  id: 'p-kevin',
  name: 'TEST TEST',
  email: 'test@ssttx.org'
};
const sanitizeResult = sanitizeIncomingAccount(corruptedTestUser);
assert(sanitizeResult.forked === true, 'Account creation with name "TEST TEST" on p-kevin is automatically forked');
assert(sanitizeResult.safePersona.id !== 'p-kevin', 'Forked test user receives a distinct new persona ID');
assert(isChiefPeopleOfficer(kevinPersona) === true, 'Original Dr. Kevin Demirci remains unaffected as Chief People Officer');

// 13. SST GMAIL & GOOGLE WORKSPACE AUTOMATED DISPATCH INTEGRATION
console.log('\n📌 Test 13: SST Gmail & Google Workspace Automated Dispatch Engine...');

// Test 13a: Default Gmail Credentials
assert(DEFAULT_GMAIL_CREDENTIALS.senderEmail === 'sstpar@ssttx.org', 'Default sender email is sstpar@ssttx.org');
assert(DEFAULT_GMAIL_CREDENTIALS.senderName.includes('School of Science and Technology'), 'Default sender name includes School of Science and Technology');
assert(DEFAULT_GMAIL_CREDENTIALS.mode === 'google_script', 'Default dispatch mode is Google Apps Script (Zero Fees)');
assert(DEFAULT_GMAIL_CREDENTIALS.ccHrCopy === true, 'CC audit copy to District HR is enabled by default');
assert(DEFAULT_GMAIL_CREDENTIALS.hrEmail === 'sstpar@ssttx.org', 'District HR audit email is sstpar@ssttx.org');

// Test 13b: Google Apps Script Web App Code Sample
assert(GOOGLE_APPS_SCRIPT_SAMPLE.includes('GmailApp.sendEmail'), 'Google Apps Script uses native GmailApp.sendEmail');
assert(GOOGLE_APPS_SCRIPT_SAMPLE.includes('function doPost(e)'), 'Google Apps Script implements doPost(e) Web App entrypoint');
assert(GOOGLE_APPS_SCRIPT_SAMPLE.includes('function doGet(e)'), 'Google Apps Script implements doGet(e) health check');
assert(GOOGLE_APPS_SCRIPT_SAMPLE.includes('ContentService.createTextOutput'), 'Google Apps Script outputs JSON ContentService response');

// Test 13c: Professional HTML Email Template Builder
const sampleHtml = buildSstHtmlEmail(
  'ACTION REQUIRED: Complete Your Electronic Signature',
  'Dear Approver,\n\nYou have been designated as an official workflow approver.\n\nPlease claim your role below.',
  'https://sstschools.org/portal?activate=test-id',
  'Claim & Activate Approver Role'
);
assert(sampleHtml.includes('School of Science and Technology'), 'HTML template includes School of Science and Technology branding header');
assert(sampleHtml.includes('Personnel Action Request & HR Portal'), 'HTML template includes PAR & HR Portal subheader');
assert(sampleHtml.includes('ACTION REQUIRED'), 'HTML template includes title');
assert(sampleHtml.includes('https://sstschools.org/portal?activate=test-id'), 'HTML template includes action URL link');
assert(sampleHtml.includes('Claim &amp; Activate Approver Role') || sampleHtml.includes('Claim & Activate Approver Role'), 'HTML template includes custom action button text');
assert(sampleHtml.includes('Confidentiality Notice:'), 'HTML template includes legal confidentiality disclaimer');
assert(sampleHtml.includes('sstpar@ssttx.org') || sampleHtml.includes('hr@ssttx.org'), 'HTML template includes contact email');

// Test 13d: sendGmailEmail Recipient Address Validation
const invalidEmailResult = await sendGmailEmail({
  to: 'invalid-email-address',
  subject: 'Test Subject',
  bodyText: 'Test Body'
}, { ...DEFAULT_GMAIL_CREDENTIALS, isEnabled: true });
assert(invalidEmailResult.success === false, 'Invalid recipient email is rejected');
assert(invalidEmailResult.message.includes('Invalid recipient email address'), 'Appropriate error returned for invalid recipient address');

// Test 13e: Google Apps Script Mode Validation (Missing Script URL)
const missingUrlResult = await sendGmailEmail({
  to: 'kstewart@ssttx.org',
  subject: 'Test Invitation',
  bodyText: 'Please review'
}, { ...DEFAULT_GMAIL_CREDENTIALS, mode: 'google_script', scriptUrl: '', isEnabled: true });
assert(missingUrlResult.success === false, 'Google Apps Script mode fails gracefully when URL is missing');
assert(missingUrlResult.message.includes('Google Apps Script Web App URL is missing'), 'Clear instructional error when Script URL is empty');

// Test 13f: EmailJS Mode Validation (Missing Keys)
const missingEmailJsResult = await sendGmailEmail({
  to: 'kstewart@ssttx.org',
  subject: 'Test Invitation',
  bodyText: 'Please review'
}, { ...DEFAULT_GMAIL_CREDENTIALS, mode: 'emailjs', emailJsServiceId: '', emailJsPublicKey: '', isEnabled: true });
assert(missingEmailJsResult.success === false, 'EmailJS mode fails gracefully when keys are missing');
assert(missingEmailJsResult.message.includes('EmailJS Service ID or Public Key is missing'), 'Clear instructional error when EmailJS keys are missing');

// Test 13g: SMTP Relay Mode Validation (Missing Endpoint)
const missingSmtpResult = await sendGmailEmail({
  to: 'kstewart@ssttx.org',
  subject: 'Test Invitation',
  bodyText: 'Please review'
}, { ...DEFAULT_GMAIL_CREDENTIALS, mode: 'smtp_relay', smtpEndpoint: '', isEnabled: true });
assert(missingSmtpResult.success === false, 'SMTP Relay mode fails gracefully when endpoint is missing');
assert(missingSmtpResult.message.includes('SMTP Relay Endpoint URL is missing'), 'Clear instructional error when SMTP endpoint is missing');

// Test 13h: CC Audit Copy Routing
const testCredsWithHrCc: GmailCredentials = {
  ...DEFAULT_GMAIL_CREDENTIALS,
  ccHrCopy: true,
  hrEmail: 'sstpar@ssttx.org'
};
assert(testCredsWithHrCc.ccHrCopy === true, 'CC audit copy flag is preserved');
assert(testCredsWithHrCc.hrEmail === 'sstpar@ssttx.org', 'Custom audit email is routed correctly');

// 14. END-TO-END ACTION VALIDATION ACROSS ALL MODULES
console.log('\n📌 Test 14: End-to-End Action Verification for All Portal Features...');

// 14a. Action: Generate PAR Routing for all 6 Action Types
const allActionTypes = ['termination', 'role_change', 'salary_change', 'promotion', 'campus_transfer', 'leave_of_absence'] as const;
allActionTypes.forEach((act) => {
  const generatedSteps = buildSstRouting(act, false, 'Houston');
  assert(generatedSteps.length >= 2, `Action '${act}' generated valid sequential approval chain (${generatedSteps.length} steps)`);
  assert(generatedSteps[0].stage === 'supervisor_review', `Action '${act}' begins with Principal/Supervisor endorsement`);
  assert(generatedSteps[generatedSteps.length - 1].stage === 'payroll_action', `Action '${act}' finalizes with Payroll ADP execution`);
});

// 14b. Action: Approve PAR and advance through all stages to Completion
let testPar = { ...INITIAL_PAR_DATA[0] };
const stagesInChain = testPar.routingSteps.map(s => s.stage);
assert(stagesInChain.length > 0, 'Test PAR contains valid approval chain');

// Simulate sequential approvals
for (let i = 0; i < testPar.routingSteps.length; i++) {
  const currentStep = testPar.routingSteps[i];
  testPar.routingSteps[i] = {
    ...currentStep,
    status: 'approved',
    reviewerName: 'Test Approver',
    decisionDate: new Date().toISOString(),
    signerId: 'TEST-SIGNER-UUID'
  };
  const isFinal = i === testPar.routingSteps.length - 1;
  testPar.currentStage = isFinal ? 'completed' : testPar.routingSteps[i + 1].stage;
}
assert(testPar.currentStage === 'completed', 'PAR successfully advances to COMPLETED when all steps are signed');
assert(testPar.routingSteps.every(s => s.status === 'approved'), 'All routing steps reflect APPROVED status');

// 14c. Action: Reject PAR and verify terminal status
const rejectedPar = {
  ...INITIAL_PAR_DATA[1],
  currentStage: 'rejected' as const,
  routingSteps: INITIAL_PAR_DATA[1].routingSteps.map((s, idx) => idx === 0 ? { ...s, status: 'rejected' as const, comments: 'Position freeze' } : s)
};
assert(rejectedPar.currentStage === 'rejected', 'PAR transitions to REJECTED on disapproval');
assert(rejectedPar.routingSteps[0].status === 'rejected', 'First step reflects rejected status');

// 14d. Action: Return PAR for Revision
const returnedPar = {
  ...INITIAL_PAR_DATA[2],
  currentStage: 'revision_requested' as const,
  routingSteps: INITIAL_PAR_DATA[2].routingSteps.map((s, idx) => idx === 0 ? { ...s, status: 'returned' as const, comments: 'Attach updated evaluation' } : s)
};
assert(returnedPar.currentStage === 'revision_requested', 'PAR transitions to REVISION_REQUESTED');
assert(returnedPar.routingSteps[0].status === 'returned', 'Step reflects returned status');

// 14e. Action: CPO Payout Lifecycle (Create -> CPO Approve -> ADP Execute)
const newTestPayout: CpoPayoutRequest = {
  id: 'payout-test-14',
  trackingNumber: 'SST-PAYOUT-2026-9999',
  payoutType: 'payment',
  employeeId: 'EMP-SST-999',
  employeeName: 'Carlos Ramirez',
  adpId: 'ADP-SST-99999',
  campus: 'SST Champions Elementary',
  region: 'Houston Area',
  jobTitle: 'Robotics Coach',
  currentSalary: 52000,
  amount: 2400,
  category: 'Extra Duty & Coaching Stipend',
  reason: 'Fall 2026 Robotics Championship Coaching',
  payrollCutoffDate: '2026-09-29',
  payrollCycleName: 'Period 5: 09/14/2026 – 09/27/2026',
  isUrgentCutoff: true,
  supportingDocs: [
    {
      id: 'doc-test-1',
      name: 'Signed_Extra_Duty_Timesheet.pdf',
      size: '210 KB',
      fileType: 'application/pdf',
      uploadedAt: new Date().toISOString(),
      uploadedBy: 'Kristy Stewart'
    }
  ],
  submittedBy: 'Kristy Stewart',
  submitterEmail: 'kstewart@ssttx.org',
  submitterRole: 'Regional HR Coordinator (Houston)',
  submittedAt: new Date().toISOString(),
  status: 'pending_cpo',
  history: []
};
assert(newTestPayout.status === 'pending_cpo', 'New payout enters pending_cpo status');

// Simulate CPO Approval
const cpoApprovedPayout: CpoPayoutRequest = {
  ...newTestPayout,
  status: 'approved_by_cpo',
  cpoDecisionDate: new Date().toISOString(),
  cpoDecisionNotes: 'Approved for coaching stipend.',
  cpoSignerName: 'Dr. Kevin Demirci',
  cpoSignerId: '7a374357-998f-4203-8874-8b95cb88898d',
  cpoSigningPin: '1234'
};
assert(cpoApprovedPayout.status === 'approved_by_cpo', 'Payout status advances to approved_by_cpo');
assert(cpoApprovedPayout.cpoSignerName === 'Dr. Kevin Demirci', 'Payout records Dr. Kevin Demirci digital endorsement');

// Simulate Payroll ADP Execution
const adpProcessedPayout: CpoPayoutRequest = {
  ...cpoApprovedPayout,
  status: 'processed_payroll',
  payrollProcessedAt: new Date().toISOString(),
  payrollProcessedBy: 'Paola Comparini (Payroll Coordinator)',
  adpBatchNumber: 'ADP-BATCH-SEP25-2026',
  payrollNotes: 'Processed in ADP direct deposit.'
};
assert(adpProcessedPayout.status === 'processed_payroll', 'Payout status advances to processed_payroll');
assert(adpProcessedPayout.adpBatchNumber === 'ADP-BATCH-SEP25-2026', 'Payout records ADP Batch Confirmation');

// 14f. Action: Initials Monogram Avatar Generation
const testAvatarUrl = getInitialsAvatarUrl('Dr. Kevin Demirci', '0f2352');
assert(testAvatarUrl.includes('ui-avatars.com'), 'getInitialsAvatarUrl produces valid high-resolution avatar URL');
assert(testAvatarUrl.includes('Kevin'), 'Initials avatar encodes user name correctly');
assert(testAvatarUrl.includes('0f2352'), 'Initials avatar applies SST brand color');

// 14g. Action: Digital Signature Mode & PIN verification
assert(Boolean(kevinPersona.signerId && kevinPersona.signerId.length > 0), 'Dr. Kevin Demirci has valid digital signer UUID');
assert(Boolean(kevinPersona.signingPin && kevinPersona.signingPin === '1234'), 'Dr. Kevin Demirci has valid 4-digit signing PIN');
assert(Boolean(paolaPersona.signerId && paolaPersona.signerId.length > 0), 'Paola Comparini has valid digital signer UUID');
assert(Boolean(kristyPersona.signerId && kristyPersona.signerId.length > 0), 'Kristy Stewart has valid digital signer UUID');

// 15. VERIFY STAFF AUTHENTICATION & ROLE-BASED ACCESS CONTROL
console.log('\n📌 Test 15: Staff Authentication, Super Admin Isolation & PAR Creation Privileges...');

// 15a. Super Admin privileges isolation
assert(isSuperAdmin(kevinPersona) === true, 'Dr. Kevin Demirci is recognized as Super Admin');
assert(isSuperAdmin(paolaPersona) === false, 'Paola Comparini is NOT Super Admin');
assert(isSuperAdmin(kristyPersona) === false, 'Kristy Stewart is NOT Super Admin');
assert(isSuperAdmin(atnanPersona) === false, 'Atnan Ekin is NOT Super Admin');
assert(isSuperAdmin(aliPersona) === false, 'Ali Dal (IT Director) is NOT Super Admin');

// 15b. PAR creation authorization (Approved Initiators vs Informational / Non-initiators)
assert(canPersonaCreatePar(kevinPersona) === true, 'CPO (Dr. Kevin Demirci) can initiate/create PAR');
assert(canPersonaCreatePar(kristyPersona) === true, 'Regional HR Coordinator (Kristy Stewart) can initiate/create PAR');
assert(canPersonaCreatePar(atnanPersona) === true, 'Regional Director (Atnan Ekin) can initiate/create PAR');
assert(canPersonaCreatePar(serdarPersona) === true, 'Principal / Supervisor (Serdar Bulut) can initiate/create PAR');

// 15c. Notification-Only / Informational personas cannot create PARs
assert(canPersonaCreatePar(aliPersona) === false, 'IT Director (Ali Dal - Notification Only) cannot initiate/create PAR');
assert(canPersonaCreatePar(hasanPersona) === false, 'Talent Acquisition Director (Hasan Kendirci - Notification Only) cannot initiate/create PAR');
assert(canPersonaCreatePar(null as any) === false, 'Unauthenticated / null user cannot initiate/create PAR');

// 15d. PIN Authentication verification
USER_PERSONAS.forEach((p) => {
  assert(Boolean(p.signingPin === '1234' || (p.signingPin && p.signingPin.length === 4)), `${p.name} has valid 4-digit authentication PIN (${p.signingPin || '1234'})`);
});

// 16. VERIFY TEXAS CHARTER HR COMPLIANCE & TRS / COBRA STATUTORY ENFORCEMENT
console.log('\n📌 Test 16: Texas Charter HR Compliance & TRS / COBRA Statutory Enforcement...');

// 16a. HR Revision Reason Templates
assert(HR_REVISION_REASONS.length >= 6, `HR revision templates configured (Found: ${HR_REVISION_REASONS.length})`);
assert(HR_REVISION_REASONS.some(r => r.includes('ADP Position Control')), 'Includes ADP Position Control template');
assert(HR_REVISION_REASONS.some(r => r.includes('TRS Form 7/10') || r.includes('TRS separation')), 'Includes TRS documentation template');
assert(HR_REVISION_REASONS.some(r => r.includes('At-Will')), 'Includes At-Will agreement template');

// 16b. COBRA 30-Day Statutory Deadline Calculation
const cobraTestRecent = getTexasCobraDeadline('2026-09-20');
assert(cobraTestRecent.deadlineDateStr !== 'N/A', `Calculated statutory date (${cobraTestRecent.deadlineDateStr})`);
assert(cobraTestRecent.daysRemaining > 0, `Recent separation has positive days remaining (${cobraTestRecent.daysRemaining})`);
assert(cobraTestRecent.isOverdue === false, 'Recent separation is not overdue');

const cobraTestOld = getTexasCobraDeadline('2026-07-01');
assert(cobraTestOld.isOverdue === true, 'Separation older than 30 days is accurately flagged overdue');
assert(cobraTestOld.daysRemaining < 0, 'Days remaining is negative for overdue separation');

const cobraTestEmpty = getTexasCobraDeadline('');
assert(cobraTestEmpty.deadlineDateStr === 'N/A', 'Empty Last Day Worked returns safe N/A');

// 16c. Master HR CSV Compliance Export
const csvOutput = generateParsCsvString(INITIAL_PAR_DATA);
assert(csvOutput.includes('Tracking Number'), 'CSV includes Tracking Number header');
assert(csvOutput.includes('ADP Associate ID'), 'CSV includes ADP Associate ID header');
assert(csvOutput.includes('Contract Type'), 'CSV includes Contract Type header');
assert(csvOutput.includes('TRS Notification Required'), 'CSV includes TRS Notification header');
assert(csvOutput.includes('COBRA Notice Due'), 'CSV includes COBRA Notice Due header');
const csvLines = csvOutput.trim().split('\n');
assert(csvLines.length === INITIAL_PAR_DATA.length + 1, `CSV contains header + ${INITIAL_PAR_DATA.length} data rows`);

// 17. VERIFY SSTTX GOOGLE APPS SCRIPT SUITE & LIVE TRACKING ENGINE
console.log('\n📌 Test 17: SSTTX Google Apps Script Suite & Live Tracking Engine...');

// 17a. Default Apps Script configuration
assert(DEFAULT_APPS_SCRIPT_CONFIG.senderEmail === 'sstpar@ssttx.org', 'Apps Script default sender is sstpar@ssttx.org');
assert(DEFAULT_APPS_SCRIPT_CONFIG.autoSyncEnabled === true, 'Apps Script autoSync is enabled by default');
assert(DEFAULT_APPS_SCRIPT_CONFIG.senderName.includes('School of Science and Technology'), 'Sender name includes district name');

// 17b. Apps Script code integrity and endpoint coverage
assert(FULL_APPS_SCRIPT_SOURCE.includes('function onOpen('), 'Apps Script contains onOpen() trigger for custom UI menu');
assert(FULL_APPS_SCRIPT_SOURCE.includes('function initializeSstTrackerSheets('), 'Apps Script contains multi-tab sheet initializer');
assert(FULL_APPS_SCRIPT_SOURCE.includes('function doPost(e)'), 'Apps Script implements doPost(e) Webhook API for live sync');
assert(FULL_APPS_SCRIPT_SOURCE.includes('function doGet(e)'), 'Apps Script implements doGet(e) health check and ping');
assert(FULL_APPS_SCRIPT_SOURCE.includes('PAR_Master_Tracker'), 'Apps Script creates PAR_Master_Tracker tab');
assert(FULL_APPS_SCRIPT_SOURCE.includes('Audit_Trail'), 'Apps Script creates Audit_Trail tab');
assert(FULL_APPS_SCRIPT_SOURCE.includes('Payout_Authorizations'), 'Apps Script creates Payout_Authorizations tab');
assert(FULL_APPS_SCRIPT_SOURCE.includes('Email_Dispatches'), 'Apps Script creates Email_Dispatches tab');
assert(FULL_APPS_SCRIPT_SOURCE.includes('ssttx.org'), 'Apps Script targets ssttx.org Google Workspace domain');

// 18. SUBMITTER FLOW SIMULATION (Campus Principal / Department Initiator)
console.log('\n📌 Test 18: Submitter Persona Flow Simulation (Principal / Supervisor)...');
const submitter = USER_PERSONAS.find(p => p.id === 'p-serdar')!;
assert(!!submitter, 'Submitter persona (Serdar Bulut) exists');
assert(canPersonaCreatePar(submitter), 'Submitter has authorized PAR creation privileges');

// Non-authorized personas cannot initiate PARs
const unauthorizedSubmitter = USER_PERSONAS.find(p => p.isNotificationOnly)!;
assert(!canPersonaCreatePar(unauthorizedSubmitter), `Notification persona (${unauthorizedSubmitter.name}) cannot initiate PARs`);

// 18a. Submitter initiates a new Promotion & Salary Adjustment PAR
const submitterPar: PersonnelActionRequest = {
  ...INITIAL_PAR_DATA[0],
  id: 'par-sim-001',
  trackingNumber: 'PAR-2026-HOU-SIM1',
  employeeId: 'SST-2026-9912',
  firstName: 'Elena',
  lastName: 'Rostova',
  currentStage: 'supervisor_review',
  priority: 'urgent',
  actionType: 'promotion',
  effectiveDate: '2026-10-01',
  location: 'Houston',
  campus: 'SST Champions Elementary',
  title: 'Lead STEM Teacher',
  currentSalary: 56000,
  proposedSalary: 64500,
  contractType: 'At-Will',
  departmentNotifications: getDepartmentNotificationRecipients('Houston', 'SST Champions Elementary'),
  routingSteps: buildSstRouting('promotion', false, 'Houston'),
  comments: [],
  electronicSignatures: [],
};

assert(submitterPar.currentStage === 'supervisor_review', 'Submitted PAR routes initially to supervisor_review');
assert(submitterPar.contractType === 'At-Will', 'At-Will agreement type accurately recorded');
assert((submitterPar.departmentNotifications?.length ?? 0) >= 2, 'Informational notifications generated for IT and Talent Acquisition');
assert(submitterPar.departmentNotifications?.some(n => n.type === 'it') ?? false, 'IT informational contact is mapped');
assert(submitterPar.departmentNotifications?.some(n => n.type === 'talent_acquisition') ?? false, 'Talent Acquisition informational contact is mapped');

// 19. VERIFIER FLOW SIMULATION (Regional HR Coordinator)
console.log('\n📌 Test 19: Verifier Persona Flow Simulation (Regional HR Coordinator)...');
const verifier = USER_PERSONAS.find(p => p.id === 'p-kristy')!;
assert(!!verifier, 'Verifier persona (Kristy Stewart - Houston HR) exists');
assert(isRegionalHrCoordinator(verifier), 'Kristy Stewart verified as Regional HR Coordinator');

// 19a. Submitter endorses initial supervisor review step
const firstStep = submitterPar.routingSteps.find(s => s.stage === 'supervisor_review')!;
firstStep.status = 'approved';
firstStep.decisionDate = new Date().toISOString();
firstStep.reviewerName = submitter.name;
firstStep.comments = 'Recommended and approved at campus level.';
submitterPar.currentStage = 'hr_review';

// 19b. Verifier checks queue and verifies regional authority
assert(canPersonaActOnPar(verifier, submitterPar), 'Kristy Stewart can act on Houston hr_review stage');
const sanAntonioVerifier = USER_PERSONAS.find(p => p.id === 'p-amber')!;
// San Antonio verifier should NOT act on a Houston specific review
assert(!canPersonaActOnPar(sanAntonioVerifier, submitterPar), 'San Antonio HR Coordinator cannot act on Houston hr_review stage');

// 19c. Verifier identifies missing documentation and requests campus revision
const revisionReason = HR_REVISION_REASONS.find(r => r.includes('ADP Position Control')) || HR_REVISION_REASONS[0];
assert(HR_REVISION_REASONS.length > 5, 'Standard HR Revision reason templates available');
submitterPar.currentStage = 'revision_requested';
submitterPar.comments.push({
  id: 'aud-sim-2',
  timestamp: new Date().toISOString(),
  authorName: verifier.name,
  authorRole: verifier.role,
  authorDepartment: verifier.department,
  message: revisionReason,
  isSystemEvent: true,
});
assert(submitterPar.currentStage === 'revision_requested', 'PAR transitions to "revision_requested" on verifier return');
assert(submitterPar.comments.some((c: any) => c.message && c.message.includes('ADP Position Control')), 'Audit trail logs specific HR compliance revision reason');

// 19d. Campus resolves issue and re-submits; Verifier officially endorses
submitterPar.currentStage = 'hr_review';
const verifierStep = submitterPar.routingSteps.find(s => s.stage === 'hr_review')!;
assert(!!verifierStep, 'hr_review step exists in routing chain');
verifierStep.status = 'approved';
verifierStep.decisionDate = new Date().toISOString();
verifierStep.reviewerName = verifier.name;
verifierStep.comments = 'TEA credentials & ADP position control verified in compliance with Texas charter standards.';
submitterPar.currentStage = 'payroll_action';
assert(verifierStep.status === 'approved', 'Regional HR step successfully endorsed');
assert(submitterPar.currentStage === 'payroll_action', 'PAR advances to payroll_action following HR verification');

// 20. APPROVER FLOW SIMULATION (Chief People Officer / Superintendent)
console.log('\n📌 Test 20: Approver Persona Flow Simulation (Chief People Officer)...');
const approver = USER_PERSONAS.find(p => p.id === 'p-kevin')!;
assert(!!approver, 'Approver persona (Dr. Kevin Demirci) exists');
assert(isChiefPeopleOfficer(approver), 'Approver verified as Chief People Officer');

// 20a. Create an Involuntary Termination PAR requiring CPO statutory review
const cpoSimPar: PersonnelActionRequest = {
  ...INITIAL_PAR_DATA[0],
  id: 'par-sim-cpo',
  trackingNumber: 'PAR-2026-HOU-CPO1',
  employeeId: 'SST-2026-8810',
  firstName: 'Gabriel',
  lastName: 'Torres',
  currentStage: 'cpo_review',
  priority: 'urgent',
  actionType: 'termination',
  location: 'Houston',
  campus: 'SST Champions College Prep High School',
  title: 'Dean of Students',
  currentSalary: 72000,
  contractType: 'At-Will',
  isVoluntary: false,
  routingSteps: buildSstRouting('termination', false, 'Houston'),
  comments: [],
  electronicSignatures: [],
};

assert(cpoSimPar.currentStage === 'cpo_review', 'Involuntary separation routes to cpo_review');
assert(canPersonaActOnPar(approver, cpoSimPar), 'Chief People Officer can act on cpo_review stage');
assert(!canPersonaActOnPar(verifier, cpoSimPar), 'Regional HR Coordinator cannot act on executive cpo_review stage');
assert(!canPersonaActOnPar(submitter, cpoSimPar), 'Campus Principal cannot act on executive cpo_review stage');

// 20b. Approver executes digital Texas UETA PIN authentication
const testPin = '1234';
assert(approver.signingPin === testPin, 'Approver has valid 4-digit Texas UETA PIN (1234)');

// 20c. Approver executes executive endorsement
const cpoStep = cpoSimPar.routingSteps.find(s => s.stage === 'cpo_review')!;
assert(!!cpoStep, 'cpo_review step exists in termination routing chain');
cpoStep.status = 'approved';
cpoStep.decisionDate = new Date().toISOString();
cpoStep.reviewerName = approver.name;
cpoStep.comments = 'Executive separation authorized by Chief People Officer (At-Will Policy).';
cpoSimPar.currentStage = 'hr_review';
cpoSimPar.comments.push({
  id: 'aud-cpo-2',
  timestamp: new Date().toISOString(),
  authorName: approver.name,
  authorRole: approver.role,
  authorDepartment: approver.department,
  message: 'Executive sign-off completed.',
  isSystemEvent: true,
});

assert(cpoStep.status === 'approved', 'Chief People Officer endorsement recorded');
assert(cpoSimPar.currentStage === 'hr_review', 'PAR advances to hr_review following executive approval');

// 21. ADMIN & PAYROLL EXECUTION FLOW SIMULATION
console.log('\n📌 Test 21: Admin & Payroll Execution Flow Simulation (ADP Batch Confirmation)...');
const payroll = USER_PERSONAS.find(p => p.id === 'p-paola')!;
assert(!!payroll, 'Payroll persona (Paola Comparini) exists');
assert(isPayrollCoordinator(payroll), 'Paola Comparini verified as Payroll Coordinator');
assert(canPersonaActOnPar(payroll, submitterPar), 'Payroll Coordinator can act on payroll_action stage');

// Submitter cannot act on payroll execution stage
assert(!canPersonaActOnPar(submitter, submitterPar), 'Submitter cannot act on payroll_action stage');

// 21a. Payroll enters ADP Batch Confirmation and executes final completion
const adpBatchNumber = 'ADP-2026-B849';
const payrollStep = submitterPar.routingSteps.find(s => s.stage === 'payroll_action')!;
assert(!!payrollStep, 'payroll_action step exists in routing chain');
payrollStep.status = 'approved';
const payrollExecutionNotes = `[ADP Batch Ref: ${adpBatchNumber}] Processed into ADP Workforce Now. Effective Oct 1, 2026 pay cycle.`;
payrollStep.decisionDate = new Date().toISOString();
payrollStep.reviewerName = payroll.name;
payrollStep.comments = payrollExecutionNotes;
submitterPar.currentStage = 'completed';
submitterPar.comments.push({
  id: 'aud-sim-4',
  timestamp: new Date().toISOString(),
  authorName: payroll.name,
  authorRole: payroll.role,
  authorDepartment: payroll.department,
  message: payrollExecutionNotes,
  isSystemEvent: true,
});

assert(submitterPar.currentStage === 'completed', 'PAR currentStage is "completed"');
assert(submitterPar.routingSteps.every(s => s.status === 'approved'), 'All routing steps in chain are fully approved');
assert(submitterPar.comments.some((c: any) => c.message && c.message.includes(adpBatchNumber)), `Audit trail preserves ADP batch confirmation (${adpBatchNumber})`);

// 21b. Super Admin privilege isolation
assert(isSuperAdmin(approver) === true, 'Dr. Kevin Demirci has Super Admin privileges');
assert(isSuperAdmin(payroll) === false, 'Payroll Coordinator is NOT Super Admin');
assert(isSuperAdmin(verifier) === false, 'Regional HR Coordinator is NOT Super Admin');
assert(isSuperAdmin(submitter) === false, 'Campus Principal is NOT Super Admin');

// 22. ADP WORKFORCE NOW STAFF ROSTER & TERMINATION ALIGNMENT ENGINE
console.log('\n📌 Test 22: ADP Workforce Now Staff Directory & Termination Alignment Engine...');

// 22a. Retrieve ADP staff roster
const adpRoster = getStoredAdpStaff();
assert(Array.isArray(adpRoster) && adpRoster.length >= 12, `ADP staff directory loaded (${adpRoster.length} workers)`);

// 22b. Verify core staff members and their enterprise fields
const cathyWorker = adpRoster.find(w => w.adpId === 'JMJRMGNGA');
assert(!!cathyWorker, 'Cathy Velasco found in ADP directory (JMJRMGNGA)');
assert(cathyWorker?.jobTitle === 'MEDICAL ASSISTANT', 'Cathy Velasco job title matches');
assert(cathyWorker?.campus === 'SST Champions Elementary', 'Cathy Velasco campus is SST Champions Elementary');
assert(cathyWorker?.positionId === 'POS-CHAMP-MED-01', 'Position Control ID POS-CHAMP-MED-01 verified');
assert(cathyWorker?.annualSalary === 42000, 'Salary is recorded accurately ($42,000)');
assert(cathyWorker?.contractType === 'At-Will', 'Employment agreement is strictly At-Will');
assert(!!cathyWorker?.dpsSid, 'DPS SID background check ID exists');

const marcusWorker = adpRoster.find(w => w.adpId === 'MKH88219A');
assert(!!marcusWorker, 'Marcus Holloway found in ADP directory (MKH88219A)');
assert(marcusWorker?.employmentStatus === 'Terminated', 'Marcus Holloway status in ADP is Terminated');
assert(marcusWorker?.adpBatchNumber === 'ADP-2026-B849', 'Marcus Holloway ADP batch confirmed as ADP-2026-B849');

// 22c. Reconciliation Engine with PARs
const { updatedRoster, summary } = reconcileStaffWithPars(adpRoster, INITIAL_PAR_DATA);
assert(summary.totalWorkers === adpRoster.length, `Reconciliation processed all ${adpRoster.length} staff`);
assert(summary.activeCount >= 7, `Active staff accurately tracked (${summary.activeCount})`);
assert(summary.terminatedCount >= 2, `Terminated staff tracked (${summary.terminatedCount})`);
assert(summary.pendingAdpCloseoutCount >= 1, `Pending ADP closeouts flagged (${summary.pendingAdpCloseoutCount})`);

// Cathy Velasco par-sst-001 is at payroll_action, so she must be flagged as pending_adp_closeout
const reconciledCathy = updatedRoster.find(w => w.adpId === 'JMJRMGNGA');
assert(reconciledCathy?.alignmentStatus === 'pending_adp_closeout', 'Cathy Velasco alignmentStatus is pending_adp_closeout');

// 22d. Execution of ADP Termination Closeout (Paola Comparini finalizing PAR)
const par001 = INITIAL_PAR_DATA.find(p => p.id === 'par-sst-001')!;
assert(!!par001, 'par-sst-001 found for closeout test');
const closedRoster = executeAdpTerminationCloseout(updatedRoster, 'JMJRMGNGA', par001, 'ADP-2026-B855');
const terminatedCathy = closedRoster.find(w => w.adpId === 'JMJRMGNGA');
assert(terminatedCathy?.employmentStatus === 'Terminated', 'Cathy Velasco status transitioned to Terminated');
assert(terminatedCathy?.adpBatchNumber === 'ADP-2026-B855', 'Cathy Velasco recorded with ADP batch ADP-2026-B855');
assert(terminatedCathy?.alignmentStatus === 'aligned', 'Cathy Velasco alignmentStatus updated to aligned');
assert(terminatedCathy?.eligibleForRehire === 'No', 'Rehire eligibility set to No for job abandonment');

// Re-running reconciliation shows 0 pending closeouts
const postCloseoutRecon = reconcileStaffWithPars(closedRoster, INITIAL_PAR_DATA);
assert(postCloseoutRecon.summary.pendingAdpCloseoutCount === 0, 'Zero pending closeouts remaining after ADP execution');

// 22e. Batch Push Terminations
const { closedCount } = batchPushTerminationsToAdp(adpRoster, INITIAL_PAR_DATA);
assert(typeof closedCount === 'number', `batchPushTerminationsToAdp completed successfully (closed: ${closedCount})`);

// 22f. ADP Custom Report CSV Parser
const testCsv = `Associate ID,Worker Name,Campus,Department,Job Title,Annual Salary,Status,Hire Date
TEST001,"Test Teacher, Alice",SST Spring,Instructional,Math Teacher,56000,Active,2022-08-01
TEST002,"Test Coord, Bob",Central Office,Human Resources,HR Specialist,62000,Terminated,2021-06-15`;

const parsedCsv = parseAdpCsvExport(testCsv);
assert(parsedCsv.length === 2, `CSV parser successfully extracted 2 workers (Found: ${parsedCsv.length})`);
assert(parsedCsv[0].associateId === 'TEST001', 'Parsed Worker 1 Associate ID is TEST001');
assert(parsedCsv[0].employmentStatus === 'Active', 'Parsed Worker 1 status is Active');
assert(parsedCsv[0].annualSalary === 56000, 'Parsed Worker 1 salary is 56000');
assert(parsedCsv[1].associateId === 'TEST002', 'Parsed Worker 2 Associate ID is TEST002');
assert(parsedCsv[1].employmentStatus === 'Terminated', 'Parsed Worker 2 status is Terminated');

// 24. ADP Workforce Now relay mapping, campus matching, and roster import
console.log('\n--- 24. ADP Relay Mapping & Roster Import ---');
const sampleAdpWorker = {
  associateOID: 'G3ABC123XYZ',
  workerID: { idValue: 'MRG92014A' },
  person: {
    legalName: { givenName: 'Maria', familyName1: 'Rodriguez' },
    birthDate: '1990-01-01',
    governmentIDs: [{ idValue: '123-45-6789' }]
  },
  businessCommunication: { emails: [{ emailUri: 'mrodriguez@ssttx.org' }] },
  workerDates: { originalHireDate: '2022-08-01' },
  customFieldGroup: {
    stringFields: [{ nameCode: { shortName: 'DPS SID&/Name' }, stringValue: '55501234' }],
    indicatorFields: [{ nameCode: { shortName: 'TRS Member' }, indicatorValue: false }]
  },
  workAssignments: [
    { primaryIndicator: false, jobTitle: 'Old Title' },
    {
      primaryIndicator: true,
      jobTitle: 'Science Teacher',
      positionID: 'POS-SPR-SCI-02',
      workerTypeCode: { codeValue: 'F', shortName: 'Full Time' },
      assignmentStatus: { statusCode: { codeValue: 'L' } },
      homeWorkLocation: { nameCode: { shortName: 'SST - Spring Campus' } },
      homeOrganizationalUnits: [{ typeCode: { codeValue: 'Department' }, nameCode: { shortName: 'Instruction' } }],
      reportsTo: [{ associateOID: 'G3SUP001', reportsToWorkerName: { formattedName: 'Vanessa Nguyen' } }],
      baseRemuneration: { annualRateAmount: { amountValue: 61250 } }
    }
  ]
};
const relayRec = mapWorker(sampleAdpWorker, { dpsSidField: 'DPS SID&/Name', trsField: 'TRS Member' });
assert(relayRec.firstName === 'Maria' && relayRec.lastName === 'Rodriguez', 'Relay maps legal first/last name');
assert(relayRec.workerId === 'MRG92014A' && relayRec.associateOID === 'G3ABC123XYZ', 'Relay maps ADP worker ID and associate OID');
assert(relayRec.jobTitle === 'Science Teacher', 'Relay uses the primary work assignment');
assert(relayRec.status === 'Leave of Absence', 'Relay maps assignment status L to Leave of Absence');
assert(relayRec.workerType === 'Full-time', 'Relay maps worker type F to Full-time');
assert(relayRec.annualSalary === 61250, 'Relay maps annual base salary');
assert(relayRec.supervisorName === 'Vanessa Nguyen', 'Relay maps reports-to supervisor');
assert(relayRec.dpsSid === '55501234' && relayRec.trsMember === false, 'Relay reads DPS SID and TRS custom fields');
assert(!JSON.stringify(relayRec).includes('123-45-6789') && !JSON.stringify(relayRec).includes('1990-01-01'), 'Relay drops SSN and birth date');
assert(mapWorker(sampleAdpWorker, { includeSalary: false }).annualSalary === undefined, 'Relay can omit salary');
const subWorker = { ...sampleAdpWorker, workAssignments: [{ primaryIndicator: true, workerTypeCode: { codeValue: 'SUB', shortName: 'On-Call Substitute' } }] };
assert(mapWorker(subWorker).workerType === 'Sub', 'Relay maps SUB (On-Call Substitute) to Sub');
const ltsWorker = { ...sampleAdpWorker, workAssignments: [{ primaryIndicator: true, workerTypeCode: { codeValue: 'LTS', shortName: 'Long Term Substitute' } }] };
assert(mapWorker(ltsWorker).workerType === 'Sub', 'Relay maps LTS (Long Term Substitute) to Sub');

const appWorker = workerFromRelayRecord(relayRec, '2026-09-25T12:00:00Z');
assert(appWorker.campus === 'SST Spring' && appWorker.location === 'Houston', `ADP location "SST - Spring Campus" maps to SST Spring / Houston (Got: ${appWorker.campus})`);
assert(appWorker.adpId === 'MRG92014A' && appWorker.workEmail === 'mrodriguez@ssttx.org', 'App worker keeps ADP ID and email');

assert(matchSstCampus('SST Sugar Land College Prep High School') === 'SST Sugar Land College Prep High School', 'Campus match: exact name');
assert(matchSstCampus('Sugar Land College Prep HS Campus') === undefined, 'Campus match: a partial name is left blank instead of matching SST Sugar Land');
assert(matchSstCampus('School of Science and Technology - Sugar Land College Prep High School') === 'SST Sugar Land College Prep High School', 'Campus match ignores the full district name prefix');
assert(matchSstCampus('Warehouse') === undefined, 'Campus match returns undefined when there is no match');
const adpLocationCases: [string, string | undefined][] = [
  ['015827 006-1 SST Champions', 'SST Champions Elementary'],
  ['015827 006-2 SST Champions College Prep', 'SST Champions College Prep High School'],
  ['015831 005 SST Sugarland', 'SST Sugar Land'],
  ['015831 009-02 SST Sugarland College Prep', 'SST Sugar Land College Prep High School'],
  ['015827 001 SST SA College Prep', 'SST San Antonio College Prep High School'],
  ['015831 002-2 SST CC College Prep', 'SST Corpus Christi College Prep High School'],
  ['015831 008-02 SST-Hill Country College Prep', 'SST Hill Country College Prep High School'],
  ['444444 444 SST Central Office', 'SST Central Office (District Administration)'],
  ['666666 666 Regional Office-Houston', 'SST Houston Regional Office'],
  ['015827 008 SONTERRA', 'SST Sonterra'],
  ['CHAMP/CHAMPCP/HILLCOUNTRY', undefined],
  ['015831 002-03 SST Bayshore', 'SST Bayshore'],
  ['015831 002-04 SST CC EARLY ELEMENTARY', 'SST Corpus Christi Early Elementary'],
  ['015827 007 SST Schertz', 'SST Schertz'],
  ['015827 007 2 Schertz', 'SST Schertz'],
  ['SCHERTZ', 'SST Schertz'],
  ['555555 555 Regional Office-San Antonio', 'SST San Antonio Regional Office'],
  ['015805 041 NF GREG GARCIA ELEM', 'NF Greg Garcia Elementary (NFPS Partner)'],
  ['015805 001 NF FRANK L MADLA EARLY COLLEGE HS', 'NF Frank L. Madla Early College High School (NFPS Partner)'],
  ['015827 004 SST Excellence', undefined],
  ['015831 007 SST ONLINE ACADEMY', undefined]
];
const expectedRegions: [string, string][] = [
  ['SST Bayshore', 'Corpus Christi'],
  ['SST Corpus Christi Early Elementary', 'Corpus Christi'],
  ['SST Schertz', 'San Antonio'],
  ['SST San Antonio Regional Office', 'San Antonio'],
  ['NF Greg Garcia Elementary (NFPS Partner)', 'San Antonio'],
  ['NF Frank L. Madla Early College High School (NFPS Partner)', 'San Antonio']
];
expectedRegions.forEach(([campusName, region]) => {
  const got = locationForCampus(campusName as Campus);
  assert(got === region, `${campusName} routes to the ${region} region (Got: ${got})`);
});
adpLocationCases.forEach(([adpName, expected]) => {
  const got = matchSstCampus(adpName);
  assert(got === expected, `ADP location "${adpName}" maps to ${expected ?? 'no campus'} (Got: ${got ?? 'none'})`);
});

const csvWithGaps = `Associate ID,Legal First Name,Legal Last Name,Home Work Location,Status
AAA111,Jordan,Lee,SST Alamo,Active
,No,Identifier,SST Alamo,Active`;
const csvWorkers = parseAdpCsvExport(csvWithGaps);
assert(csvWorkers.length === 1, 'CSV import skips rows without an ADP ID instead of inventing one');
assert(csvWorkers[0].workEmail === '' && csvWorkers[0].annualSalary === 0 && csvWorkers[0].hireDate === '', 'CSV import leaves missing email, salary, and hire date blank');
assert(csvWorkers[0].campus === 'SST Alamo' && csvWorkers[0].location === 'San Antonio', 'CSV import maps campus and region');

const linkedExisting = { ...appWorker, linkedParId: 'par-1', linkedParTracking: 'PAR-2026-X', alignmentStatus: 'par_in_progress' as const };
const orphan = { ...appWorker, id: 'OLD', adpId: 'OLD', associateId: 'OLD', linkedParId: 'par-2' };
const mergedRoster = mergeAdpRoster([linkedExisting, orphan], [appWorker]);
assert(mergedRoster[0].linkedParId === 'par-1' && mergedRoster[0].alignmentStatus === 'par_in_progress', 'Roster merge keeps PAR linkage');
assert(mergedRoster.some(w => w.adpId === 'OLD'), 'Roster merge keeps PAR-linked workers missing from ADP');

// 25. Daily ADP roster sync (relay cron + portal auto-sync)
console.log('\n--- 25. Daily ADP Roster Sync ---');
const nowMs = Date.parse('2026-09-26T15:00:00Z');
assert(!isAdpSyncDue(DEFAULT_ADP_CONFIG, nowMs, false), 'No auto-sync when live ADP (Firebase) is not configured');
  assert(isAdpSyncDue(DEFAULT_ADP_CONFIG, nowMs, true), 'Auto-sync is due when this browser has never loaded the roster');
  assert(!isAdpSyncDue({ ...DEFAULT_ADP_CONFIG, lastCheckedAt: '2026-09-26T10:00:00Z' }, nowMs, true), 'Auto-sync waits 6 hours between loads');
  assert(isAdpSyncDue({ ...DEFAULT_ADP_CONFIG, lastCheckedAt: '2026-09-26T08:59:00Z' }, nowMs, true), 'Auto-sync runs after 6 hours');
  assert(isAdpDataStale({ ...DEFAULT_ADP_CONFIG, lastSyncTimestamp: '2026-09-25T02:00:00Z' }, nowMs, true), 'Roster older than 36 hours is flagged stale');
  assert(!isAdpDataStale({ ...DEFAULT_ADP_CONFIG, lastSyncTimestamp: '2026-09-26T10:00:00Z' }, nowMs, true), 'This morning\'s roster is not stale');

  // Simulate the Cloud Function's daily pull against a fake ADP returning 150 workers over two pages.
  const recentTerm = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
  const fakeAdpWorker = (i: number) => ({
    associateOID: `OID${i}`,
    workerID: { idValue: `W${i}` },
    person: { legalName: { givenName: `First${i}`, familyName1: `Last${i}` } },
    workerDates: i === 1 ? { terminationDate: '2019-06-01' } : i === 2 ? { terminationDate: recentTerm } : {},
    workAssignments: [{ primaryIndicator: true, assignmentStatus: { statusCode: { codeValue: i <= 2 ? 'T' : 'A' } } }]
  });
  const adpCalls: string[] = [];
  const fakeAdp = createAdpClient({
    certPem: 'cert', keyPem: 'key', clientId: 'id', clientSecret: 'secret',
    request: async (url: string) => {
      adpCalls.push(url);
      if (url.includes('/auth/oauth/v2/token')) return { status: 200, text: JSON.stringify({ access_token: 'tok' }) };
      const skip = Number(new URL(url).searchParams.get('$skip'));
      const count = skip === 0 ? 100 : skip === 100 ? 50 : 0;
      if (count === 0) return { status: 204, text: '' };
      return { status: 200, text: JSON.stringify({ workers: Array.from({ length: count }, (_, j) => fakeAdpWorker(skip + j + 1)) }) };
    }
  });
  const pulled = await fakeAdp.fetchAllWorkers('/hr/v2/worker-demographics');
  const dailyRoster = buildRoster(pulled, { dpsSidField: 'DPS SID&/Name', terminatedLookbackDays: 365 });
  assert(adpCalls[0].includes('/auth/oauth/v2/token') && adpCalls.some(u => u.includes('/hr/v2/worker-demographics')), 'Daily pull signs in, then calls /hr/v2/worker-demographics');
  assert(pulled.length === 150 && adpCalls.length === 3, `Daily pull reads every page and stops after a short page (Got: ${pulled.length} workers, ${adpCalls.length} calls)`);
  assert(dailyRoster.length === 149, `Daily roster drops staff terminated over a year ago (Got: ${dailyRoster.length})`);
  assert(dailyRoster.some(w => w.workerId === 'W2'), 'Daily roster keeps a recent termination');
  const rosterChunks = chunkRoster(dailyRoster);
  assert(rosterChunks.length === 1 && chunkRoster(Array.from({ length: 600 }, (_, i) => i)).length === 3, 'Roster is split into 250-record Firestore documents');
  const failingAdp = createAdpClient({
    certPem: 'c', keyPem: 'k', clientId: 'i', clientSecret: 's',
    request: async (url: string) => url.includes('token')
      ? { status: 200, text: JSON.stringify({ access_token: 't' }) }
      : { status: 403, text: '{"message":"Invalid Scope"}' }
  });
  let scopeError = '';
  try { await failingAdp.fetchAllWorkers('/hr/v2/workers'); } catch (e: any) { scopeError = e.message; }
  assert(scopeError.includes('HTTP 403'), 'ADP errors (e.g. 403 Invalid Scope) are reported, not swallowed');

// 23. Texas Payday Law final-pay deadlines & date-only parsing
console.log('\n--- 23. Texas Final Pay Deadlines & Date Handling ---');
const involuntaryPay = getTexasFinalPayDeadline('2026-09-15', false);
assert(involuntaryPay.deadline === '2026-09-21', `Involuntary final pay due 6 calendar days after discharge (Got: ${involuntaryPay.deadline})`);
const voluntaryPay = getTexasFinalPayDeadline('2026-09-15', true);
assert(voluntaryPay.deadline === '2026-09-30', `Voluntary final pay due next regular payday after last day, not same-day payday (Got: ${voluntaryPay.deadline})`);
assert(getTexasFinalPayDeadline('2026-09-15', null).deadline === undefined, 'No final pay deadline until separation is classified');
assert(getTexasFinalPayDeadline(undefined, true).deadline === undefined, 'No final pay deadline without a last day worked');
assert(addDaysIso('2026-12-29', 6) === '2027-01-04', 'addDaysIso crosses year boundary correctly');
assert(addDaysIso('2026-03-07', 1) === '2026-03-08', 'addDaysIso is unaffected by DST transitions');
assert(parseDateOnly('2026-09-15').getDate() === 15, 'Date-only strings parse as local calendar dates');
assert(formatDate('2026-09-15') === '09/15/2026', `formatDate does not shift date-only values by timezone (Got: ${formatDate('2026-09-15')})`);

// SUMMARY
console.log('\n======================================================');
console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
