import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  PersonnelActionRequest,
  UserPersona,
  ActionType,
  Priority,
  Campus,
  SchoolLocation,
  SST_CAMPUSES,
  SST_CAMPUS_REGIONS,
  WorkflowConfig,
  ElectronicSignatureRecord,
  LEAVE_TYPES,
  LeaveType,
  MEDICAL_LEAVE_TYPES,
  BEREAVEMENT_RELATIONSHIPS,
  MedicalCertificationStatus,
  RehireEligibility,
  TERMINATION_REASONS,
  TerminationReason,
  formatTerminationCode
} from '../types/par';
import { buildSstRouting } from '../data/mockData';
import { SST_PAYROLL_CYCLES } from '../data/mockPayoutData';
import { AdpWorker } from '../types/adp';
import { AdpEmployeeSearch } from './AdpEmployeeSearch';
import { SST_DEFAULT_LOGO } from '../data/sstLogo';
import {
  addDaysIso,
  formatCurrency,
  formatDate,
  getDepartmentNotificationRecipients,
  getTexasFinalPayDeadline,
  isCampusPrincipal,
  isValidAdpPositionId,
  locationForCampus
} from '../utils/formatters';
import {
  X,
  UserCheck,
  BadgeDollarSign,
  UserMinus,
  TrendingUp,
  ArrowRightLeft,
  CalendarClock,
  Bell,
  AlertTriangle,
  AlertCircle,
  Paperclip,
  ShieldCheck,
  Trash2,
  Link2
} from 'lucide-react';

interface ParFormModalProps {
  currentPersona: UserPersona;
  onClose: () => void;
  onSubmitPar: (newPar: PersonnelActionRequest) => void;
  workflowConfig?: WorkflowConfig;
  preSelectedWorker?: AdpWorker | null;
}

interface PendingAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
}

const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;

// Stakeholder FYI notices go out for actions that affect system access or create a vacancy.
// Compensation and leave actions are excluded so pay and medical details are not broadcast.
const ACTIONS_WITH_DEPARTMENT_NOTICES: ActionType[] = ['termination', 'campus_transfer', 'role_change', 'promotion'];

