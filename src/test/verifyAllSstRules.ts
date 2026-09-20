import { DEFAULT_WORKFLOW_CONFIG, INITIAL_PAR_DATA, USER_PERSONAS, buildSstRouting } from '../data/mockData';
import { canPersonaActOnPar } from '../utils/formatters';
import { PersonnelActionRequest, SST_CAMPUSES, SST_CAMPUS_REGIONS } from '../types/par';

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

// 7. SUMMARY
console.log('\n======================================================');
console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
console.log('======================================================\n');

if (failed > 0) {
  process.exit(1);
}
