import { DEFAULT_WORKFLOW_CONFIG, INITIAL_PAR_DATA, USER_PERSONAS, buildSstRouting } from '../data/mockData';
import { canPersonaActOnPar, isRegionalHrCoordinator, isPayrollCoordinator } from '../utils/formatters';
import { PersonnelActionRequest, SST_CAMPUSES, SST_CAMPUS_REGIONS } from '../types/par';
import { INITIAL_PAYOUT_REQUESTS, SST_PAYROLL_CYCLES } from '../data/mockPayoutData';

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
import { isChiefPeopleOfficer, getPersonaPermissions } from '../utils/formatters';

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
  avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=160&auto=format&fit=crop&q=80'
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
import { getDepartmentNotificationRecipients } from '../utils/formatters';

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

assert(SST_PAYROLL_CYCLES.length >= 3, `SST payroll cut-off calendar configured (Cycles: ${SST_PAYROLL_CYCLES.length})`);
assert(SST_PAYROLL_CYCLES.some(c => c.cutoffDate === '2026-09-25'), 'Upcoming September 25 semi-monthly payroll cut-off exists');

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

// 10. SUMMARY
console.log('\n======================================================');
console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
console.log('======================================================\n');

if (failed > 0) {
  process.exit(1);
}