function localTodayIso(): string {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

/** ADP termination reasons that fit the separation classification (all when not chosen yet). */
function reasonsFor(isVoluntary: boolean | null): TerminationReason[] {
  if (isVoluntary === null) return TERMINATION_REASONS;
  return TERMINATION_REASONS.filter(r => (isVoluntary ? r.voluntary : r.involuntary));
}

function codesFor(isVoluntary: boolean | null): string[] {
  return reasonsFor(isVoluntary).map(formatTerminationCode);
}

function formatBytes(bytes: number): string {
  return bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const inputCls =
  'w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0f2352]/20 focus:border-[#0f2352]';

const Field: React.FC<{
  label: string;
  htmlFor?: string;
  required?: boolean;
  hint?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}> = ({ label, htmlFor, required, hint, className, children }) => (
  <div className={className}>
    <label htmlFor={htmlFor} className="block text-[11px] font-semibold text-slate-700 mb-1">
      {label}
      {required && <span className="text-rose-600 ml-0.5" aria-hidden="true">*</span>}
    </label>
    {children}
    {hint && <p className="mt-1 text-[10px] leading-snug text-slate-500">{hint}</p>}
  </div>
);

const Section: React.FC<{
  step: number;
  title: string;
  description?: string;
  children: React.ReactNode;
}> = ({ step, title, description, children }) => (
  <section className="rounded-xl border border-slate-200 bg-white">
    <header className="flex items-start gap-3 px-4 py-3 border-b border-slate-100 bg-slate-50/70 rounded-t-xl">
      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#0f2352] text-[10px] font-bold text-white">
        {step}
      </span>
      <div>
        <h3 className="text-xs font-bold text-slate-900">{title}</h3>
        {description && <p className="text-[11px] text-slate-500 mt-0.5">{description}</p>}
      </div>
    </header>
    <div className="p-4 space-y-4">{children}</div>
  </section>
);

const YesNo: React.FC<{
  name: string;
  question: string;
  value: boolean | null;
  onChange: (value: boolean) => void;
  yesLabel?: string;
  noLabel?: string;
  hint?: string;
  children?: React.ReactNode;
}> = ({ name, question, value, onChange, yesLabel = 'Yes', noLabel = 'No', hint, children }) => (
  <fieldset className="rounded-lg border border-slate-200 p-3">
    <legend className="sr-only">{question}</legend>
    <div className="text-xs font-semibold text-slate-800" aria-hidden="true">
      {question}
      <span className="text-rose-600 ml-0.5">*</span>
    </div>
    {hint && <p className="mt-0.5 text-[10px] text-slate-500">{hint}</p>}
    <div className="mt-2 flex flex-wrap gap-2">
      {[true, false].map(option => (
        <label
          key={String(option)}
          className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs cursor-pointer transition-colors ${
            value === option
              ? 'border-[#0f2352] bg-[#0f2352]/5 text-[#0f2352] font-semibold'
              : 'border-slate-200 text-slate-700 hover:border-slate-300'
          }`}
        >
          <input
            type="radio"
            name={name}
            required
            checked={value === option}
            onChange={() => onChange(option)}
            className="accent-[#0f2352]"
          />
          <span>{option ? yesLabel : noLabel}</span>
        </label>
      ))}
    </div>
    {children}
  </fieldset>
);

export const ParFormModal: React.FC<ParFormModalProps> = ({
  currentPersona,
  onClose,
  onSubmitPar,
  workflowConfig,
  preSelectedWorker
}) => {
  const today = localTodayIso();
  // Only prefill a campus that exists in the campus list; otherwise the select would show
  // its first option while holding a different value, and routing would use the wrong region.
  const initialCampus: Campus | '' =
    [preSelectedWorker?.campus, currentPersona?.campus].find(
      (c): c is Campus => !!c && (SST_CAMPUSES as readonly string[]).includes(c)
    ) || '';
  const submitterIsSupervisor = currentPersona?.canReviewStages?.includes('supervisor_review') ?? false;

  // Employee information
  const [firstName, setFirstName] = useState<string>(preSelectedWorker?.firstName || '');
  const [lastName, setLastName] = useState<string>(preSelectedWorker?.lastName || '');
  const [employeeId, setEmployeeId] = useState<string>(preSelectedWorker?.adpId || preSelectedWorker?.associateId || '');
  const [title, setTitle] = useState<string>(preSelectedWorker?.jobTitle || '');
  const [campus, setCampus] = useState<Campus | ''>(initialCampus);
  const location: SchoolLocation = campus ? locationForCampus(campus) : 'Central Administration';
  const [employmentStatus, setEmploymentStatus] = useState<'Full-time' | 'Part-time' | 'Sub'>(preSelectedWorker?.workerType || 'Full-time');
  const [workEmail, setWorkEmail] = useState<string>(preSelectedWorker?.workEmail || '');
  const [associateId, setAssociateId] = useState<string>(preSelectedWorker?.associateId || preSelectedWorker?.adpId || '');
  const [dpsSid, setDpsSid] = useState<string>(preSelectedWorker?.dpsSid || '');
  const [currentSalary, setCurrentSalary] = useState<number>(preSelectedWorker?.annualSalary || 0);
  const [supervisorName, setSupervisorName] = useState<string>(
    preSelectedWorker?.supervisorName || (submitterIsSupervisor ? currentPersona.name : '')
  );
  const contractType = 'At-Will' as const;

  // Action, timing, priority
  const [actionType, setActionType] = useState<ActionType | null>(
    preSelectedWorker?.employmentStatus === 'Pending Termination' ? 'termination' : null
  );
  const [priority, setPriority] = useState<Priority>('normal');
  const [priorityTouched, setPriorityTouched] = useState(false);
  const [effectiveDate, setEffectiveDate] = useState<string>(today);
  const [effectiveDateTouched, setEffectiveDateTouched] = useState(false);

  // Separation documentation. Questions start unanswered so every answer is a deliberate choice.
  const [isVoluntary, setIsVoluntary] = useState<boolean | null>(null);
  const [isSchoolYearNonRenewal, setIsSchoolYearNonRenewal] = useState<boolean | null>(null);
  const [lastDayWorked, setLastDayWorked] = useState<string>(preSelectedWorker?.lastDayWorked || '');
  const [reasonForTermination, setReasonForTermination] = useState(preSelectedWorker?.terminationReason || '');
  const [terminationCode, setTerminationCode] = useState('');
  const [allPtoEnteredInAdp, setAllPtoEnteredInAdp] = useState<boolean | null>(null);
  const [returnedCharterProperty, setReturnedCharterProperty] = useState<boolean | null>(null);
  const [laptopReturned, setLaptopReturned] = useState(false);
  const [keysBadgesReturned, setKeysBadgesReturned] = useState(false);
  const [sisGradebookClosed, setSisGradebookClosed] = useState(false);
  const [outstandingPropertyNotes, setOutstandingPropertyNotes] = useState('');
  const [trsNotificationRequired, setTrsNotificationRequired] = useState<boolean>(preSelectedWorker?.trsMember ?? true);
  const [hasWrittenStatements, setHasWrittenStatements] = useState<boolean | null>(null);
  const [outstandingStipendsOwed, setOutstandingStipendsOwed] = useState<boolean | null>(null);
  const [rehireEligibility, setRehireEligibility] = useState<RehireEligibility | ''>('');
  const [finalPayCheckComment, setFinalPayCheckComment] = useState('');

  // Supporting documentation
  const [attachments, setAttachments] = useState<PendingAttachment[]>([]);
  const [attachmentError, setAttachmentError] = useState('');

  // Transfer / role change / promotion
  const [proposedCampus, setProposedCampus] = useState<Campus | ''>('');
  const [proposedTitle, setProposedTitle] = useState('');
  const [proposedSupervisor, setProposedSupervisor] = useState('');
  const [notesRelatingToPositionChange, setNotesRelatingToPositionChange] = useState('');

  // Compensation
  const [proposedSalary, setProposedSalary] = useState<number>(preSelectedWorker?.annualSalary || 0);
  const [proposedSalaryTouched, setProposedSalaryTouched] = useState(false);
  const [stipendAmount, setStipendAmount] = useState<number>(0);
  const [salaryReason, setSalaryReason] = useState('');

  // Leave of absence
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [leaveStartDate, setLeaveStartDate] = useState('');
  const [expectedReturnDate, setExpectedReturnDate] = useState('');
  const [isPaidLeave, setIsPaidLeave] = useState<boolean | null>(null);
  const [firstDayOfEmployment, setFirstDayOfEmployment] = useState<string>(preSelectedWorker?.hireDate || '');
  const [bereavementRelationship, setBereavementRelationship] = useState('');
  const [emergencyLeaveReason, setEmergencyLeaveReason] = useState('');
  const [otherLeaveReason, setOtherLeaveReason] = useState('');
  const [medicalCertificationStatus, setMedicalCertificationStatus] = useState<MedicalCertificationStatus | ''>('');
  const [leavePremiumsAcknowledged, setLeavePremiumsAcknowledged] = useState(false);
  const [leaveReturnCertAcknowledged, setLeaveReturnCertAcknowledged] = useState(false);
  const [employeeLeaveRequestSigned, setEmployeeLeaveRequestSigned] = useState(false);
  const [middleInitial, setMiddleInitial] = useState('');

  // Certification & submission state
  const [attested, setAttested] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // Worker chosen in the ADP search; the fields it fills stay editable.
  const [linkedWorker, setLinkedWorker] = useState<AdpWorker | null>(preSelectedWorker || null);
  const issuesRef = useRef<HTMLDivElement>(null);

  const isTermination = actionType === 'termination';
  const isLeave = actionType === 'leave_of_absence';
  const showPositionSection = actionType === 'campus_transfer' || actionType === 'role_change' || actionType === 'promotion';
  const showCompSection = actionType === 'salary_change' || actionType === 'promotion';
  const proposedLocation = proposedCampus ? locationForCampus(proposedCampus) : undefined;

  const percentDelta = currentSalary > 0 ? ((proposedSalary - currentSalary) / currentSalary) * 100 : 0;
  const salaryDelta = proposedSalary - currentSalary;

  const finalPay = useMemo(
    () => (isTermination ? getTexasFinalPayDeadline(lastDayWorked, isVoluntary) : { basis: '' }),
    [isTermination, lastDayWorked, isVoluntary]
  );
  const cobraAdminNoticeDate = lastDayWorked ? addDaysIso(lastDayWorked, 30) : undefined;

  const payrollCycle = useMemo(
    () => SST_PAYROLL_CYCLES.find(c => c.startDate <= effectiveDate && effectiveDate <= c.endDate),
    [effectiveDate]
  );

  const routingPreview = useMemo(
    () =>
      actionType
        ? buildSstRouting(actionType, isTermination ? isVoluntary === true : false, location, workflowConfig, campus || undefined)
        : [],
    [actionType, isTermination, isVoluntary, location, workflowConfig, campus]
  );

  const sendsDepartmentNotices = actionType !== null && ACTIONS_WITH_DEPARTMENT_NOTICES.includes(actionType);
  const noticeRecipients = useMemo(
    () => (sendsDepartmentNotices && campus ? getDepartmentNotificationRecipients(location, campus) : []),
    [sendsDepartmentNotices, location, campus]
  );

  const { errors, warnings } = useMemo(() => {
    const errs: string[] = [];
    const warns: string[] = [];

    if (!actionType) errs.push('Select the type of personnel action.');
    if (!firstName.trim() || !lastName.trim()) errs.push("Enter the employee's first and last name.");
    if (!employeeId.trim()) errs.push('Enter the ADP Position ID.');
    else if (!isValidAdpPositionId(employeeId) && employeeId.trim() !== linkedWorker?.positionId) {
      errs.push('The ADP Position ID must be 3 letters followed by 6 digits, e.g. UFP000123.');
    }
    if (!title.trim()) errs.push("Enter the employee's current title.");
    if (!campus) errs.push("Select the employee's campus.");
    if (workEmail && !/@ssttx\.org$/i.test(workEmail.trim())) {
      warns.push('The work email is not an @ssttx.org address. Confirm it is correct.');
    }
    if (!effectiveDate) errs.push('Enter the effective date.');

    if (isTermination) {
      if (isVoluntary === null) errs.push('Classify the separation as voluntary or involuntary.');
      if (isSchoolYearNonRenewal === null) errs.push('Indicate whether this is an end-of-year non-renewal.');
      if (!lastDayWorked) errs.push('Enter the last day worked.');
      if (!terminationCode) errs.push('Select a termination reason code.');
      if (reasonForTermination.trim().length < 20) {
        errs.push('Describe the reason for separation (at least 20 characters).');
      }
      if (allPtoEnteredInAdp === null) errs.push('Confirm whether all PTO/UTO/leave has been entered in ADP.');
      if (returnedCharterProperty === null) errs.push('Confirm whether all school property has been returned.');
      if (returnedCharterProperty === false && !outstandingPropertyNotes.trim()) {
        errs.push('List the school property that is still outstanding.');
      }
      if (hasWrittenStatements === null) errs.push('Indicate whether written statements or incident reports exist.');
      if (hasWrittenStatements === true && attachments.length === 0) {
        errs.push('Attach the written statements or incident reports referenced above.');
      }
      if (outstandingStipendsOwed === null) errs.push('Indicate whether any stipends or supplemental pay are owed.');
      if (!rehireEligibility) errs.push('Select rehire eligibility.');
      if (lastDayWorked && effectiveDate && effectiveDate < lastDayWorked) {
        errs.push('The separation effective date cannot be earlier than the last day worked.');
      }

      if (isVoluntary === false && attachments.length === 0) {
        warns.push('Involuntary separations should include supporting documentation (e.g. written warnings, PIP, notice of termination).');
      }
      if (isVoluntary === true && attachments.length === 0) {
        warns.push("Attach the employee's written resignation if one was provided.");
      }
      if (allPtoEnteredInAdp === false) {
        warns.push('Payroll cannot calculate final pay until all PTO/UTO/leave is entered in ADP.');
      }
      if (returnedCharterProperty === true && !(laptopReturned && keysBadgesReturned && sisGradebookClosed)) {
        warns.push('Property was marked returned, but the offboarding checklist is not fully checked.');
      }
      if (finalPay.deadline && finalPay.deadline <= addDaysIso(today, 2)) {
        warns.push(
          finalPay.deadline < today
            ? `The Texas final pay deadline (${formatDate(finalPay.deadline)}) has passed. Notify Payroll immediately.`
            : `The Texas final pay deadline is ${formatDate(finalPay.deadline)}. Notify Payroll now.`
        );
      }
    }

    if (actionType === 'campus_transfer') {
      if (!proposedCampus) errs.push('Select the destination campus.');
      else if (proposedCampus === campus) errs.push('The destination campus must differ from the current campus.');
    }
    if ((actionType === 'role_change' || actionType === 'promotion') && !proposedTitle.trim()) {
      errs.push('Enter the new title.');
    }
    if (actionType === 'role_change' && proposedTitle.trim() && proposedTitle.trim().toLowerCase() === title.trim().toLowerCase()) {
      errs.push('The new title must differ from the current title.');
    }
    if ((actionType === 'campus_transfer' || actionType === 'role_change') && !notesRelatingToPositionChange.trim()) {
      errs.push('Provide the business justification for this change.');
    }

    if (showCompSection) {
      if (currentSalary <= 0) errs.push("Enter the employee's current annual salary.");
      if (proposedSalary <= 0) errs.push('Enter the new annual base salary.');
      if (actionType === 'salary_change' && proposedSalary === currentSalary && stipendAmount <= 0) {
        errs.push('Enter a new base salary or a stipend amount.');
      }
      if (!salaryReason.trim()) errs.push('Enter the reason for the compensation change.');
      if (proposedSalary > 0 && proposedSalary < currentSalary) {
        warns.push(
          actionType === 'promotion'
            ? 'The proposed salary is lower than the current salary for a promotion. Confirm this is intended.'
            : 'This is a pay reduction. The employee must be notified in writing before the new rate applies to work performed.'
        );
      }
    }

    if (isLeave) {
      const has = (t: LeaveType) => leaveTypes.includes(t);
      if (leaveTypes.length === 0) errs.push('Select at least one type of leave.');
      if (has('Bereavement Leave') && !bereavementRelationship) errs.push('Select the relationship of the deceased to the employee.');
      if (has('Emergency Leave') && !emergencyLeaveReason.trim()) errs.push('Specify the reason for the emergency leave.');
      if (has('Other') && !otherLeaveReason.trim()) errs.push('Describe the other type of leave.');
      if (leaveTypes.some(t => MEDICAL_LEAVE_TYPES.includes(t)) && !medicalCertificationStatus) {
        errs.push('Indicate whether the medical certification has been sent to Benefits.');
      }
      if (!firstDayOfEmployment) errs.push("Enter the employee's first day of employment.");
      if (!leaveStartDate) errs.push('Enter the date on which the leave begins.');
      if (!expectedReturnDate) errs.push('Enter the date of anticipated return.');
      if (firstDayOfEmployment && leaveStartDate && leaveStartDate < firstDayOfEmployment) {
        errs.push('The leave cannot begin before the first day of employment.');
      }
      if (!employeeLeaveRequestSigned || !leavePremiumsAcknowledged || !leaveReturnCertAcknowledged) {
        errs.push("Confirm the employee's signed Employee Request For Leave and both agreements.");
      }
      if (has('Family and Medical Leave (FMLA)') && firstDayOfEmployment && leaveStartDate && addDaysIso(firstDayOfEmployment, 365) > leaveStartDate) {
        warns.push('The employee will have worked less than 12 months when the leave begins. FMLA requires 12 months of employment and 1,250 hours worked; Benefits will confirm eligibility.');
      }
      if ((has('Military Leave') || has('Jury Duty or Other Court Appearance')) && attachments.length === 0) {
        warns.push('Attach the military orders or court/jury summons under Supporting documentation.');
      }
      if (leaveStartDate && expectedReturnDate && expectedReturnDate < leaveStartDate) {
        errs.push('The expected return date cannot be earlier than the leave start date.');
      }
      if (isPaidLeave === null) errs.push('Indicate whether the leave is paid or unpaid.');
    }

    if (linkedWorker?.employmentStatus === 'Terminated') {
      warns.push(`ADP already shows ${linkedWorker.fullName} as Terminated. Confirm this request is still needed.`);
    }
    if (effectiveDate && effectiveDate < addDaysIso(today, -30)) {
      warns.push('The effective date is more than 30 days in the past. Retroactive changes may require payroll adjustments.');
    }
    if (!attested) errs.push('Certify that the information in this request is accurate and complete.');

    return { errors: errs, warnings: warns };
  }, [
    actionType, firstName, lastName, employeeId, title, workEmail, effectiveDate, isTermination, isVoluntary,
    isSchoolYearNonRenewal, lastDayWorked, terminationCode, reasonForTermination, allPtoEnteredInAdp,
    returnedCharterProperty, outstandingPropertyNotes, hasWrittenStatements, attachments.length,
    outstandingStipendsOwed, rehireEligibility, laptopReturned, keysBadgesReturned, sisGradebookClosed,
    finalPay.deadline, today, proposedCampus, campus, proposedTitle, notesRelatingToPositionChange,
    showCompSection, currentSalary, proposedSalary, linkedWorker, stipendAmount, salaryReason, isLeave, leaveTypes,
    leaveStartDate, expectedReturnDate, isPaidLeave, attested, firstDayOfEmployment, bereavementRelationship,
    emergencyLeaveReason, otherLeaveReason, medicalCertificationStatus, employeeLeaveRequestSigned,
    leavePremiumsAcknowledged, leaveReturnCertAcknowledged
  ]);

  const requestClose = () => {
    if (!isDirty || window.confirm('Discard this Personnel Action Request? Your entries will not be saved.')) {
      onClose();
    }
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') requestClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  const selectActionType = (type: ActionType) => {
    setActionType(type);
    setIsDirty(true);
    if (!effectiveDateTouched) {
      if (type === 'termination' && lastDayWorked) setEffectiveDate(lastDayWorked);
      else if (type === 'leave_of_absence' && leaveStartDate) setEffectiveDate(leaveStartDate);
    }
    if (type === 'role_change' && !proposedCampus && campus) setProposedCampus(campus);
  };

  const selectClassification = (voluntary: boolean) => {
    setIsVoluntary(voluntary);
    if (terminationCode && !codesFor(voluntary).includes(terminationCode)) setTerminationCode('');
    // Involuntary separations carry a 6-day statutory final-pay deadline.
    if (!priorityTouched) setPriority(voluntary ? 'normal' : 'urgent');
  };

  const selectNonRenewal = (value: boolean) => {
    setIsSchoolYearNonRenewal(value);
  };

  const changeLastDayWorked = (value: string) => {
    setLastDayWorked(value);
    if (!effectiveDateTouched && value) setEffectiveDate(value);
  };

  const changeLeaveStart = (value: string) => {
    setLeaveStartDate(value);
    if (!effectiveDateTouched && value) setEffectiveDate(value);
  };

  const changeCurrentSalary = (value: number) => {
    setCurrentSalary(value);
    if (!proposedSalaryTouched) setProposedSalary(value);
  };

  const applyWorker = (w: AdpWorker) => {
    setLinkedWorker(w);
    setFirstName(w.firstName);
    setLastName(w.lastName);
    setEmployeeId(w.adpId);
    setAssociateId(w.associateId || w.adpId);
    setTitle(w.jobTitle || '');
    setWorkEmail(w.workEmail || '');
    if (w.campus) setCampus(w.campus);
    changeCurrentSalary(w.annualSalary || 0);
    setSupervisorName(w.supervisorName || '');
    setDpsSid(w.dpsSid || '');
    setTrsNotificationRequired(w.trsMember);
    if (w.workerType) setEmploymentStatus(w.workerType);
    if (w.hireDate) setFirstDayOfEmployment(w.hireDate);
    setIsDirty(true);
  };

  const addFiles = (fileList: FileList | null) => {
    if (!fileList) return;
    const files = Array.from(fileList);
    const tooLarge = files.filter(f => f.size > MAX_ATTACHMENT_BYTES);
    setAttachmentError(tooLarge.length ? `${tooLarge.map(f => f.name).join(', ')} exceeds the 10 MB limit.` : '');
    const accepted = files
      .filter(f => f.size <= MAX_ATTACHMENT_BYTES)
      .map(f => ({ id: crypto.randomUUID(), name: f.name, size: f.size, type: f.type || 'application/octet-stream' }));
    setAttachments(prev => [...prev, ...accepted]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitAttempted(true);
    if (errors.length > 0 || !actionType || !campus) {
      requestAnimationFrame(() => issuesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }));
      return;
    }

    const nowIso = new Date().toISOString();
    const randomSuffix = Math.random().toString(36).substring(2, 10).toUpperCase();
    const trackingNumber = `PAR-${new Date().getFullYear()}-${randomSuffix}`;
    const gtpuid = `${crypto.randomUUID()}-${crypto.randomUUID()}`;
    const voluntary = isTermination ? isVoluntary === true : false;
    const routedSteps = buildSstRouting(actionType, voluntary, location, workflowConfig, campus);
    // When the campus principal (or the assigned first approver) submits, the submission is their
    // endorsement: they certify and sign here instead of approving their own PAR afterwards.
    const firstStep = routedSteps[0];
    const submitterEndorses =
      firstStep?.stage === 'supervisor_review' &&
      ((firstStep.assignedEmail || '').toLowerCase() === currentPersona.email.toLowerCase() ||
        (isCampusPrincipal(currentPersona) && currentPersona.campus === campus));
    const routingSteps = submitterEndorses
      ? routedSteps.map((s, i) =>
          i === 0
            ? {
                ...s,
                status: 'approved' as const,
                reviewerName: currentPersona.name,
                decisionDate: nowIso,
                comments: 'Endorsed by the submitting principal at submission.',
                signerId: currentPersona.signerId,
                ipAddress: currentPersona.ipAddress
              }
            : s
        )
      : routedSteps;
    const firstPendingStage = routingSteps.find(s => s.status === 'pending')?.stage || 'completed';
    const actionLabel = actionTypes.find(a => a.type === actionType)?.label || actionType;
    const resolvedProposedCampus = proposedCampus || campus;

    const newPar: PersonnelActionRequest = {
      id: `par-${Date.now()}`,
      trackingNumber,
      gtpuid,
      actionType,
      priority,
      currentStage: firstPendingStage,
      effectiveDate,

      employeeId: employeeId.trim().toUpperCase(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      middleInitial: middleInitial.trim().toUpperCase() || undefined,
      title: title.trim(),
      location,
      campus,
      employmentStatus,
      workEmail: workEmail.trim(),
      associateId: associateId || employeeId.trim().toUpperCase(),
      dpsSid: dpsSid.trim() || undefined,
      currentSalary,

      // Separation documentation
      isVoluntary: isTermination ? voluntary : undefined,
      isSchoolYearNonRenewal: isTermination ? isSchoolYearNonRenewal === true : undefined,
      lastDayWorked: isTermination ? lastDayWorked : undefined,
      reasonForTermination: isTermination ? reasonForTermination.trim() : undefined,
      terminationCode: isTermination ? terminationCode : undefined,
      allPtoEnteredInAdp: isTermination ? allPtoEnteredInAdp === true : undefined,
      returnedCharterProperty: isTermination ? returnedCharterProperty === true : undefined,
      laptopReturned: isTermination ? laptopReturned : undefined,
      keysBadgesReturned: isTermination ? keysBadgesReturned : undefined,
      sisGradebookClosed: isTermination ? sisGradebookClosed : undefined,
      outstandingPropertyNotes: isTermination && returnedCharterProperty === false ? outstandingPropertyNotes.trim() : undefined,
      trsNotificationRequired: isTermination || isLeave ? trsNotificationRequired : undefined,
      contractType,
      cobraNoticeDueDate: isTermination ? cobraAdminNoticeDate : undefined,
      hasWrittenStatements: isTermination ? hasWrittenStatements === true : undefined,
      outstandingStipendsOwed: isTermination ? outstandingStipendsOwed === true : undefined,
      finalPayCheckComment: isTermination ? finalPayCheckComment.trim() || undefined : undefined,
      rehireEligibility: isTermination ? (rehireEligibility || undefined) : undefined,
      markRehireStatus: isTermination ? rehireEligibility === 'Yes' : undefined,
      finalPayDeadline: isTermination ? finalPay.deadline : undefined,
      immediatePayoutRequired: isTermination ? !voluntary : undefined,
      isPartTimeOrSub: employmentStatus !== 'Full-time',
      startDate: linkedWorker?.hireDate || undefined,
      endDate: isTermination ? lastDayWorked : undefined,

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

      // Position changes
      proposedCampus: actionType === 'campus_transfer' || actionType === 'role_change' ? resolvedProposedCampus : undefined,
      proposedLocation:
        actionType === 'campus_transfer' || actionType === 'role_change' ? locationForCampus(resolvedProposedCampus) : undefined,
      proposedTitle: showPositionSection ? proposedTitle.trim() || title.trim() : undefined,
      proposedSupervisor: showPositionSection ? proposedSupervisor.trim() || undefined : undefined,
      notesRelatingToPositionChange: showPositionSection ? notesRelatingToPositionChange.trim() || undefined : undefined,

      // Compensation
      proposedSalary: showCompSection ? proposedSalary : undefined,
      stipendAmount: actionType === 'salary_change' && stipendAmount > 0 ? stipendAmount : undefined,
      percentIncrease: showCompSection ? percentDelta : undefined,
      salaryChangeReason: showCompSection ? salaryReason.trim() : undefined,

      // Leave of absence
      leaveType: isLeave ? leaveTypes[0] : undefined,
      leaveTypes: isLeave ? leaveTypes : undefined,
      firstDayOfEmployment: isLeave ? firstDayOfEmployment : undefined,
      bereavementRelationship: isLeave && leaveTypes.includes('Bereavement Leave') ? bereavementRelationship : undefined,
      emergencyLeaveReason: isLeave && leaveTypes.includes('Emergency Leave') ? emergencyLeaveReason.trim() : undefined,
      otherLeaveReason: isLeave && leaveTypes.includes('Other') ? otherLeaveReason.trim() : undefined,
      medicalCertificationStatus:
        isLeave && leaveTypes.some(t => MEDICAL_LEAVE_TYPES.includes(t)) ? (medicalCertificationStatus || undefined) : undefined,
      leavePremiumsAcknowledged: isLeave ? leavePremiumsAcknowledged : undefined,
      leaveReturnCertAcknowledged: isLeave ? leaveReturnCertAcknowledged : undefined,
      employeeLeaveRequestSigned: isLeave ? employeeLeaveRequestSigned : undefined,
      leaveStartDate: isLeave ? leaveStartDate : undefined,
      expectedReturnDate: isLeave ? expectedReturnDate : undefined,
      isPaidLeave: isLeave ? isPaidLeave === true : undefined,

      submittedBy: currentPersona.name,
      submitterEmail: currentPersona.email,
      submitterRole: currentPersona.role,
      submittedAt: nowIso,
      updatedAt: nowIso,

      routingSteps,
      // Leave of Absence is signed by the Regional HR Coordinator and Benefits only.
      electronicSignatures: ((list: ElectronicSignatureRecord[]) =>
        isLeave ? list.filter(sig => sig.signingParty === 'HR' || sig.signingParty === 'Benefits') : list)([
        {
          signingParty: 'Supervisor',
          signerName: currentPersona.name,
          signerEmail: currentPersona.email,
          signerId: currentPersona.signerId,
          ipAddress: currentPersona.ipAddress,
          status: submitterEndorses ? 'signed' : 'pending',
          timestamp: submitterEndorses ? `${new Date().toLocaleString('en-US')} (${nowIso})` : undefined,
          notes: submitterEndorses ? 'Signed at submission by the submitting principal (Google sign-in + certification).' : undefined
        },
        ...(isTermination && voluntary
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
        ...(isTermination || isLeave ? [{
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
      ]),
      comments: [
        {
          id: `comm-${Date.now()}`,
          authorName: currentPersona.name,
          authorRole: currentPersona.role,
          authorDepartment: currentPersona.department,
          timestamp: nowIso,
          message: `Submitted ${trackingNumber}: ${actionLabel} for ${firstName.trim()} ${lastName.trim()} (${campus}, ADP Position ID ${employeeId.trim()}), effective ${formatDate(effectiveDate)}. Submitter certified the request as accurate and complete. ${submitterEndorses ? 'Principal endorsement recorded at submission. ' : ''}Routed to ${routingSteps.find(s => s.status === 'pending')?.stageLabel || 'the next approver'}.`
        }
      ],

      attachments: attachments.map(att => ({
        id: `att-${att.id}`,
        name: att.name,
        size: formatBytes(att.size),
        uploadedBy: currentPersona.name,
        uploadedAt: nowIso,
        fileType: att.type
      })),
      departmentNotifications: noticeRecipients
    };

    onSubmitPar(newPar);
  };

  const actionTypes: { type: ActionType; label: string; description: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { type: 'termination', label: 'Separation', description: 'Resignation, termination, non-renewal, retirement', icon: UserMinus },
    { type: 'campus_transfer', label: 'Campus Transfer', description: 'Move to another SST campus', icon: ArrowRightLeft },
    { type: 'salary_change', label: 'Compensation Change', description: 'Base salary or stipend adjustment', icon: BadgeDollarSign },
    { type: 'role_change', label: 'Role / Title Change', description: 'Lateral change in position or title', icon: UserCheck },
    { type: 'promotion', label: 'Promotion', description: 'Higher-level role with new pay', icon: TrendingUp },
    { type: 'leave_of_absence', label: 'Leave of Absence', description: 'FMLA, medical, parental, military, personal', icon: CalendarClock },
  ];

  const effectiveDateLabel = isTermination
    ? 'Separation effective date'
    : isLeave
      ? 'Leave effective date'
      : 'Effective date';

  let step = 2;
  const nextStep = () => ++step;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 md:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="par-form-title"
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">

        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-white flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <img src={SST_DEFAULT_LOGO} alt="School of Science and Technology" className="h-12 w-auto object-contain" />
            <div>
              <h2 id="par-form-title" className="text-base font-bold text-slate-900 tracking-tight">
                Personnel Action Request
              </h2>
              <p className="text-xs text-slate-500">
                School of Science and Technology · Human Resources
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={requestClose}
            aria-label="Close form"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          onChange={() => setIsDirty(true)}
          noValidate
          className="flex-1 flex flex-col min-h-0"
        >
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 text-xs text-slate-800 bg-slate-50/60">

            <p className="text-[11px] text-slate-500">
              Fields marked <span className="text-rose-600">*</span> are required. This request is a personnel record. Keep all entries factual and job-related.
            </p>

            {/* 1. Action type */}
            <Section step={1} title="Type of action" description="The action type determines the questions below and the approval route.">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2" role="radiogroup" aria-label="Type of action">
                {actionTypes.map(item => {
                  const Icon = item.icon;
                  const isSelected = actionType === item.type;
                  return (
                    <button
                      key={item.type}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      onClick={() => selectActionType(item.type)}
                      className={`p-3 rounded-lg border text-left flex items-start gap-2.5 transition-all ${
                        isSelected
                          ? 'bg-[#0f2352]/5 border-[#0f2352] ring-2 ring-[#0f2352]/15'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className={`p-1.5 rounded-md shrink-0 ${isSelected ? 'bg-[#0f2352] text-white' : 'bg-slate-100 text-slate-600'}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className={`text-xs font-bold ${isSelected ? 'text-[#0f2352]' : 'text-slate-800'}`}>{item.label}</div>
                        <div className="text-[10px] text-slate-500 leading-snug">{item.description}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </Section>

            {/* 2. Employee */}
            <Section step={2} title="Employee information" description="Search ADP to fill these fields, or enter them exactly as they appear in ADP Workforce Now.">
              <AdpEmployeeSearch idPrefix="par-lookup" onSelect={applyWorker} inputClassName={inputCls} />

              {linkedWorker && (
                <div className="flex items-start justify-between gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
                  <div className="flex items-start gap-2 text-[11px] text-emerald-900">
                    <Link2 className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                    <span>
                      Filled from ADP: <strong>{linkedWorker.fullName}</strong> ({linkedWorker.adpId}). Check each field. You can still edit any of them.
                      {!linkedWorker.campus && linkedWorker.locationName && (
                        <> ADP location “{linkedWorker.locationName}” did not match an SST campus, so select the campus below.</>
                      )}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setLinkedWorker(null)}
                    className="shrink-0 text-[11px] font-semibold text-emerald-900 hover:underline"
                  >
                    Unlink
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Field label="First name" htmlFor="par-first" required>
                  <input id="par-first" name="par-first" type="text" required autoComplete="off" data-1p-ignore data-lpignore="true" value={firstName}
                    onChange={e => setFirstName(e.target.value)} className={inputCls} />
                </Field>
                <Field label="Last name" htmlFor="par-last" required>
                  <input id="par-last" name="par-last" type="text" required autoComplete="off" data-1p-ignore data-lpignore="true" value={lastName}
                    onChange={e => setLastName(e.target.value)} className={inputCls} />
                </Field>
                <Field label="MI" htmlFor="par-mi">
                  <input id="par-mi" name="par-mi" type="text" maxLength={1} autoComplete="off" data-1p-ignore data-lpignore="true"
                    value={middleInitial} onChange={e => setMiddleInitial(e.target.value.replace(/[^A-Za-z]/g, '').toUpperCase())}
                    className={`${inputCls} w-16`} />
                </Field>
                <Field label="ADP Position ID" htmlFor="par-adp" required>
                  <input
                    id="par-adp"
                    name="par-adp"
                    data-1p-ignore
                    data-lpignore="true"
                    type="text"
                    required
                    autoComplete="off"
                    value={employeeId}
                    onChange={e => {
                      if (!associateId || associateId === employeeId) setAssociateId(e.target.value);
                      setEmployeeId(e.target.value);
                    }}
                    placeholder="e.g. UFP000123"
                    className={`${inputCls} font-mono uppercase`}
                  />
                </Field>

                <Field label="Current title" htmlFor="par-title" required>
                  <input id="par-title" name="par-title" autoComplete="off" data-1p-ignore data-lpignore="true" type="text" required value={title}
                    onChange={e => setTitle(e.target.value)} placeholder="e.g. Science Teacher" className={inputCls} />
                </Field>
                <Field label="Campus" htmlFor="par-campus" required hint={campus ? `Region: ${location}` : 'Determines the regional approvers.'}>
                  <select
                    id="par-campus"
                    value={campus}
                    onChange={e => setCampus(e.target.value as Campus)}
                    className={inputCls}
                  >
                    <option value="">Select a campus…</option>
                    {Object.entries(SST_CAMPUS_REGIONS).map(([region, campuses]) => (
                      <optgroup key={region} label={region}>
                        {campuses.map(c => <option key={c} value={c}>{c}</option>)}
                      </optgroup>
                    ))}
                  </select>
                </Field>
                <Field label="Work email" htmlFor="par-email">
                  <input id="par-email" name="par-email" autoComplete="off" data-1p-ignore data-lpignore="true" type="email" value={workEmail}
                    onChange={e => setWorkEmail(e.target.value)} placeholder="name@ssttx.org" className={`${inputCls} font-mono`} />
                </Field>

                <Field label="Employment status" htmlFor="par-status">
                  <select id="par-status" value={employmentStatus}
                    onChange={e => setEmploymentStatus(e.target.value as 'Full-time' | 'Part-time' | 'Sub')} className={inputCls}>
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Sub">Substitute</option>
                  </select>
                </Field>
                <Field label="Current annual salary" htmlFor="par-salary" required={showCompSection}
                  hint="Used by Payroll to calculate daily rate and final pay.">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                    <input
                      id="par-salary"
                      type="number"
                      min="0"
                      step="1"
                      inputMode="decimal"
                      value={currentSalary || ''}
                      onChange={e => changeCurrentSalary(parseFloat(e.target.value) || 0)}
                      className={`${inputCls} pl-6`}
                    />
                  </div>
                </Field>
                <Field label="Direct supervisor" htmlFor="par-supervisor">
                  <input id="par-supervisor" name="par-supervisor" autoComplete="off" data-1p-ignore data-lpignore="true" type="text" value={supervisorName}
                    onChange={e => setSupervisorName(e.target.value)} className={inputCls} />
                </Field>

                <Field label="DPS SID" htmlFor="par-dps" hint="Texas DPS State ID from the fingerprint record, if on file.">
                  <input id="par-dps" name="par-dps" autoComplete="off" data-1p-ignore data-lpignore="true" type="text" value={dpsSid}
                    onChange={e => setDpsSid(e.target.value)} className={`${inputCls} font-mono`} />
                </Field>
                <Field label="Employment agreement">
                  <div className="px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-700">
                    At-Will (Texas)
                  </div>
                </Field>
              </div>
            </Section>

            {/* 3a. Separation */}
            {isTermination && (
              <Section step={nextStep()} title="Separation details" description="Answer every question. These answers drive routing, final pay timing, and offboarding.">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <YesNo
                    name="par-voluntary"
                    question="Separation classification"
                    value={isVoluntary}
                    onChange={selectClassification}
                    yesLabel="Voluntary (employee resigned)"
                    noLabel="Involuntary (SST ended employment)"
                  />
                  <YesNo
                    name="par-nonrenewal"
                    question="End-of-school-year non-renewal?"
                    value={isSchoolYearNonRenewal}
                    onChange={selectNonRenewal}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Field label="Last day worked" htmlFor="par-ldw" required>
                    <input id="par-ldw" type="date" required value={lastDayWorked}
                      onChange={e => changeLastDayWorked(e.target.value)} className={inputCls} />
                  </Field>
                  <Field label="ADP termination reason" htmlFor="par-code" required className="sm:col-span-2"
                    hint={isVoluntary === null
                      ? 'Choose a classification to see the matching ADP reasons.'
                      : 'Same reason code Payroll enters in ADP Workforce Now.'}>
                    <select id="par-code" required value={terminationCode}
                      onChange={e => setTerminationCode(e.target.value)} className={inputCls}>
                      <option value="">Select a reason…</option>
                      {Array.from(new Set(reasonsFor(isVoluntary).map(r => r.group))).map(group => (
                        <optgroup key={group} label={group}>
                          {reasonsFor(isVoluntary).filter(r => r.group === group).map(r => (
                            <option key={r.code} value={formatTerminationCode(r)}>{formatTerminationCode(r)}</option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </Field>
                </div>

                <Field
                  label="Reason for separation"
                  htmlFor="par-reason"
                  required
                  hint="State the facts: dates, events, and the policy involved. Do not include opinions, medical details, or protected characteristics."
                >
                  <textarea
                    id="par-reason"
                    rows={3}
                    required
                    value={reasonForTermination}
                    onChange={e => setReasonForTermination(e.target.value)}
                    className={inputCls}
                    placeholder="e.g. Employee was scheduled to begin 9/15/2026, did not report, and did not respond to calls or emails on 9/15, 9/16, or 9/17."
                  />
                </Field>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <YesNo
                    name="par-pto"
                    question="All PTO/UTO/leave entered in ADP?"
                    hint="Leave must be entered before Payroll can calculate final pay."
                    value={allPtoEnteredInAdp}
                    onChange={setAllPtoEnteredInAdp}
                  />
                  <YesNo
                    name="par-stipends"
                    question="Any stipends or supplemental pay owed?"
                    value={outstandingStipendsOwed}
                    onChange={setOutstandingStipendsOwed}
                  />
                  <YesNo
                    name="par-property"
                    question="All school property returned?"
                    value={returnedCharterProperty}
                    onChange={setReturnedCharterProperty}
                  >
                    {returnedCharterProperty === true && (
                      <div className="mt-2.5 pt-2.5 border-t border-slate-100 space-y-1.5 text-[11px] text-slate-700">
                        <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Offboarding checklist</div>
                        {[
                          { label: 'Laptop and charger returned to IT', checked: laptopReturned, set: setLaptopReturned },
                          { label: 'Keys and ID/access badge returned', checked: keysBadgesReturned, set: setKeysBadgesReturned },
                          { label: 'Gradebook finalized and student records handed off', checked: sisGradebookClosed, set: setSisGradebookClosed }
                        ].map(item => (
                          <label key={item.label} className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={item.checked} onChange={e => item.set(e.target.checked)}
                              className="rounded accent-[#0f2352]" />
                            <span>{item.label}</span>
                          </label>
                        ))}
                      </div>
                    )}
                    {returnedCharterProperty === false && (
                      <div className="mt-2.5">
                        <label htmlFor="par-property-notes" className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Items still outstanding<span className="text-rose-600 ml-0.5">*</span>
                        </label>
                        <textarea id="par-property-notes" rows={2} value={outstandingPropertyNotes}
                          onChange={e => setOutstandingPropertyNotes(e.target.value)} className={inputCls}
                          placeholder="e.g. Dell laptop (asset #SST-4471), classroom keys" />
                        <p className="mt-1 text-[10px] text-slate-500">
                          Payroll may not deduct the value of unreturned property from final pay without the employee's written authorization.
                        </p>
                      </div>
                    )}
                  </YesNo>
                  <YesNo
                    name="par-statements"
                    question="Written statements or incident reports on file?"
                    hint="If yes, attach them under Supporting documentation."
                    value={hasWrittenStatements}
                    onChange={setHasWrittenStatements}
                  />
                </div>

                <Field label="Eligible for rehire" htmlFor="par-rehire" required
                  hint="Use Review Required when HR should decide, for example when an investigation is pending.">
                  <div id="par-rehire" className="flex flex-wrap gap-2" role="radiogroup" aria-label="Eligible for rehire">
                    {(['Yes', 'No', 'Review Required'] as RehireEligibility[]).map(option => (
                      <label key={option}
                        className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1 cursor-pointer ${
                          rehireEligibility === option
                            ? 'border-[#0f2352] bg-[#0f2352]/5 text-[#0f2352] font-semibold'
                            : 'border-slate-200 text-slate-700 hover:border-slate-300'
                        }`}>
                        <input type="radio" name="par-rehire" checked={rehireEligibility === option}
                          onChange={() => setRehireEligibility(option)} className="accent-[#0f2352]" />
                        <span>{option}</span>
                      </label>
                    ))}
                  </div>
                </Field>

                {/* Statutory deadlines */}
                <div className="rounded-lg border border-blue-200 bg-blue-50/60 p-3 space-y-2.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-blue-950">
                    <ShieldCheck className="w-4 h-4" />
                    Compliance deadlines
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
                    <div>
                      <div className="text-slate-500">Final pay due (Tex. Lab. Code § 61.014)</div>
                      <div className="text-sm font-bold text-slate-900">
                        {finalPay.deadline ? formatDate(finalPay.deadline) : '—'}
                      </div>
                      <div className="text-[10px] text-slate-500">{finalPay.basis}</div>
                    </div>
                    <div>
                      <div className="text-slate-500">COBRA: employer notice to plan administrator</div>
                      <div className="text-sm font-bold text-slate-900">
                        {cobraAdminNoticeDate ? formatDate(cobraAdminNoticeDate) : '—'}
                      </div>
                      <div className="text-[10px] text-slate-500">Due within 30 days of the qualifying event, if the employee was enrolled in benefits.</div>
                    </div>
                  </div>
                  <label className="flex items-center gap-2 text-[11px] text-blue-950 cursor-pointer pt-2 border-t border-blue-200">
                    <input type="checkbox" checked={trsNotificationRequired}
                      onChange={e => setTrsNotificationRequired(e.target.checked)} className="rounded accent-[#0f2352]" />
                    <span>Employee is a TRS member. Report the separation to the Teacher Retirement System.</span>
                  </label>
                </div>

                <Field label="Notes for Payroll (final paycheck)" htmlFor="par-final-pay"
                  hint="Optional. For example, the delivery method or amounts owed that are not in ADP.">
                  <input id="par-final-pay" type="text" value={finalPayCheckComment}
                    onChange={e => setFinalPayCheckComment(e.target.value)} className={inputCls} />
                </Field>
              </Section>
            )}

            {/* 3b. Position change */}
            {showPositionSection && (
              <Section
                step={nextStep()}
                title={actionType === 'promotion' ? 'New position' : actionType === 'campus_transfer' ? 'Transfer details' : 'New role details'}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {actionType !== 'promotion' && (
                    <Field label="Destination campus" htmlFor="par-dest-campus" required={actionType === 'campus_transfer'}
                      hint={proposedLocation ? `Region: ${proposedLocation}` : undefined}>
                      <select id="par-dest-campus" value={proposedCampus}
                        onChange={e => setProposedCampus(e.target.value as Campus)} className={inputCls}>
                        <option value="">Select a campus…</option>
                        {Object.entries(SST_CAMPUS_REGIONS).map(([region, campuses]) => (
                          <optgroup key={region} label={region}>
                            {campuses.map(c => (
                              <option key={c} value={c}>{c}{c === campus ? ' (current)' : ''}</option>
                            ))}
                          </optgroup>
                        ))}
                      </select>
                    </Field>
                  )}
                  <Field label="New title" htmlFor="par-new-title" required={actionType !== 'campus_transfer'}
                    hint={actionType === 'campus_transfer' ? 'Leave blank if the title is unchanged.' : undefined}>
                    <input id="par-new-title" name="par-new-title" autoComplete="off" data-1p-ignore data-lpignore="true" type="text" value={proposedTitle}
                      onChange={e => setProposedTitle(e.target.value)} placeholder={title || 'e.g. Science Teacher'} className={inputCls} />
                  </Field>
                  <Field label="Receiving supervisor" htmlFor="par-new-supervisor">
                    <input id="par-new-supervisor" name="par-new-supervisor" autoComplete="off" data-1p-ignore data-lpignore="true" type="text" value={proposedSupervisor}
                      onChange={e => setProposedSupervisor(e.target.value)} className={inputCls} />
                  </Field>
                </div>
                <Field label="Business justification" htmlFor="par-justification" required={actionType !== 'promotion'}
                  hint="Explain the staffing need or reason for the change.">
                  <textarea id="par-justification" rows={2} value={notesRelatingToPositionChange}
                    onChange={e => setNotesRelatingToPositionChange(e.target.value)} className={inputCls} />
                </Field>
              </Section>
            )}

            {/* 3c. Compensation */}
            {showCompSection && (
              <Section step={nextStep()} title="Compensation" description="Enter annual amounts. Payroll prorates them by pay period.">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Field label="New annual base salary" htmlFor="par-new-salary" required>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                      <input
                        id="par-new-salary"
                        type="number"
                        min="0"
                        step="1"
                        inputMode="decimal"
                        value={proposedSalary || ''}
                        onChange={e => {
                          setProposedSalary(parseFloat(e.target.value) || 0);
                          setProposedSalaryTouched(true);
                        }}
                        className={`${inputCls} pl-6 font-semibold`}
                      />
                    </div>
                    {currentSalary > 0 && proposedSalary > 0 && (
                      <div className={`mt-1 text-[11px] font-semibold ${salaryDelta < 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
                        {salaryDelta >= 0 ? '+' : '−'}{formatCurrency(Math.abs(salaryDelta))} ({salaryDelta >= 0 ? '+' : '−'}{Math.abs(percentDelta).toFixed(1)}%) vs. {formatCurrency(currentSalary)}
                      </div>
                    )}
                  </Field>
                  {actionType === 'salary_change' && (
                    <Field label="Annual stipend" htmlFor="par-stipend" hint="Optional. Leave blank if there is no stipend.">
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                        <input id="par-stipend" type="number" min="0" step="1" inputMode="decimal"
                          value={stipendAmount || ''} onChange={e => setStipendAmount(parseFloat(e.target.value) || 0)}
                          className={`${inputCls} pl-6`} />
                      </div>
                    </Field>
                  )}
                  <Field label="Reason for change" htmlFor="par-comp-reason" required
                    className={actionType === 'salary_change' ? '' : 'sm:col-span-2'}>
                    <input id="par-comp-reason" type="text" value={salaryReason}
                      onChange={e => setSalaryReason(e.target.value)} className={inputCls}
                      placeholder={actionType === 'promotion' ? 'e.g. Promotion to Assistant Principal' : 'e.g. AP Physics stipend, 2026-27 SY'} />
                  </Field>
                </div>
              </Section>
            )}

            {/* 3d. Leave of absence (SST Employee Request For Leave) */}
            {isLeave && (
              <Section step={nextStep()} title="Leave details"
                description="From the employee's signed SST Employee Request For Leave. Benefits confirms FMLA eligibility and sends the required notices.">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Field label="First day of employment" htmlFor="par-first-day" required hint={linkedWorker?.hireDate ? 'From ADP (original hire date).' : undefined}>
                    <input id="par-first-day" type="date" value={firstDayOfEmployment}
                      onChange={e => setFirstDayOfEmployment(e.target.value)} className={inputCls} />
                  </Field>
                  <Field label="Date on which leave begins" htmlFor="par-leave-start" required>
                    <input id="par-leave-start" type="date" value={leaveStartDate}
                      onChange={e => changeLeaveStart(e.target.value)} className={inputCls} />
                  </Field>
                  <Field label="Date of anticipated return" htmlFor="par-leave-return" required>
                    <input id="par-leave-return" type="date" value={expectedReturnDate} min={leaveStartDate || undefined}
                      onChange={e => setExpectedReturnDate(e.target.value)} className={inputCls} />
                  </Field>
                </div>

                <fieldset className="rounded-lg border border-slate-200 p-3 space-y-2">
                  <legend className="px-1 text-xs font-semibold text-slate-800">
                    Type of leave<span className="text-rose-600 ml-0.5">*</span>
                    <span className="ml-1 font-normal text-slate-500">(select all that apply)</span>
                  </legend>
                  {LEAVE_TYPES.map(t => {
                    const checked = leaveTypes.includes(t);
                    return (
                      <div key={t} className={`rounded-md border px-3 py-2 ${checked ? 'border-[#0f2352] bg-[#0f2352]/5' : 'border-slate-200'}`}>
                        <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-800">
                          <input type="checkbox" checked={checked} className="rounded accent-[#0f2352]"
                            onChange={e => setLeaveTypes(prev => e.target.checked ? [...prev, t] : prev.filter(x => x !== t))} />
                          {t}
                        </label>
                        {checked && t === 'Family and Medical Leave (FMLA)' && (
                          <p className="mt-1.5 ml-6 text-[11px] text-slate-600">
                            The employee's health care provider completes{' '}
                            <a href="https://www.dol.gov/agencies/whd/forms/wh380e" target="_blank" rel="noreferrer" className="font-semibold text-[#0f2352] underline">WH-380-E</a>{' '}
                            (employee's own condition) or{' '}
                            <a href="https://www.dol.gov/agencies/whd/forms/wh380f" target="_blank" rel="noreferrer" className="font-semibold text-[#0f2352] underline">WH-380-F</a>{' '}
                            (family member's condition).
                          </p>
                        )}
                        {checked && t === 'Short-term Disability Leave' && (
                          <p className="mt-1.5 ml-6 text-[11px] text-slate-600">Requires a medical certification from the employee's health care provider.</p>
                        )}
                        {checked && t === 'Bereavement Leave' && (
                          <div className="mt-1.5 ml-6 max-w-xs">
                            <label htmlFor="par-bereavement" className="block text-[11px] text-slate-600 mb-1">
                              Relationship of the deceased to the employee<span className="text-rose-600 ml-0.5">*</span>
                            </label>
                            <select id="par-bereavement" value={bereavementRelationship}
                              onChange={e => setBereavementRelationship(e.target.value)} className={inputCls}>
                              <option value="">Select…</option>
                              {BEREAVEMENT_RELATIONSHIPS.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                          </div>
                        )}
                        {checked && t === 'Military Leave' && (
                          <p className="mt-1.5 ml-6 text-[11px] text-slate-600">Attach documentation of military service (e.g. orders) under Supporting documentation.</p>
                        )}
                        {checked && t === 'Emergency Leave' && (
                          <div className="mt-1.5 ml-6">
                            <label htmlFor="par-emergency" className="block text-[11px] text-slate-600 mb-1">Specify the reason<span className="text-rose-600 ml-0.5">*</span></label>
                            <input id="par-emergency" type="text" value={emergencyLeaveReason}
                              onChange={e => setEmergencyLeaveReason(e.target.value)} className={inputCls} />
                          </div>
                        )}
                        {checked && t === 'Jury Duty or Other Court Appearance' && (
                          <p className="mt-1.5 ml-6 text-[11px] text-slate-600">Attach the jury summons or court documentation under Supporting documentation.</p>
                        )}
                        {checked && t === 'Other' && (
                          <div className="mt-1.5 ml-6">
                            <label htmlFor="par-other-leave" className="block text-[11px] text-slate-600 mb-1">Describe the leave<span className="text-rose-600 ml-0.5">*</span></label>
                            <input id="par-other-leave" type="text" value={otherLeaveReason}
                              onChange={e => setOtherLeaveReason(e.target.value)} className={inputCls} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </fieldset>

                {leaveTypes.some(t => MEDICAL_LEAVE_TYPES.includes(t)) && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 space-y-2 text-[11px] text-amber-950">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-px" />
                      <span>
                        A leave based on the employee's or a family member's serious health condition requires a medical certification
                        from a physician. <strong>Send it directly to Benefits; do not attach it to this PAR</strong> (medical records are kept
                        in a separate confidential file). Do not enter a diagnosis on this form.
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2 pl-6" role="radiogroup" aria-label="Medical certification">
                      {(['Sent to Benefits', 'Employee will send to Benefits'] as MedicalCertificationStatus[]).map(v => (
                        <label key={v} className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1 cursor-pointer bg-white ${
                          medicalCertificationStatus === v ? 'border-[#0f2352] text-[#0f2352] font-semibold' : 'border-amber-200'}`}>
                          <input type="radio" name="par-med-cert" checked={medicalCertificationStatus === v}
                            onChange={() => setMedicalCertificationStatus(v)} className="accent-[#0f2352]" />
                          Medical certification: {v.toLowerCase()}
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <YesNo name="par-leave-paid" question="Pay status during leave" value={isPaidLeave}
                    onChange={setIsPaidLeave} yesLabel="Paid (using accrued leave)" noLabel="Unpaid" />
                  <label className="flex items-start gap-2 rounded-lg border border-slate-200 p-3 text-[11px] text-slate-700 cursor-pointer">
                    <input type="checkbox" checked={trsNotificationRequired}
                      onChange={e => setTrsNotificationRequired(e.target.checked)} className="mt-0.5 rounded accent-[#0f2352]" />
                    <span>Employee is a TRS member. Report the leave status to the Teacher Retirement System.</span>
                  </label>
                </div>

                <fieldset className="rounded-lg border border-slate-200 p-3 space-y-2 text-[11px] text-slate-700">
                  <legend className="px-1 text-xs font-semibold text-slate-800">
                    Employee's request and agreements<span className="text-rose-600 ml-0.5">*</span>
                  </legend>
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input type="checkbox" checked={employeeLeaveRequestSigned} onChange={e => setEmployeeLeaveRequestSigned(e.target.checked)} className="mt-0.5 rounded accent-[#0f2352]" />
                    <span>The employee completed and signed the SST <strong>Employee Request For Leave</strong>.</span>
                  </label>
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input type="checkbox" checked={leavePremiumsAcknowledged} onChange={e => setLeavePremiumsAcknowledged(e.target.checked)} className="mt-0.5 rounded accent-[#0f2352]" />
                    <span>
                      The employee agreed that while on leave they are responsible for paying all benefit premiums, in full upfront or
                      each pay cycle, unless they discontinue coverage; coverage ends if payments are late. Benefits will contact them about a payment plan.
                    </span>
                  </label>
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input type="checkbox" checked={leaveReturnCertAcknowledged} onChange={e => setLeaveReturnCertAcknowledged(e.target.checked)} className="mt-0.5 rounded accent-[#0f2352]" />
                    <span>
                      The employee agreed to provide medical certification if they cannot perform their job functions, or are needed to care for a
                      spouse, parent, or child with a serious health condition, when the leave expires, and understands they may not resume their
                      position until they do.
                    </span>
                  </label>
                  <p className="text-slate-500">Falsification of the request or a doctor's statement may result in disciplinary action, including denied leave or termination.</p>
                </fieldset>
              </Section>
            )}

            {/* Supporting documentation */}
            {actionType && (
              <Section
                step={nextStep()}
                title="Supporting documentation"
                description={
                  isTermination
                    ? 'For example: the resignation letter, written warnings, PIP, notice of termination, or relevant emails.'
                    : isLeave
                      ? "For example: the employee's signed Employee Request For Leave, military orders, or a jury summons. Never attach medical records here."
                      : 'Attach any documents that support this request (optional).'
                }
              >
                <label
                  htmlFor="par-files"
                  className="flex flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-center cursor-pointer hover:border-[#0f2352]/50 hover:bg-white transition-colors"
                >
                  <Paperclip className="w-4 h-4 text-slate-500" />
                  <span className="text-xs font-semibold text-slate-700">Choose files to attach</span>
                  <span className="text-[10px] text-slate-500">PDF, image, Word, or email files · up to 10 MB each</span>
                  <input
                    id="par-files"
                    type="file"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png,.heic,.doc,.docx,.eml,.msg"
                    className="sr-only"
                    onChange={e => {
                      addFiles(e.target.files);
                      e.target.value = '';
                    }}
                  />
                </label>
                {attachmentError && <p className="text-[11px] text-rose-700">{attachmentError}</p>}
                {attachments.length > 0 && (
                  <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
                    {attachments.map(att => (
                      <li key={att.id} className="flex items-center justify-between gap-3 px-3 py-2">
                        <span className="truncate font-medium text-slate-800">{att.name}</span>
                        <span className="flex items-center gap-3 shrink-0 text-[11px] text-slate-500">
                          {formatBytes(att.size)}
                          <button type="button" aria-label={`Remove ${att.name}`}
                            onClick={() => setAttachments(prev => prev.filter(a => a.id !== att.id))}
                            className="p-1 rounded text-slate-400 hover:text-rose-700 hover:bg-rose-50">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </Section>
            )}

            {/* Timing & priority */}
            {actionType && (
              <Section step={nextStep()} title="Timing and priority">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field
                    label={effectiveDateLabel}
                    htmlFor="par-effective"
                    required
                    hint={
                      payrollCycle
                        ? `Falls in payroll period ${payrollCycle.periodNumber}. Corrections are due ${formatDate(payrollCycle.cutoffDate)} and the pay date is ${formatDate(payrollCycle.payDate)}.`
                        : 'This date is outside the loaded 2026–27 payroll calendar.'
                    }
                  >
                    <input
                      id="par-effective"
                      type="date"
                      required
                      value={effectiveDate}
                      onChange={e => {
                        setEffectiveDate(e.target.value);
                        setEffectiveDateTouched(true);
                      }}
                      className={inputCls}
                    />
                  </Field>
                  <Field
                    label="Routing priority"
                    htmlFor="par-priority"
                    hint={isTermination && isVoluntary === false ? 'Involuntary separations default to Urgent because of the 6-day final pay deadline.' : undefined}
                  >
                    <select
                      id="par-priority"
                      value={priority}
                      onChange={e => {
                        setPriority(e.target.value as Priority);
                        setPriorityTouched(true);
                      }}
                      className={inputCls}
                    >
                      <option value="urgent">Urgent: statutory or same-week deadline</option>
                      <option value="high">High: needed within the pay period</option>
                      <option value="normal">Normal: standard routing</option>
                      <option value="low">Low: no time constraint</option>
                    </select>
                  </Field>
                </div>
              </Section>
            )}

            {/* Routing & notifications */}
            {actionType && (
              <Section step={nextStep()} title="Approval routing" description="Generated from the district's current routing rules.">
                {!campus || (isTermination && isVoluntary === null) ? (
                  <p className="text-[11px] text-slate-500">
                    {!campus
                      ? "Select the employee's campus to see the approval route."
                      : 'Choose the separation classification to see the approval route.'}
                  </p>
                ) : (
                  <ol className="space-y-1.5">
                    {routingPreview.map((routeStep, i) => (
                      <li key={routeStep.id} className="flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-2">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-600">
                          {i + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-semibold text-slate-900">{routeStep.stageLabel}</div>
                          <div className="text-[11px] text-slate-500 truncate">
                            {routeStep.assignedRole} · {routeStep.assignedEmail}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ol>
                )}

                {noticeRecipients.length > 0 && (
                  <div className="pt-3 border-t border-slate-100">
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-700 mb-2">
                      <Bell className="w-3.5 h-3.5 text-slate-500" />
                      FYI notices sent on submission (no approval needed)
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {noticeRecipients.map(r => (
                        <div key={r.id} className="rounded-lg bg-slate-50 border border-slate-200 p-2.5">
                          <div className="text-[11px] font-semibold text-slate-900">{r.department}</div>
                          <div className="text-[11px] text-slate-600">{r.recipientName} · {r.recipientEmail}</div>
                          <p className="text-[10px] text-slate-500 mt-0.5">{r.purpose}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Section>
            )}

            {/* Review & certify */}
            <div ref={issuesRef} className="space-y-3">
              {warnings.length > 0 && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 mb-1">
                    <AlertTriangle className="w-4 h-4" /> Review before submitting
                  </div>
                  <ul className="list-disc pl-5 space-y-0.5 text-[11px] text-amber-900">
                    {warnings.map(w => <li key={w}>{w}</li>)}
                  </ul>
                </div>
              )}
              {submitAttempted && errors.length > 0 && (
                <div className="rounded-lg border border-rose-200 bg-rose-50 p-3" role="alert">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-rose-900 mb-1">
                    <AlertCircle className="w-4 h-4" /> Complete the following before submitting
                  </div>
                  <ul className="list-disc pl-5 space-y-0.5 text-[11px] text-rose-900">
                    {errors.map(err => <li key={err}>{err}</li>)}
                  </ul>
                </div>
              )}
              <label className="flex items-start gap-2.5 rounded-lg border border-slate-300 bg-white p-3 cursor-pointer">
                <input type="checkbox" checked={attested} onChange={e => setAttested(e.target.checked)}
                  className="mt-0.5 rounded accent-[#0f2352]" />
                <span className="text-[11px] text-slate-700 leading-relaxed">
                  I, <strong>{currentPersona.name}</strong>, certify that the information in this request is accurate and complete
                  to the best of my knowledge. I understand that it becomes part of the employee's personnel record.
                </span>
              </label>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-3 border-t border-slate-200 bg-white flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-2">
            <div className="text-[11px] text-slate-500">
              {submitAttempted && errors.length > 0
                ? <span className="text-rose-700 font-semibold">{errors.length} item{errors.length === 1 ? '' : 's'} need attention</span>
                : actionType && firstName && lastName
                  ? <>{actionTypes.find(a => a.type === actionType)?.label} · {firstName} {lastName} · effective {formatDate(effectiveDate)}</>
                  : 'Routed to the approvers above for electronic signature.'}
            </div>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={requestClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold bg-[#0f2352] hover:bg-[#1a3880] text-white rounded-lg shadow-sm transition-colors"
              >
                Submit for approval
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
