import React, { useState } from 'react';
import { 
  PersonnelActionRequest, 
  UserPersona, 
  ActionType, 
  Priority,
  Campus,
  SchoolLocation,
  SST_CAMPUS_REGIONS,
  WorkflowConfig
} from '../types/par';
import { MOCK_EMPLOYEES, buildSstRouting } from '../data/mockData';
import { SST_DEFAULT_LOGO } from '../data/sstLogo';
import { formatCurrency, getDepartmentNotificationRecipients } from '../utils/formatters';
import { 
  X, 
  UserCheck, 
  BadgeDollarSign, 
  UserMinus, 
  TrendingUp, 
  ArrowRightLeft, 
  CalendarClock, 
  ArrowRight,
  Bell
} from 'lucide-react';

interface ParFormModalProps {
  currentPersona: UserPersona;
  onClose: () => void;
  onSubmitPar: (newPar: PersonnelActionRequest) => void;
  workflowConfig?: WorkflowConfig;
}

export const ParFormModal: React.FC<ParFormModalProps> = ({
  currentPersona,
  onClose,
  onSubmitPar,
  workflowConfig
}) => {
  const initialEmp = MOCK_EMPLOYEES[0];
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>(initialEmp.id);

  // Fully Editable Employee Demographics
  const [firstName, setFirstName] = useState<string>(initialEmp.firstName);
  const [lastName, setLastName] = useState<string>(initialEmp.lastName);
  const [employeeId, setEmployeeId] = useState<string>(initialEmp.adpId);
  const [title, setTitle] = useState<string>(initialEmp.title);
  const [campus, setCampus] = useState<Campus>(initialEmp.campus);
  const [location, setLocation] = useState<SchoolLocation>(initialEmp.location);
  const [employmentStatus, setEmploymentStatus] = useState<'Full-time' | 'Part-time' | 'Sub'>(initialEmp.status as 'Full-time' | 'Part-time' | 'Sub');
  const [workEmail, setWorkEmail] = useState<string>(initialEmp.email);
  const [associateId, setAssociateId] = useState<string>(initialEmp.associateId || '100481');
  const [currentSalary, setCurrentSalary] = useState<number>(initialEmp.currentSalary);
  const [supervisorName, setSupervisorName] = useState<string>(initialEmp.supervisorName);

  const [actionType, setActionType] = useState<ActionType>('termination');
  const [priority, setPriority] = useState<Priority>('urgent');
  const [effectiveDate, setEffectiveDate] = useState<string>('2026-09-15');

  // Handle employee selection from directory with auto-population
  const handleSelectEmployee = (empId: string) => {
    setSelectedEmployeeId(empId);
    const emp = MOCK_EMPLOYEES.find(e => e.id === empId);
    if (emp) {
      setFirstName(emp.firstName);
      setLastName(emp.lastName);
      setEmployeeId(emp.adpId);
      setTitle(emp.title);
      setCampus(emp.campus);
      setLocation(emp.location);
      setEmploymentStatus((emp.status || 'Full-time') as 'Full-time' | 'Part-time' | 'Sub');
      setWorkEmail(emp.email);
      setAssociateId(emp.associateId || '100481');
      setCurrentSalary(emp.currentSalary);
      setSupervisorName(emp.supervisorName);
      setProposedSalary(emp.currentSalary * 1.08);
    }
  };

  // Termination Questions (1 - 9)
  const [isVoluntary, setIsVoluntary] = useState<boolean>(false); // Involuntary default
  const [isSchoolYearNonRenewal, setIsSchoolYearNonRenewal] = useState<boolean>(false);
  const [lastDayWorked, setLastDayWorked] = useState('2026-09-15');
  const [reasonForTermination, setReasonForTermination] = useState('Ms. Velasco was set to start on 9/15 and did not show up to work and did not communicate with us after 9/15.');
  const [terminationCode, setTerminationCode] = useState('A = Job Abandonment');
  const [allPtoEnteredInAdp, setAllPtoEnteredInAdp] = useState(true);
  const [returnedCharterProperty, setReturnedCharterProperty] = useState(true);
  const [laptopReturned, setLaptopReturned] = useState(true);
  const [keysBadgesReturned, setKeysBadgesReturned] = useState(true);
  const [sisGradebookClosed, setSisGradebookClosed] = useState(true);
  const [trsNotificationRequired, setTrsNotificationRequired] = useState(true);
  const [contractType, setContractType] = useState<'Chapter 21 Term' | 'Chapter 21 Probationary' | 'Non-Chapter 21 / At-Will'>('Chapter 21 Term');
  const [hasWrittenStatements, setHasWrittenStatements] = useState(false);
  const [outstandingStipendsOwed, setOutstandingStipendsOwed] = useState(false);
  const [uploadedDocName, setUploadedDocName] = useState('notice of separation.JPG');

  // Transfer & Role specifics
  const [proposedCampus, setProposedCampus] = useState<Campus>('SST Spring');
  const [proposedLocation, setProposedLocation] = useState<SchoolLocation>('Houston');
  const [proposedTitle, setProposedTitle] = useState('');
  const [proposedSupervisor, setProposedSupervisor] = useState('');
  const [notesRelatingToPositionChange, setNotesRelatingToPositionChange] = useState('');

  // Salary / Stipend specifics
  const [proposedSalary, setProposedSalary] = useState<number>(initialEmp.currentSalary * 1.08);
  const [stipendAmount, setStipendAmount] = useState<number>(5000);
  const [salaryReason, setSalaryReason] = useState('AP STEM Incentive Stipend');

  // HR calculation fields
  const [markRehireStatus, setMarkRehireStatus] = useState(false);
  const [finalPayCheckComment, setFinalPayCheckComment] = useState('Immediate payout required per charter school policy.');

  const percentDelta = currentSalary > 0 
    ? ((proposedSalary - currentSalary) / currentSalary) * 100 
    : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const randomSuffix = Math.random().toString(36).substring(2, 10).toUpperCase();
    const trackingNumber = `PAR-2026-${randomSuffix}`;
    const gtpuid = `${crypto.randomUUID()}-${crypto.randomUUID()}`;
    const routingSteps = buildSstRouting(
      actionType,
      actionType === 'termination' ? isVoluntary : false,
      location,
      workflowConfig
    );

    const newPar: PersonnelActionRequest = {
      id: `par-${Date.now()}`,
      trackingNumber,
      gtpuid,
      actionType,
      priority,
      currentStage: 'supervisor_review',
      effectiveDate,

      employeeId,
      firstName,
      lastName,
      title,
      location,
      campus,
      employmentStatus,
      workEmail,
      associateId,
      dpsSid: initialEmp.dpsSid,
      currentSalary,

      // Termination specifics
      isVoluntary: actionType === 'termination' ? isVoluntary : undefined,
      isSchoolYearNonRenewal: actionType === 'termination' ? isSchoolYearNonRenewal : undefined,
      lastDayWorked: actionType === 'termination' ? lastDayWorked : undefined,
      reasonForTermination: actionType === 'termination' ? reasonForTermination : undefined,
      terminationCode: actionType === 'termination' ? terminationCode : undefined,
      allPtoEnteredInAdp: actionType === 'termination' ? allPtoEnteredInAdp : undefined,
      returnedCharterProperty: actionType === 'termination' ? returnedCharterProperty : undefined,
      laptopReturned: actionType === 'termination' ? laptopReturned : undefined,
      keysBadgesReturned: actionType === 'termination' ? keysBadgesReturned : undefined,
      sisGradebookClosed: actionType === 'termination' ? sisGradebookClosed : undefined,
      trsNotificationRequired: actionType === 'termination' || actionType === 'leave_of_absence' ? trsNotificationRequired : undefined,
      contractType,
      cobraNoticeDueDate: actionType === 'termination' && lastDayWorked 
        ? new Date(new Date(lastDayWorked).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] 
        : undefined,
      hasWrittenStatements: actionType === 'termination' ? hasWrittenStatements : undefined,
      outstandingStipendsOwed: actionType === 'termination' ? outstandingStipendsOwed : undefined,
      finalPayCheckComment: actionType === 'termination' ? finalPayCheckComment : undefined,
      markRehireStatus: actionType === 'termination' ? markRehireStatus : undefined,
      
      // Defaults for HR & payroll calculation
      totalWorkingDays: 0,
      totalUtoDays: 0,
      totalWorkedDays: 0,
      totalCompensatedDays: 0,
      ptoBalance: 0,
      totalPtoDays: 0,
      totalPtoDaysEarned: 0,
      totalPtoDaysUnearned: 0,
      dailyRate: Math.round((currentSalary / 260) * 100) / 100,
      earnedWages: 0,
      finalPay: 0,

      // Campus transfer / Role change specifics
      proposedCampus: (actionType === 'campus_transfer' || actionType === 'role_change') ? proposedCampus : undefined,
      proposedLocation: (actionType === 'campus_transfer' || actionType === 'role_change') ? proposedLocation : undefined,
      proposedTitle: (actionType === 'campus_transfer' || actionType === 'role_change' || actionType === 'promotion') ? (proposedTitle || title) : undefined,
      proposedSupervisor: proposedSupervisor || undefined,
      notesRelatingToPositionChange: notesRelatingToPositionChange || undefined,

      // Salary specifics
      proposedSalary: (actionType === 'salary_change' || actionType === 'promotion') ? proposedSalary : undefined,
      stipendAmount: (actionType === 'salary_change') ? stipendAmount : undefined,
      percentIncrease: (actionType === 'salary_change' || actionType === 'promotion') ? percentDelta : undefined,
      salaryChangeReason: salaryReason,

      submittedBy: currentPersona.name,
      submitterEmail: currentPersona.email,
      submitterRole: currentPersona.role,
      submittedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),

      routingSteps,
      electronicSignatures: [
        {
          signingParty: 'Supervisor',
          signerName: currentPersona.name,
          signerEmail: currentPersona.email,
          signerId: currentPersona.signerId,
          ipAddress: currentPersona.ipAddress,
          status: 'pending'
        },
        ...(actionType === 'termination' && isVoluntary
          ? (location === 'Houston'
              ? [{
                  signingParty: 'Regional Executive Director (Houston)',
                  signerName: 'Atnan Ekin',
                  signerEmail: 'aekin@ssttx.org',
                  signerId: '5b194821-3910-4820-9921-8841a0294821',
                  ipAddress: '208.184.164.230',
                  status: 'pending' as const
                }]
              : [{
                  signingParty: 'Regional Executive Director (SA & CC)',
                  signerName: 'Serdar Bulut',
                  signerEmail: 'sbulut@ssttx.org',
                  signerId: '6c295832-4021-5931-0032-9952b1305932',
                  ipAddress: '208.184.164.231',
                  status: 'pending' as const
                }]
            )
          : [{
              signingParty: 'Chief People Officer',
              signerName: 'Dr. Kevin Demirci',
              signerEmail: 'kdemirci@ssttx.org',
              signerId: '7a374357-998f-4203-8874-8b95cb88898d',
              ipAddress: '208.184.164.228',
              status: 'pending' as const
            }]
        ),
        ...(location === 'Houston'
          ? [{
              signingParty: 'HR',
              signerName: 'Kristy Stewart',
              signerEmail: 'kstewart@ssttx.org',
              signerId: '8cee36a3-eb8d-4b04-96ec-0fcd6397c6fc',
              ipAddress: '108.65.54.105',
              status: 'pending' as const
            }]
          : [{
              signingParty: 'HR',
              signerName: 'Amber Johnson',
              signerEmail: 'ajohnson@ssttx.org',
              signerId: '9bee47b4-fc9e-5c15-07fd-1fde7408d7fd',
              ipAddress: '208.184.164.232',
              status: 'pending' as const
            }]
        ),
        ...(actionType === 'termination' || actionType === 'leave_of_absence' ? [{
          signingParty: 'Benefits',
          signerName: 'Ursula Villanueva',
          signerEmail: 'uvillanueva@ssttx.org',
          signerId: '0e97e30e-841a-4263-a558-61ffac5f61b3',
          ipAddress: '208.184.164.228',
          status: 'pending' as const
        }] : []),
        {
          signingParty: 'Payroll',
          signerName: 'Paola Comparini',
          signerEmail: 'pcomparini@ssttx.org',
          signerId: '4f291ab8-7612-4a01-9871-3312cb889021',
          ipAddress: '208.184.164.228',
          status: 'pending'
        }
      ],
      comments: [
        {
          id: `comm-${Date.now()}`,
          authorName: currentPersona.name,
          authorRole: currentPersona.role,
          authorDepartment: currentPersona.department,
          timestamp: new Date().toISOString(),
          message: `Created and submitted ${trackingNumber} for ${firstName} ${lastName} (${campus}) [ADP ID: ${employeeId}]. Routing to Principal/Supervisor endorsement.`
        }
      ],

      attachments: uploadedDocName ? [
        {
          id: `att-${Date.now()}`,
          name: uploadedDocName,
          size: '77.5 KB',
          uploadedBy: currentPersona.name,
          uploadedAt: new Date().toISOString(),
          fileType: 'image/jpeg'
        }
      ] : [],
      departmentNotifications: getDepartmentNotificationRecipients(location, campus)
    };

    onSubmitPar(newPar);
  };

  const actionTypes: { type: ActionType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { type: 'termination', label: 'Termination / Separation', icon: UserMinus },
    { type: 'campus_transfer', label: 'Campus Transfer', icon: ArrowRightLeft },
    { type: 'salary_change', label: 'Salary / Stipend Adjustment', icon: BadgeDollarSign },
    { type: 'role_change', label: 'Role / Title Change', icon: UserCheck },
    { type: 'promotion', label: 'Promotion', icon: TrendingUp },
    { type: 'leave_of_absence', label: 'Leave of Absence', icon: CalendarClock },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 md:p-6">
      <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/90 flex items-center justify-between">
          <div className="flex items-center space-x-3.5">
            <img src={SST_DEFAULT_LOGO} alt="SST" className="h-14 w-auto object-contain" />
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Initiate Personnel Action Request Form
              </h2>
              <p className="text-xs text-slate-500">
                School of Science and Technology • Multi-Department Routing
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 text-xs text-slate-800">
          
          {/* Action Type Selection Grid */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
              1. Select PAR Action Category
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {actionTypes.map((item) => {
                const Icon = item.icon;
                const isSelected = actionType === item.type;
                return (
                  <button
                    key={item.type}
                    type="button"
                    onClick={() => setActionType(item.type)}
                    className={`p-3 rounded-xl border text-left flex items-center space-x-2.5 transition-all ${
                      isSelected 
                        ? 'bg-blue-50 border-[#0f2352] text-[#0f2352] ring-2 ring-[#0f2352]/20 shadow-xs' 
                        : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${isSelected ? 'bg-[#0f2352] text-white' : 'bg-slate-100 text-slate-600'}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Employee Selection & Fully Editable Demographics */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-800">
                2. Employee Information (Auto-Populate or Customize)
              </label>
              <span className="text-[11px] text-emerald-800 font-bold bg-emerald-100/80 px-2.5 py-0.5 rounded-full border border-emerald-200">
                ✓ Name & Employee ID are fully editable
              </span>
            </div>

            {/* Auto-fill Dropdown */}
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                Quick Select from SST Directory (Auto-Fills Form):
              </label>
              <select
                value={selectedEmployeeId}
                onChange={(e) => handleSelectEmployee(e.target.value)}
                className="w-full text-xs bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-[#0f2352]/20 focus:border-[#0f2352]"
              >
                {MOCK_EMPLOYEES.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.firstName} {emp.lastName} — {emp.title} ({emp.campus}) [ADP ID: {emp.adpId}]
                  </option>
                ))}
              </select>
            </div>

            {/* Editable Fields Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">
                  Employee First Name *
                </label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full text-xs bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-[#0f2352]/20 focus:border-[#0f2352]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">
                  Employee Last Name *
                </label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full text-xs bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-[#0f2352]/20 focus:border-[#0f2352]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">
                  ADP Employee ID *
                </label>
                <input
                  type="text"
                  required
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  placeholder="e.g. 104928"
                  className="w-full text-xs bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-[#0f2352]/20 focus:border-[#0f2352]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">
                  Current Title / Position
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full text-xs bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0f2352]/20 focus:border-[#0f2352]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">
                  Campus Location
                </label>
                <select
                  value={campus}
                  onChange={(e) => {
                    const newCamp = e.target.value as Campus;
                    setCampus(newCamp);
                    const foundLoc = (Object.keys(SST_CAMPUS_REGIONS) as SchoolLocation[]).find(loc =>
                      SST_CAMPUS_REGIONS[loc].includes(newCamp)
                    );
                    if (foundLoc) setLocation(foundLoc);
                  }}
                  className="w-full text-xs bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0f2352]/20 focus:border-[#0f2352]"
                >
                  {Object.entries(SST_CAMPUS_REGIONS).map(([region, campuses]) => (
                    <optgroup key={region} label={`${region} Region`}>
                      {campuses.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">
                  Work Email Address
                </label>
                <input
                  type="email"
                  value={workEmail}
                  onChange={(e) => setWorkEmail(e.target.value)}
                  className="w-full text-xs bg-white border border-slate-300 rounded-xl p-2.5 text-blue-700 font-mono focus:outline-none focus:ring-2 focus:ring-[#0f2352]/20 focus:border-[#0f2352]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">
                  Texas Contract Status (TEA)
                </label>
                <select
                  value={contractType}
                  onChange={(e) => setContractType(e.target.value as any)}
                  className="w-full text-xs bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-[#0f2352]/20 focus:border-[#0f2352]"
                >
                  <option value="Chapter 21 Term">Chapter 21 Term Contract (Educators/Admin)</option>
                  <option value="Chapter 21 Probationary">Chapter 21 Probationary Contract (1-3 Yrs)</option>
                  <option value="Non-Chapter 21 / At-Will">Non-Chapter 21 / At-Will Agreement</option>
                </select>
              </div>
            </div>
          </div>

          {/* SST TERMINATION DOCUMENTATION QUESTIONS (1 - 9) */}
          {actionType === 'termination' && (
            <div className="bg-rose-50/40 p-4 rounded-2xl border border-rose-200 space-y-3.5">
              <div className="text-xs font-bold uppercase tracking-wider text-rose-900 border-b border-rose-200 pb-1.5 flex items-center justify-between">
                <span>3. Termination Documentation (SST Standard Questions)</span>
                <span className="text-[11px] font-normal text-rose-700">Official Charter Policy</span>
              </div>

              {/* Q1: Voluntary or Involuntary */}
              <div>
                <label className="block font-bold text-slate-900 mb-1">
                  1. Is this termination voluntary or involuntary?
                </label>
                <div className="flex items-center space-x-6 text-xs">
                  <label className="flex items-center space-x-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="vol"
                      checked={isVoluntary === true}
                      onChange={() => setIsVoluntary(true)}
                    />
                    <span>Voluntary (employee resigned)</span>
                  </label>
                  <label className="flex items-center space-x-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="vol"
                      checked={isVoluntary === false}
                      onChange={() => setIsVoluntary(false)}
                    />
                    <span className="font-bold text-rose-800">Involuntary (employee was terminated by SST)</span>
                  </label>
                </div>
              </div>

              {/* Q2: School Year Non-Renewal */}
              <div>
                <label className="block font-bold text-slate-900 mb-1">
                  2. Is the termination due to a non-renewal for the end of the current school year?
                </label>
                <div className="flex items-center space-x-6">
                  <label className="flex items-center space-x-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="nonrenewal"
                      checked={isSchoolYearNonRenewal === true}
                      onChange={() => setIsSchoolYearNonRenewal(true)}
                    />
                    <span>Yes</span>
                  </label>
                  <label className="flex items-center space-x-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="nonrenewal"
                      checked={isSchoolYearNonRenewal === false}
                      onChange={() => setIsSchoolYearNonRenewal(false)}
                    />
                    <span className="font-bold">No</span>
                  </label>
                </div>
              </div>

              {/* Q3: Last Day Worked */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-900 mb-1">
                    3. Last Day Worked
                  </label>
                  <input
                    type="date"
                    value={lastDayWorked}
                    onChange={(e) => setLastDayWorked(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-900 mb-1">
                    Termination Reason Code
                  </label>
                  <select
                    value={terminationCode}
                    onChange={(e) => setTerminationCode(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                  >
                    <option value="A = Job Abandonment">A = Job Abandonment</option>
                    <option value="B = Voluntary Resignation">B = Voluntary Resignation</option>
                    <option value="C = Involuntary Performance">C = Involuntary Performance</option>
                    <option value="D = End of Contract / Non-Renewal">D = End of Contract / Non-Renewal</option>
                    <option value="E = Mutual Agreement">E = Mutual Agreement</option>
                    <option value="F = Retirement">F = Retirement</option>
                  </select>
                </div>
              </div>

              {/* Q4: Reason for Termination Narrative */}
              <div>
                <label className="block font-bold text-slate-900 mb-1">
                  4. Reason for termination:
                </label>
                <textarea
                  rows={2}
                  value={reasonForTermination}
                  onChange={(e) => setReasonForTermination(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                  placeholder="e.g. Ms. Velasco was set to start on 9/15 and did not show up to work and did not communicate with us after 9/15."
                  required
                />
              </div>

              {/* Q5 & Q6 Checkboxes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                  <div className="font-semibold text-slate-800 mb-1.5">
                    5. Has all PTO/UTO/Leave been entered in ADP timesheets?
                  </div>
                  <div className="flex space-x-4">
                    <label className="flex items-center space-x-1 cursor-pointer">
                      <input type="radio" name="pto" checked={allPtoEnteredInAdp} onChange={() => setAllPtoEnteredInAdp(true)} />
                      <span className="font-bold text-emerald-800">Yes</span>
                    </label>
                    <label className="flex items-center space-x-1 cursor-pointer">
                      <input type="radio" name="pto" checked={!allPtoEnteredInAdp} onChange={() => setAllPtoEnteredInAdp(false)} />
                      <span>No</span>
                    </label>
                  </div>
                </div>

                <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                  <div className="font-semibold text-slate-800 mb-1.5">
                    6. Did employee return all Charter School property?
                  </div>
                  <div className="flex space-x-4 mb-2">
                    <label className="flex items-center space-x-1 cursor-pointer">
                      <input type="radio" name="prop" checked={returnedCharterProperty} onChange={() => setReturnedCharterProperty(true)} />
                      <span className="font-bold text-emerald-800">Yes</span>
                    </label>
                    <label className="flex items-center space-x-1 cursor-pointer">
                      <input type="radio" name="prop" checked={!returnedCharterProperty} onChange={() => setReturnedCharterProperty(false)} />
                      <span>No</span>
                    </label>
                  </div>
                  {returnedCharterProperty && (
                    <div className="pt-2 border-t border-slate-100 text-[11px] space-y-1 text-slate-600">
                      <label className="flex items-center space-x-1.5 cursor-pointer">
                        <input type="checkbox" checked={laptopReturned} onChange={(e) => setLaptopReturned(e.target.checked)} className="rounded" />
                        <span>District Laptop & Charger returned to IT</span>
                      </label>
                      <label className="flex items-center space-x-1.5 cursor-pointer">
                        <input type="checkbox" checked={keysBadgesReturned} onChange={(e) => setKeysBadgesReturned(e.target.checked)} className="rounded" />
                        <span>Master Campus Keys & RFID Badge surrendered</span>
                      </label>
                      <label className="flex items-center space-x-1.5 cursor-pointer">
                        <input type="checkbox" checked={sisGradebookClosed} onChange={(e) => setSisGradebookClosed(e.target.checked)} className="rounded" />
                        <span>SIS Gradebook & Student Records verified</span>
                      </label>
                    </div>
                  )}
                </div>
              </div>

              {/* Q7: Doc Upload */}
              <div>
                <label className="block font-bold text-slate-900 mb-1">
                  7. Other Documentation Upload (resignation letter, notice, emails):
                </label>
                <input
                  type="text"
                  value={uploadedDocName}
                  onChange={(e) => setUploadedDocName(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-300 rounded-xl text-slate-900"
                  placeholder="e.g. velasco notice of separation.JPG"
                />
              </div>

              {/* Q8 & Q9 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                  <div className="font-semibold text-slate-800 mb-1.5">
                    8. Were there any Written Statements/Incident Reports?
                  </div>
                  <div className="flex space-x-4">
                    <label className="flex items-center space-x-1 cursor-pointer">
                      <input type="radio" name="written" checked={hasWrittenStatements} onChange={() => setHasWrittenStatements(true)} />
                      <span>Yes</span>
                    </label>
                    <label className="flex items-center space-x-1 cursor-pointer">
                      <input type="radio" name="written" checked={!hasWrittenStatements} onChange={() => setHasWrittenStatements(false)} />
                      <span className="font-bold">No</span>
                    </label>
                  </div>
                </div>

                <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                  <div className="font-semibold text-slate-800 mb-1.5">
                    9. Any outstanding stipends or supplemental pay owed?
                  </div>
                  <div className="flex space-x-4">
                    <label className="flex items-center space-x-1 cursor-pointer">
                      <input type="radio" name="stipend" checked={outstandingStipendsOwed} onChange={() => setOutstandingStipendsOwed(true)} />
                      <span>Yes</span>
                    </label>
                    <label className="flex items-center space-x-1 cursor-pointer">
                      <input type="radio" name="stipend" checked={!outstandingStipendsOwed} onChange={() => setOutstandingStipendsOwed(false)} />
                      <span className="font-bold">No</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Texas Education Agency & Statutory Notice Box */}
              <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-200 space-y-2 text-xs">
                <div className="font-bold text-blue-950 flex items-center justify-between">
                  <span>🏛️ Texas Statutory & Teacher Retirement System (TRS) Processing:</span>
                  <span className="text-[10px] font-bold text-blue-800 bg-blue-100 px-2 py-0.5 rounded">
                    TEA & TRS Rules
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-blue-900">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={trsNotificationRequired}
                      onChange={(e) => setTrsNotificationRequired(e.target.checked)}
                      className="rounded"
                    />
                    <span>Generate TRS Notice of Separation (TRS 7/10 Reporting Required)</span>
                  </label>
                  <div className="text-slate-600">
                    COBRA Notice Statutory Window: <strong>30 days from {lastDayWorked || 'Effective Date'}</strong>
                  </div>
                </div>
              </div>

              {/* Final Pay Check Comment */}
              <div>
                <label className="block font-bold text-slate-900 mb-1">
                  Final Pay Check Comment (Page 2 of SST Form):
                </label>
                <input
                  type="text"
                  value={finalPayCheckComment}
                  onChange={(e) => setFinalPayCheckComment(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-300 rounded-xl text-slate-900"
                  placeholder="e.g. Immediate payout required per charter school policy."
                />
              </div>

              {/* Rehire flag */}
              <div className="pt-2 border-t border-rose-200 flex items-center justify-between">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={markRehireStatus}
                    onChange={(e) => setMarkRehireStatus(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600"
                  />
                  <span className="text-slate-800 font-bold">Eligible for Rehire at School of Science and Technology</span>
                </label>

                <span className="text-[11px] text-slate-400">Mark Rehire Status (Page 2)</span>
              </div>

            </div>
          )}

          {/* CAMPUS TRANSFER & ROLE CHANGE SPECIFICS */}
          {(actionType === 'campus_transfer' || actionType === 'role_change') && (
            <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-200 space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-amber-900 border-b border-amber-200 pb-1.5">
                3. Destination Campus & Position Details
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Destination Campus (All SST Campuses)
                  </label>
                  <select
                    value={proposedCampus}
                    onChange={(e) => {
                      const campus = e.target.value as Campus;
                      setProposedCampus(campus);
                      if (SST_CAMPUS_REGIONS['Houston Area'].includes(campus)) setProposedLocation('Houston');
                      else if (SST_CAMPUS_REGIONS['San Antonio Area'].includes(campus)) setProposedLocation('San Antonio');
                      else if (SST_CAMPUS_REGIONS['Corpus Christi Area'].includes(campus)) setProposedLocation('Corpus Christi');
                      else setProposedLocation('Central Administration');
                    }}
                    className="w-full p-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-semibold"
                  >
                    {Object.entries(SST_CAMPUS_REGIONS).map(([region, campuses]) => (
                      <optgroup key={region} label={region}>
                        {campuses.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Destination Region
                  </label>
                  <select
                    value={proposedLocation}
                    onChange={(e) => setProposedLocation(e.target.value as SchoolLocation)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-semibold"
                  >
                    <option value="Houston">Houston Region</option>
                    <option value="San Antonio">San Antonio Region</option>
                    <option value="Corpus Christi">Corpus Christi Region</option>
                    <option value="Austin">Austin Region</option>
                    <option value="Central Administration">Central Administration</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Proposed Title
                  </label>
                  <input
                    type="text"
                    placeholder={title || 'e.g. Science Teacher'}
                    value={proposedTitle}
                    onChange={(e) => setProposedTitle(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-xl text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Receiving Principal / Supervisor
                  </label>
                  <input
                    type="text"
                    placeholder="Principal Name"
                    value={proposedSupervisor}
                    onChange={(e) => setProposedSupervisor(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-xl text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Notes Relating to Position Change:
                </label>
                <textarea
                  rows={2}
                  value={notesRelatingToPositionChange}
                  onChange={(e) => setNotesRelatingToPositionChange(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-300 rounded-xl text-slate-900"
                  placeholder="Rationale for transfer or title reassignment..."
                />
              </div>
            </div>
          )}

          {/* SALARY / STIPEND SPECIFICS */}
          {(actionType === 'salary_change' || actionType === 'promotion') && (
            <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-200 space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-emerald-900 border-b border-emerald-200 pb-1.5">
                3. Compensation & Stipend Adjustment Details
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    New Annual Base Salary ($)
                  </label>
                  <input
                    type="number"
                    value={proposedSalary}
                    onChange={(e) => setProposedSalary(Number(e.target.value))}
                    step="500"
                    className="w-full p-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-bold"
                  />
                  <div className="mt-1 text-[11px] font-bold text-emerald-700">
                    Delta: +{percentDelta.toFixed(1)}% ({formatCurrency(proposedSalary - currentSalary)})
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Supplemental / Annual Stipend ($)
                  </label>
                  <input
                    type="number"
                    value={stipendAmount}
                    onChange={(e) => setStipendAmount(Number(e.target.value))}
                    step="500"
                    className="w-full p-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Adjustment Reason
                  </label>
                  <input
                    type="text"
                    value={salaryReason}
                    onChange={(e) => setSalaryReason(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-xl text-slate-900"
                    placeholder="e.g. AP Physics Incentive Stipend"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Effective Date & Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Effective Action Date
              </label>
              <input
                type="date"
                value={effectiveDate}
                onChange={(e) => setEffectiveDate(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-[#0f2352]/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Routing Priority Level
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-[#0f2352]/20"
              >
                <option value="urgent">Urgent (Immediate department action)</option>
                <option value="high">High (Priority review)</option>
                <option value="normal">Normal (Standard routing)</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>

          {/* SST Sequential Routing Preview */}
          <div className="bg-[#0f2352] text-white p-4 rounded-2xl">
            <div className="text-[11px] font-bold uppercase tracking-wider text-blue-200 mb-2">
              SST Multi-Department Approval Routing Chain
            </div>
            <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
              <span className="px-2.5 py-1 rounded-lg bg-white/10 border border-white/20 text-white font-medium">
                1. Principal ({supervisorName})
              </span>

              <ArrowRight className="w-3 h-3 text-blue-300" />
              <span className="px-2.5 py-1 rounded-lg bg-purple-900/60 border border-purple-400 text-purple-200 font-semibold">
                {actionType === 'termination' && isVoluntary
                  ? `2. Regional Exec (${location === 'Houston' ? 'Atnan Ekin' : 'Serdar Bulut'})`
                  : '2. CPO (Dr. Kevin Demirci)'}
              </span>

              <ArrowRight className="w-3 h-3 text-blue-300" />
              <span className="px-2.5 py-1 rounded-lg bg-blue-900/60 border border-blue-400 text-blue-200 font-semibold">
                3. Regional HR ({location === 'Houston' ? 'Kristy Stewart' : 'Amber Johnson'})
              </span>

              {actionType === 'termination' && (
                <>
                  <ArrowRight className="w-3 h-3 text-blue-300" />
                  <span className="px-2.5 py-1 rounded-lg bg-teal-900/60 border border-teal-400 text-teal-200 font-semibold">
                    4. Benefits (Ursula Villanueva)
                  </span>
                </>
              )}

              <ArrowRight className="w-3 h-3 text-blue-300" />
              <span className="px-2.5 py-1 rounded-lg bg-indigo-900/60 border border-indigo-400 text-indigo-200 font-semibold">
                Final. Payroll (Paola Comparini)
              </span>
            </div>
          </div>

          {/* Automated Department Notifications (FYI / No Action Required) */}
          <div className="bg-purple-900/30 border border-purple-400/40 text-purple-100 p-4 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-[11px] font-bold uppercase tracking-wider text-purple-200 flex items-center space-x-1.5">
                <Bell className="w-3.5 h-3.5 text-purple-300" />
                <span>Automated Department Stakeholder Notifications (No Action Required)</span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-400/20 text-purple-200 border border-purple-300/30">
                INFORMATIONAL ONLY
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="bg-white/10 p-2.5 rounded-xl border border-white/10">
                <span className="font-bold text-white block text-[11px]">IT Department ({location}):</span>
                <span className="text-purple-200 text-[11px]">
                  {location === 'Houston' ? 'Enes Sevik (esevik@ssttx.org)' : 'Ahmet Kaya (akaya@ssttx.org)'}
                </span>
                <p className="text-[10px] text-purple-300 mt-1">Automatic notice for hardware recovery, Google Workspace & SIS deactivation.</p>
              </div>
              <div className="bg-white/10 p-2.5 rounded-xl border border-white/10">
                <span className="font-bold text-white block text-[11px]">Talent Acquisition ({location}):</span>
                <span className="text-purple-200 text-[11px]">
                  {location === 'Houston' ? 'Hasan Kendirci (hkendirci@ssttx.org)' : 'Ali Dal (adal@ssttx.org)'}
                </span>
                <p className="text-[10px] text-purple-300 mt-1">Automatic notice for vacancy posting & backfill recruitment pipeline.</p>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-xs font-black bg-[#0f2352] hover:bg-[#1a3880] text-white rounded-xl shadow-md shadow-[#0f2352]/20 transition-all active:scale-95"
            >
              Submit SST PAR for Department Review
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
