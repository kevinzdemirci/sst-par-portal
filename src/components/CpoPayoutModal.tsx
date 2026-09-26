import React, { useState, useMemo, useRef } from 'react';
import { UserPersona } from '../types/par';
import { CpoPayoutRequest, PayoutType, PayoutSupportingDoc, PayoutStatus } from '../types/payout';
import { SST_PAYROLL_CYCLES, PAYOUT_CATEGORIES, getActivePayrollCycle } from '../data/mockPayoutData';
import { 
  formatCurrency, 
  formatDate, 
  formatDateTime, 
  isChiefPeopleOfficer, 
  isRegionalHrCoordinator,
  isPayrollCoordinator,
  formatPayoutTypeBadge, 
  formatPayoutStatusBadge,
  locationForCampus
} from '../utils/formatters';
import { AdpWorker } from '../types/adp';
import { AdpEmployeeSearch } from './AdpEmployeeSearch';
import { SST_DEFAULT_LOGO, getNormalizedLogoUrl } from '../data/sstLogo';
import { 
  X, 
  Plus, 
  Search, 
  DollarSign, 
  FileText, 
  FilePlus, 
  Paperclip, 
  Upload, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  Calendar, 
  ArrowDownCircle, 
  ArrowUpCircle, 
  Send, 
  Check, 
  Eye, 
  Download, 
  Trash2,
  Lock,
  AlertTriangle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { getStoredGmailCredentials, sendGmailEmail } from '../utils/gmailService';

export interface PayoutTemplateItem {
  id: string;
  name: string;
  fileName: string;
  size: string;
}

export const DEFAULT_PAYOUT_TEMPLATES: PayoutTemplateItem[] = [
  { id: 'tpl-1', name: 'Extra Duty Timesheet', fileName: 'Signed_Extra_Duty_Timesheet.pdf', size: '210 KB' },
  { id: 'tpl-2', name: 'Deduction Agreement Form', fileName: 'Voluntary_Payroll_Deduction_Authorization.pdf', size: '185 KB' },
  { id: 'tpl-3', name: 'Mileage & Travel Log', fileName: 'Regional_Travel_and_Expense_Receipts.pdf', size: '340 KB' }
];

interface CpoPayoutModalProps {
  isOpen?: boolean;
  embedded?: boolean;
  onClose?: () => void;
  currentPersona: UserPersona;
  payouts: CpoPayoutRequest[];
  onSavePayouts: (updated: CpoPayoutRequest[]) => void;
  onToast: (text: string, type?: 'success' | 'warning' | 'info') => void;
  districtLogo?: string;
  districtName?: string;
}

export const CpoPayoutModal: React.FC<CpoPayoutModalProps> = ({
  isOpen = false,
  embedded = false,
  onClose,
  currentPersona,
  payouts,
  onSavePayouts,
  onToast,
  districtLogo,
  districtName = 'School of Science and Technology'
}) => {
  const isCpo = isChiefPeopleOfficer(currentPersona);
  const isHr = isRegionalHrCoordinator(currentPersona);
  const isPayroll = isPayrollCoordinator(currentPersona);

  const [activeTab, setActiveTab] = useState<'queue' | 'create' | 'calendar'>(isHr ? 'create' : 'queue');
  const [selectedPayout, setSelectedPayout] = useState<CpoPayoutRequest | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Guard: non-HR personas cannot access or stay on the 'create' entry tab
  React.useEffect(() => {
    if (!isHr && activeTab === 'create') {
      setActiveTab('queue');
    }
  }, [isHr, activeTab]);

  // Document preview state
  const [previewDoc, setPreviewDoc] = useState<PayoutSupportingDoc | null>(null);

  // Form State for New Request
  const [formEmployeeName, setFormEmployeeName] = useState<string>('');
  const [formAdpId, setFormAdpId] = useState<string>('');
  const [formCampus, setFormCampus] = useState<string>('SST Champions Elementary');
  const [formRegion, setFormRegion] = useState<string>('Houston Area');
  const [formJobTitle, setFormJobTitle] = useState<string>('');
  const [formLinkedWorker, setFormLinkedWorker] = useState<AdpWorker | null>(null);
  const [formPayoutType, setFormPayoutType] = useState<PayoutType>('payment');
  const [formCategory, setFormCategory] = useState<string>(PAYOUT_CATEGORIES.payment[0]);
  const [formAmount, setFormAmount] = useState<string>('');
  const activeCycle = getActivePayrollCycle();
  const [formCutoffDate, setFormCutoffDate] = useState<string>(activeCycle.cutoffDate);
  const [formCycleName, setFormCycleName] = useState<string>(activeCycle.cycleName);
  const [formReason, setFormReason] = useState<string>('');
  const [formDocs, setFormDocs] = useState<PayoutSupportingDoc[]>([]);
  const [formIsUrgent, setFormIsUrgent] = useState<boolean>(false);

  // CPO Review State
  const [cpoNotes, setCpoNotes] = useState<string>('');
  const [cpoPinInput, setCpoPinInput] = useState<string>(currentPersona.signingPin || '1234');
  
  // Payroll Execution State
  const [payrollBatchNo, setPayrollBatchNo] = useState<string>('ADP-BATCH-SEP25-2026');
  const [payrollExecNotes, setPayrollExecNotes] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Switch category list when Payout Type changes
  const handleTypeChange = (newType: PayoutType) => {
    setFormPayoutType(newType);
    setFormCategory(PAYOUT_CATEGORIES[newType][0]);
  };

  // Upload file simulation
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    const newDoc: PayoutSupportingDoc = {
      id: `doc-${Date.now()}`,
      name: file.name,
      size: `${Math.round(file.size / 1024)} KB`,
      fileType: file.type || 'application/pdf',
      uploadedAt: new Date().toISOString(),
      uploadedBy: `${currentPersona.name} (${currentPersona.role})`
    };
    setFormDocs(prev => [...prev, newDoc]);
    if (fileInputRef.current) fileInputRef.current.value = '';
    onToast(`Attached document "${file.name}"`, 'info');
  };

  // Attachment Templates State & Persistence
  const [templates, setTemplates] = useState<PayoutTemplateItem[]>(() => {
    try {
      const saved = localStorage.getItem('sst_payout_custom_templates_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // fallback
    }
    return DEFAULT_PAYOUT_TEMPLATES;
  });

  const [showTemplateOptions, setShowTemplateOptions] = useState<boolean>(false);
  const [isAddingNewTemplate, setIsAddingNewTemplate] = useState<boolean>(false);
  const [newTemplateName, setNewTemplateName] = useState<string>('');
  const [newTemplateFileName, setNewTemplateFileName] = useState<string>('');

  const saveTemplates = (updated: PayoutTemplateItem[]) => {
    setTemplates(updated);
    try {
      localStorage.setItem('sst_payout_custom_templates_v1', JSON.stringify(updated));
    } catch {
      // fallback
    }
  };

  const handleAttachTemplate = (tpl: PayoutTemplateItem) => {
    const newDoc: PayoutSupportingDoc = {
      id: `doc-tpl-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: tpl.fileName,
      size: tpl.size,
      fileType: 'application/pdf',
      uploadedAt: new Date().toISOString(),
      uploadedBy: `${currentPersona.name} (${currentPersona.role})`
    };
    setFormDocs(prev => [...prev, newDoc]);
    onToast(`Attached template document "${tpl.fileName}"`, 'info');
  };

  const handleCreateCustomTemplate = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newTemplateName.trim()) {
      alert('Please enter a template title.');
      return;
    }
    let finalFileName = newTemplateFileName.trim();
    if (!finalFileName) {
      finalFileName = `${newTemplateName.trim().replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;
    } else if (!finalFileName.toLowerCase().endsWith('.pdf') && !finalFileName.toLowerCase().endsWith('.docx') && !finalFileName.toLowerCase().endsWith('.xlsx')) {
      finalFileName = `${finalFileName.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;
    }

    const newTpl: PayoutTemplateItem = {
      id: `tpl-${Date.now()}`,
      name: newTemplateName.trim(),
      fileName: finalFileName,
      size: '225 KB'
    };
    const updated = [...templates, newTpl];
    saveTemplates(updated);
    setNewTemplateName('');
    setNewTemplateFileName('');
    setIsAddingNewTemplate(false);
    onToast(`Added custom template "${newTpl.name}"`, 'success');
  };

  const handleDeleteTemplate = (tplId: string) => {
    const updated = templates.filter(t => t.id !== tplId);
    saveTemplates(updated);
    onToast('Template removed from library', 'info');
  };

  // Fill the staff fields from the ADP roster; they stay editable.
  const applyAdpWorker = (w: AdpWorker) => {
    setFormLinkedWorker(w);
    setFormEmployeeName(w.fullName);
    setFormAdpId(w.adpId);
    setFormJobTitle(w.jobTitle || '');
    const campusName = w.campus || w.locationName || '';
    setFormCampus(campusName);
    const region = w.campus ? locationForCampus(w.campus) : w.location;
    setFormRegion(
      region === 'Houston' ? 'Houston Area' : region === 'Central Administration' ? 'Central Administration' : 'San Antonio & Corpus Christi'
    );
  };

  // Submit New Payout / Deduction Request
  const handleSubmitNewRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formEmployeeName.trim()) {
      alert('Please select or enter an employee name.');
      return;
    }
    // Payroll keys this into ADP, so it must identify a real ADP record.
    if (!formAdpId.trim()) {
      alert('Enter the employee\'s ADP ID, or pick the employee from the ADP search.');
      return;
    }
    const numAmount = parseFloat(formAmount);
    if (isNaN(numAmount) || numAmount <= 0) {
      alert('Please enter a valid positive dollar amount.');
      return;
    }
    if (!formReason.trim()) {
      alert('Please enter a reason and justification for this request.');
      return;
    }

    const nextNumber = payouts.length + 1;
    const prefix = formPayoutType === 'payment' ? 'SST-PAY' : 'SST-DED';
    const tracking = `${prefix}-${new Date().getFullYear()}-${String(nextNumber).padStart(3, '0')}`;
    const nowIso = new Date().toISOString();

    const newRequest: CpoPayoutRequest = {
      id: `payout-${Date.now()}`,
      trackingNumber: tracking,
      payoutType: formPayoutType,
      employeeId: formLinkedWorker?.associateId || formAdpId.trim(),
      employeeName: formEmployeeName.trim(),
      adpId: formAdpId.trim(),
      campus: formCampus,
      region: formRegion,
      jobTitle: formJobTitle.trim(),
      currentSalary: formLinkedWorker?.annualSalary || undefined,
      amount: numAmount,
      category: formCategory,
      reason: formReason,
      payrollCutoffDate: formCutoffDate,
      payrollCycleName: formCycleName,
      isUrgentCutoff: formIsUrgent,
      supportingDocs: formDocs,
      submittedBy: currentPersona.name,
      submitterEmail: currentPersona.email,
      submitterRole: currentPersona.role,
      submittedAt: nowIso,
      status: 'pending_cpo',
      history: [
        {
          id: `hist-${Date.now()}`,
          action: `${formPayoutType === 'payment' ? 'Payment' : 'Deduction'} Request Submitted`,
          actor: `${currentPersona.name} (${currentPersona.role})`,
          timestamp: nowIso,
          notes: `Submitted for CPO approval by cut-off date ${formCutoffDate}.`
        }
      ]
    };

    onSavePayouts([newRequest, ...payouts]);

    // Automated Gmail dispatch to CPO for new payout request
    const gmailCreds = getStoredGmailCredentials();
    if (gmailCreds.isEnabled) {
      sendGmailEmail({
        to: 'kdemirci@ssttx.org',
        toName: 'Dr. Kevin Demirci (Chief People Officer)',
        subject: `💵 [CPO APPROVAL REQUIRED]: ${newRequest.trackingNumber} - ${formEmployeeName} ($${numAmount.toLocaleString()})`,
        bodyText: `Dear Dr. Kevin Demirci,\n\nA new staff compensation payout/deduction request has been submitted by ${currentPersona.name} (${currentPersona.role}) for the upcoming payroll cut-off (${formCutoffDate}).\n\nEmployee: ${formEmployeeName} (ADP: ${newRequest.adpId})\nCampus: ${formCampus}\nType: ${formPayoutType.toUpperCase()}\nAmount: $${numAmount.toLocaleString()}\nCategory: ${formCategory}\nReason: ${formReason}\n\nPlease sign in to the SST HR Hub under "CPO Payout Reviewer" to review and execute your approval.\n\nSchool of Science and Technology Human Resources`,
        category: 'payout'
      }, gmailCreds).catch(console.error);
    }

    onToast(`Created ${newRequest.trackingNumber} for ${formEmployeeName} ($${numAmount.toLocaleString()}) — Queued for CPO Approval`, 'success');

    // Reset form
    setFormEmployeeName('');
    setFormAdpId('');
    setFormJobTitle('');
    setFormLinkedWorker(null);
    setFormAmount('');
    setFormReason('');
    setFormDocs([]);
    setActiveTab('queue');
  };

  // CPO Action: Approve Request
  const handleCpoApprove = (payoutId: string) => {
    if (!isCpo) {
      alert('Only the Chief People Officer (Dr. Kevin Demirci) has authority to approve payout requests.');
      return;
    }
    const nowIso = new Date().toISOString();
    let approvedItem: CpoPayoutRequest | null = null;

    const updated = payouts.map(p => {
      if (p.id !== payoutId) return p;
      approvedItem = {
        ...p,
        status: 'approved_by_cpo' as PayoutStatus,
        cpoDecisionDate: nowIso,
        cpoDecisionNotes: cpoNotes || 'Approved for payroll execution by cut-off deadline.',
        cpoSignerName: currentPersona.name,
        cpoSignerId: currentPersona.signerId || 'CPO-SST-DEMIRCI-2026',
        cpoIpAddress: currentPersona.ipAddress || '192.168.1.100',
        cpoSigningPin: cpoPinInput,
        cpoSignatureImage: currentPersona.signatureImage,
        history: [
          ...p.history,
          {
            id: `hist-${Date.now()}`,
            action: 'Approved by Chief People Officer',
            actor: `${currentPersona.name} (Chief People Officer)`,
            timestamp: nowIso,
            notes: cpoNotes ? `Approved with notes: "${cpoNotes}". Routed to Payroll for ADP closeout.` : 'Digitally approved and routed to Payroll.'
          }
        ]
      };
      return approvedItem;
    });

    onSavePayouts(updated);

    // Automated Gmail dispatch to Payroll Coordinator upon CPO approval
    const gmailCreds = getStoredGmailCredentials();
    if (gmailCreds.isEnabled && approvedItem) {
      const target: CpoPayoutRequest = approvedItem;
      sendGmailEmail({
        to: 'pcomparini@ssttx.org',
        toName: 'Paola Comparini (Payroll Coordinator)',
        subject: `✅ [CPO APPROVED - EXECUTE IN ADP]: ${target.trackingNumber} - ${target.employeeName} ($${target.amount.toLocaleString()})`,
        bodyText: `Dear Paola Comparini,\n\nDr. Kevin Demirci (Chief People Officer) has approved compensation request ${target.trackingNumber} for ${target.employeeName} (ADP: ${target.adpId}, ${target.campus}).\n\nAmount: $${target.amount.toLocaleString()}\nCategory: ${target.category}\nTarget Payroll Cut-Off: ${target.payrollCutoffDate} (${target.payrollCycleName})\nCPO Approval Notes: ${cpoNotes || 'Approved for payroll entry.'}\n\nPlease enter this transaction into ADP Workforce Now before the cut-off deadline.\n\nSchool of Science and Technology Human Resources`,
        category: 'payout'
      }, gmailCreds).catch(console.error);
    }

    try {
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
    } catch {
      // ignore
    }
    onToast(`Approved ${selectedPayout?.trackingNumber} — Successfully routed to Payroll Coordinator (Paola Comparini)`, 'success');
    setSelectedPayout(null);
    setCpoNotes('');
  };

  // CPO Action: Return for Revision
  const handleCpoReturn = (payoutId: string) => {
    if (!isCpo) return;
    const reason = prompt('Please specify what revisions or additional documents are needed:');
    if (!reason) return;
    const nowIso = new Date().toISOString();
    const updated = payouts.map(p => {
      if (p.id !== payoutId) return p;
      return {
        ...p,
        status: 'revision_required' as PayoutStatus,
        cpoDecisionDate: nowIso,
        cpoDecisionNotes: reason,
        history: [
          ...p.history,
          {
            id: `hist-${Date.now()}`,
            action: 'Returned for Revision by CPO',
            actor: `${currentPersona.name} (Chief People Officer)`,
            timestamp: nowIso,
            notes: `Revision Requested: ${reason}`
          }
        ]
      };
    });
    onSavePayouts(updated);
    onToast(`Returned ${selectedPayout?.trackingNumber} for revision`, 'warning');
    setSelectedPayout(null);
  };

  // CPO Action: Reject Request
  const handleCpoReject = (payoutId: string) => {
    if (!isCpo) return;
    const reason = prompt('Please specify the reason for rejection:');
    if (!reason) return;
    const nowIso = new Date().toISOString();
    const updated = payouts.map(p => {
      if (p.id !== payoutId) return p;
      return {
        ...p,
        status: 'rejected' as PayoutStatus,
        cpoDecisionDate: nowIso,
        cpoDecisionNotes: reason,
        history: [
          ...p.history,
          {
            id: `hist-${Date.now()}`,
            action: 'Rejected by Chief People Officer',
            actor: `${currentPersona.name} (Chief People Officer)`,
            timestamp: nowIso,
            notes: `Rejected: ${reason}`
          }
        ]
      };
    });
    onSavePayouts(updated);
    onToast(`Rejected ${selectedPayout?.trackingNumber}`, 'warning');
    setSelectedPayout(null);
  };

  // Payroll Action: Mark Executed in ADP
  const handlePayrollExecute = (payoutId: string) => {
    if (!isPayroll && !isCpo) {
      alert('Only the Payroll Coordinator (Paola Comparini) or Chief People Officer can mark requests processed in ADP.');
      return;
    }
    const nowIso = new Date().toISOString();
    let executedItem: CpoPayoutRequest | null = null;

    const updated = payouts.map(p => {
      if (p.id !== payoutId) return p;
      executedItem = {
        ...p,
        status: 'processed_payroll' as PayoutStatus,
        payrollProcessedAt: nowIso,
        payrollProcessedBy: `${currentPersona.name} (${currentPersona.role})`,
        adpBatchNumber: payrollBatchNo || 'ADP-BATCH-SEP25-2026',
        payrollNotes: payrollExecNotes || 'Direct deposit entry verified and finalized in ADP Workforce Now.',
        history: [
          ...p.history,
          {
            id: `hist-${Date.now()}`,
            action: 'Processed & Closed in ADP Payroll',
            actor: `${currentPersona.name} (${currentPersona.role})`,
            timestamp: nowIso,
            notes: `Processed in ADP Batch #${payrollBatchNo || 'ADP-BATCH-SEP25-2026'}.`
          }
        ]
      };
      return executedItem;
    });

    onSavePayouts(updated);

    // Automated Gmail dispatch to Submitter confirming payroll entry
    const gmailCreds = getStoredGmailCredentials();
    if (gmailCreds.isEnabled && executedItem) {
      const target: CpoPayoutRequest = executedItem;
      if (target.submitterEmail) {
        sendGmailEmail({
          to: target.submitterEmail,
          toName: target.submittedBy,
          subject: `🎉 [ADP PAYROLL PROCESSED]: ${target.trackingNumber} - ${target.employeeName}`,
          bodyText: `Dear ${target.submittedBy},\n\nYour compensation request ${target.trackingNumber} for ${target.employeeName} ($${target.amount.toLocaleString()}) has been finalized and processed in ADP Workforce Now by Payroll Coordinator ${currentPersona.name}.\n\nBatch Number: ${target.adpBatchNumber}\nCycle: ${target.payrollCycleName}\n\nSchool of Science and Technology Human Resources`,
          category: 'payout'
        }, gmailCreds).catch(console.error);
      }
    }

    onToast(`Marked ${selectedPayout?.trackingNumber} processed in ADP Payroll!`, 'success');
    setSelectedPayout(null);
    setPayrollExecNotes('');
  };

  // Filtered Payouts Queue
  const filteredPayouts = useMemo(() => {
    return payouts.filter(p => {
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;
      if (typeFilter !== 'all' && p.payoutType !== typeFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match = 
          p.employeeName.toLowerCase().includes(q) ||
          p.adpId.toLowerCase().includes(q) ||
          p.trackingNumber.toLowerCase().includes(q) ||
          p.campus.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [payouts, statusFilter, typeFilter, searchQuery]);

  // Aggregate Metrics
  const metrics = useMemo(() => {
    const pendingCpo = payouts.filter(p => p.status === 'pending_cpo');
    const approved = payouts.filter(p => p.status === 'approved_by_cpo');
    const processed = payouts.filter(p => p.status === 'processed_payroll');
    const paymentsTotal = payouts.filter(p => p.payoutType === 'payment').reduce((acc, p) => acc + p.amount, 0);
    const deductionsTotal = payouts.filter(p => p.payoutType === 'deduction').reduce((acc, p) => acc + p.amount, 0);
    return {
      pendingCpoCount: pendingCpo.length,
      pendingCpoAmount: pendingCpo.reduce((acc, p) => acc + p.amount, 0),
      approvedCount: approved.length,
      processedCount: processed.length,
      paymentsTotal,
      deductionsTotal
    };
  }, [payouts]);

  if (!isOpen && !embedded) return null;

  const innerCard = (
    <div className={`bg-white rounded-3xl border border-slate-200 flex flex-col ${
      embedded 
        ? 'shadow-md w-full' 
        : 'shadow-2xl max-w-6xl w-full max-h-[94vh] overflow-hidden'
    }`}>
      
      {/* Hidden File Input */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileUpload} 
        className="hidden" 
        accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
      />

      {/* Modal Top Header */}
      <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 via-blue-50/40 to-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3.5">
          <img 
            src={getNormalizedLogoUrl(districtLogo)} 
            alt="SST" 
            className="h-14 w-auto object-contain rounded drop-shadow-xs"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = SST_DEFAULT_LOGO;
            }}
          />
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-black text-slate-900 tracking-tight">
                CPO Payout & Deduction Approval System
              </h2>
              <span className="text-[10px] uppercase font-black tracking-wider px-2.5 py-0.5 rounded-full bg-[#0f2352] text-white">
                SST Expedited Payroll
              </span>
              {metrics.pendingCpoCount > 0 && (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200 flex items-center space-x-1">
                  <Clock className="w-3 h-3 text-rose-600 animate-spin" />
                  <span>{metrics.pendingCpoCount} Pending CPO</span>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 font-medium">
              {districtName} • Regional HR Cut-Off Deadlines & Chief People Officer Authorizations
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* Cutoff Deadline Reminder Pill */}
          <div className="flex items-center space-x-2 bg-amber-50 border border-amber-300/80 px-3 py-1.5 rounded-xl shadow-2xs">
            <Calendar className="w-4 h-4 text-amber-700 shrink-0" />
            <div className="text-left leading-tight">
              <div className="text-[10px] uppercase font-bold text-amber-900">Next Payroll Cut-Off</div>
              <div className="text-xs font-black text-amber-800">
                Sept 25, 2026 <span className="font-medium text-[11px] text-amber-700">(5 Days Left)</span>
              </div>
            </div>
          </div>

          {onClose && !embedded && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
              title="Close Payout Studio"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

        {/* Sub-Navigation Tabs */}
        <div className="px-6 border-b border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex space-x-2 overflow-x-auto py-1">
            {isHr ? (
              <>
                <button
                  onClick={() => setActiveTab('create')}
                  className={`py-2.5 px-4 text-xs font-bold border-b-2 transition-colors flex items-center space-x-2 shrink-0 ${
                    activeTab === 'create'
                      ? 'border-emerald-600 text-emerald-800 bg-emerald-50/50 rounded-t-lg'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Plus className="w-4 h-4 text-emerald-600" />
                  <span>📝 New Payout / Deduction Request (HR Entry)</span>
                </button>

                <button
                  onClick={() => setActiveTab('queue')}
                  className={`py-2.5 px-4 text-xs font-bold border-b-2 transition-colors flex items-center space-x-2 shrink-0 ${
                    activeTab === 'queue'
                      ? 'border-[#0f2352] text-[#0f2352] bg-white/60 rounded-t-lg'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <FileText className="w-4 h-4 text-[#0f2352]" />
                  <span>📋 My Regional Submissions</span>
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700">
                    {payouts.length}
                  </span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setActiveTab('queue')}
                  className={`py-2.5 px-4 text-xs font-bold border-b-2 transition-colors flex items-center space-x-2 shrink-0 ${
                    activeTab === 'queue'
                      ? 'border-[#0f2352] text-[#0f2352] bg-white/60 rounded-t-lg'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {isCpo ? (
                    <>
                      <ShieldCheck className="w-4 h-4 text-purple-600" />
                      <span>⚖️ CPO Executive Reviewer Queue</span>
                      {metrics.pendingCpoCount > 0 && (
                        <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white">
                          {metrics.pendingCpoCount} Pending
                        </span>
                      )}
                    </>
                  ) : isPayroll ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>💵 Payroll ADP Execution Queue</span>
                      {metrics.approvedCount > 0 && (
                        <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-blue-600 text-white">
                          {metrics.approvedCount} Ready
                        </span>
                      )}
                    </>
                  ) : (
                    <>
                      <Eye className="w-4 h-4 text-slate-600" />
                      <span>👀 Reviewer Oversight Queue</span>
                      <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700">
                        {payouts.length}
                      </span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => setActiveTab('calendar')}
                  className={`py-2.5 px-4 text-xs font-bold border-b-2 transition-colors flex items-center space-x-2 shrink-0 ${
                    activeTab === 'calendar'
                      ? 'border-[#0f2352] text-[#0f2352] bg-white/60 rounded-t-lg'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Calendar className="w-4 h-4 text-amber-600" />
                  <span>📅 Payroll Cut-Off Schedule & Deadlines</span>
                </button>
              </>
            )}
          </div>

          <div className="text-xs font-semibold text-slate-600 flex items-center space-x-1.5 shrink-0 py-1">
            <span className="text-slate-400">Viewing As:</span>
            <strong className="text-slate-900">{currentPersona.name}</strong>
            <span className={`text-[11px] px-2 py-0.5 rounded-md font-bold ${
              isHr ? 'bg-emerald-100 text-emerald-800' :
              isCpo ? 'bg-purple-100 text-purple-800' :
              isPayroll ? 'bg-indigo-100 text-indigo-800' :
              'bg-slate-200 text-slate-800'
            }`}>
              {isHr ? '📋 Regional HR (Entry Authorized)' : isCpo ? '👑 CPO Reviewer (Approver)' : isPayroll ? '💵 Payroll Reviewer (ADP)' : '👀 Reviewer Mode'}
            </span>
          </div>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/40">
          
          {/* TAB 1: QUEUE & DASHBOARD */}
          {activeTab === 'queue' && (
            <div className="space-y-6">
              
              {/* Persona Mode Guidance Banner */}
              {isHr ? (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50/40 to-slate-50 border border-emerald-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                  <div className="flex items-center space-x-3.5">
                    <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-black text-slate-900 flex items-center space-x-2">
                        <span>📋 Regional HR Entry & Submissions Mode</span>
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-emerald-100 border border-emerald-300 text-emerald-800">
                          {currentPersona.region || 'Regional HR Coordinator'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        You have permission to create staff payment and deduction entries. Track your submitted items through Chief People Officer authorization and ADP batch closeout.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveTab('create')}
                    className="shrink-0 inline-flex items-center space-x-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ New Payout Entry</span>
                  </button>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50/90 via-indigo-50/30 to-purple-50/50 border border-blue-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                  <div className="flex items-center space-x-3.5">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-xs text-white ${
                      isCpo ? 'bg-purple-700' : isPayroll ? 'bg-indigo-700' : 'bg-[#0f2352]'
                    }`}>
                      {isCpo ? <ShieldCheck className="w-5 h-5" /> : isPayroll ? <DollarSign className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="text-xs font-black text-slate-900 flex items-center space-x-2">
                        <span>
                          {isCpo 
                            ? '⚖️ Executive Reviewer Mode: CPO Authorization Portal' 
                            : isPayroll 
                              ? '💵 Payroll Reviewer Mode: ADP Batch Execution' 
                              : '👀 Reviewer Oversight Mode: District Payout Inspection'}
                        </span>
                        <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 shadow-2xs">
                          Reviewer Tab Active
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        {isCpo 
                          ? 'Review and digitally authorize staff compensation adjustments submitted by Regional HR Coordinators ahead of the semi-monthly cut-off. Direct payout entry is reserved for Regional HR.'
                          : isPayroll
                            ? 'Verify CPO digital authorization signatures and record official ADP payroll batch numbers upon execution. Direct payout entry is reserved for Regional HR.'
                            : 'Inspecting district staff payout and payroll deduction records. Direct payout entry is reserved for Regional HR Coordinators.'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 shrink-0">
                    <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-[11px] font-bold text-slate-600 shadow-2xs">
                      <Lock className="w-3.5 h-3.5 text-slate-400" />
                      <span>Entry: Regional HR Only</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Metric KPI Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-2xl border border-rose-200 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700">Pending CPO Review</span>
                    <Clock className="w-4 h-4 text-rose-500" />
                  </div>
                  <div className="text-2xl font-black text-rose-900 mt-1">{metrics.pendingCpoCount}</div>
                  <div className="text-xs font-bold text-rose-700 mt-0.5">
                    {formatCurrency(metrics.pendingCpoAmount)} total awaiting approval
                  </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">Total Payments</span>
                    <ArrowUpCircle className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div className="text-2xl font-black text-emerald-900 mt-1">{formatCurrency(metrics.paymentsTotal)}</div>
                  <div className="text-xs text-slate-500 mt-0.5">Staff bonuses, stipends & retro pay</div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-amber-200 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700">Total Deductions</span>
                    <ArrowDownCircle className="w-4 h-4 text-amber-500" />
                  </div>
                  <div className="text-2xl font-black text-amber-900 mt-1">{formatCurrency(metrics.deductionsTotal)}</div>
                  <div className="text-xs text-slate-500 mt-0.5">Recoupments & PTO adjustments</div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-blue-200 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700">Approved for Payroll</span>
                    <CheckCircle2 className="w-4 h-4 text-blue-500" />
                  </div>
                  <div className="text-2xl font-black text-blue-900 mt-1">{metrics.approvedCount}</div>
                  <div className="text-xs text-slate-500 mt-0.5">Ready for ADP execution</div>
                </div>
              </div>

              {/* Action & Filter Bar */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input 
                      type="text"
                      placeholder="Search staff, ADP ID, tracking #..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0f2352]/20 w-48 sm:w-64"
                    />
                  </div>

                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
                  >
                    <option value="all">All Statuses ({payouts.length})</option>
                    <option value="pending_cpo">⏳ Pending CPO Review</option>
                    <option value="approved_by_cpo">✅ Approved by CPO</option>
                    <option value="processed_payroll">💵 Processed in ADP</option>
                    <option value="revision_required">↩️ Revision Required</option>
                    <option value="rejected">❌ Rejected</option>
                  </select>

                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
                  >
                    <option value="all">All Types</option>
                    <option value="payment">💰 Payments (Payouts) Only</option>
                    <option value="deduction">✂️ Deductions Only</option>
                  </select>
                </div>

                {/* Entry vs Reviewer Actions */}
                {isHr ? (
                  <button
                    onClick={() => setActiveTab('create')}
                    className="inline-flex items-center space-x-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Request Staff Payout / Deduction</span>
                  </button>
                ) : isCpo ? (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setStatusFilter(statusFilter === 'pending_cpo' ? 'all' : 'pending_cpo')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center space-x-1.5 ${
                        statusFilter === 'pending_cpo' 
                          ? 'bg-rose-600 text-white border-rose-600 shadow-xs' 
                          : 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100'
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>{statusFilter === 'pending_cpo' ? 'Showing Pending CPO' : `Filter: ${metrics.pendingCpoCount} Pending CPO`}</span>
                    </button>
                    {statusFilter !== 'all' && (
                      <button 
                        onClick={() => setStatusFilter('all')}
                        className="px-2 py-1 text-[11px] font-bold text-slate-500 hover:text-slate-800"
                      >
                        Clear Filter
                      </button>
                    )}
                  </div>
                ) : isPayroll ? (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setStatusFilter(statusFilter === 'approved_by_cpo' ? 'all' : 'approved_by_cpo')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center space-x-1.5 ${
                        statusFilter === 'approved_by_cpo' 
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs' 
                          : 'bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{statusFilter === 'approved_by_cpo' ? 'Showing Ready for ADP' : `Filter: ${metrics.approvedCount} Ready for ADP`}</span>
                    </button>
                    {statusFilter !== 'all' && (
                      <button 
                        onClick={() => setStatusFilter('all')}
                        className="px-2 py-1 text-[11px] font-bold text-slate-500 hover:text-slate-800"
                      >
                        Clear Filter
                      </button>
                    )}
                  </div>
                ) : null}
              </div>

              {/* Requests Table / Cards */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="px-4 py-3">Tracking / Staff</th>
                        <th className="px-4 py-3">Type & Amount</th>
                        <th className="px-4 py-3">Category & Reason</th>
                        <th className="px-4 py-3">ADP Cut-Off Date</th>
                        <th className="px-4 py-3">Supporting Docs</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredPayouts.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                            No payout or deduction requests found matching the current filters.
                          </td>
                        </tr>
                      ) : (
                        filteredPayouts.map(req => {
                          const typeBadge = formatPayoutTypeBadge(req.payoutType);
                          const statusBadge = formatPayoutStatusBadge(req.status);
                          return (
                            <tr 
                              key={req.id} 
                              className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                              onClick={() => setSelectedPayout(req)}
                            >
                              {/* Staff / Tracking */}
                              <td className="px-4 py-3">
                                <div className="font-mono text-[11px] font-bold text-[#0f2352]">
                                  {req.trackingNumber}
                                </div>
                                <div className="font-bold text-slate-900 text-sm mt-0.5">
                                  {req.employeeName}
                                </div>
                                <div className="text-[11px] text-slate-500 font-medium">
                                  {req.campus} • <span className="font-mono">{req.adpId}</span>
                                </div>
                              </td>

                              {/* Type & Amount */}
                              <td className="px-4 py-3">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] border ${typeBadge.badgeClass}`}>
                                  {typeBadge.label}
                                </span>
                                <div className={`text-base font-black mt-1 ${
                                  req.payoutType === 'payment' ? 'text-emerald-700' : 'text-amber-700'
                                }`}>
                                  {typeBadge.sign}{formatCurrency(req.amount)}
                                </div>
                              </td>

                              {/* Category & Reason */}
                              <td className="px-4 py-3 max-w-xs">
                                <div className="font-bold text-slate-800 line-clamp-1">{req.category}</div>
                                <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">{req.reason}</p>
                              </td>

                              {/* ADP Cut-Off Date */}
                              <td className="px-4 py-3">
                                <div className="flex items-center space-x-1 font-bold text-slate-800">
                                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                  <span>{formatDate(req.payrollCutoffDate)}</span>
                                </div>
                                <div className="text-[10px] text-slate-400 font-medium line-clamp-1 mt-0.5">
                                  {req.payrollCycleName}
                                </div>
                                {req.isUrgentCutoff && req.status === 'pending_cpo' && (
                                  <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded border border-red-200 mt-1">
                                    <AlertTriangle className="w-2.5 h-2.5" />
                                    <span>Cut-Off Critical</span>
                                  </span>
                                )}
                              </td>

                              {/* Supporting Docs */}
                              <td className="px-4 py-3">
                                {req.supportingDocs.length > 0 ? (
                                  <div className="space-y-1">
                                    <span className="inline-flex items-center space-x-1 text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-200">
                                      <Paperclip className="w-3 h-3" />
                                      <span>{req.supportingDocs.length} Attachment{req.supportingDocs.length > 1 ? 's' : ''}</span>
                                    </span>
                                    <div className="text-[10px] text-slate-500 font-mono truncate max-w-[140px]">
                                      {req.supportingDocs[0].name}
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-[11px] text-slate-400 italic">None attached</span>
                                )}
                              </td>

                              {/* Status Badge */}
                              <td className="px-4 py-3">
                                <span className={`inline-flex items-center px-2 py-1 rounded-xl text-[11px] font-bold border ${statusBadge.badgeClass}`}>
                                  <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${statusBadge.dotClass}`} />
                                  {statusBadge.label}
                                </span>
                              </td>

                              {/* Action Button */}
                              <td className="px-4 py-3 text-right">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedPayout(req);
                                  }}
                                  className={`inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl font-bold text-xs transition-colors shadow-2xs border ${
                                    req.status === 'pending_cpo' && isCpo
                                      ? 'bg-rose-50 hover:bg-rose-100 border-rose-300 text-rose-900 font-black'
                                      : req.status === 'approved_by_cpo' && (isPayroll || isCpo)
                                        ? 'bg-emerald-50 hover:bg-emerald-100 border-emerald-300 text-emerald-900 font-black'
                                        : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700'
                                  }`}
                                >
                                  {req.status === 'pending_cpo' && isCpo ? (
                                    <>
                                      <ShieldCheck className="w-3.5 h-3.5 text-rose-600" />
                                      <span>Review & Sign</span>
                                    </>
                                  ) : req.status === 'approved_by_cpo' && (isPayroll || isCpo) ? (
                                    <>
                                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                                      <span>Process in ADP</span>
                                    </>
                                  ) : (
                                    <>
                                      <Eye className="w-3.5 h-3.5 text-slate-500" />
                                      <span>View Dossier</span>
                                    </>
                                  )}
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: NEW PAYOUT / DEDUCTION FORM */}
          {activeTab === 'create' && (
            !isHr ? (
              <div className="max-w-md mx-auto my-12 p-8 bg-white rounded-3xl border border-rose-200 text-center space-y-4 shadow-sm">
                <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center mx-auto">
                  <Lock className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight">Payout Entry Restricted</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Staff payout and deduction entry is strictly reserved for <strong>Regional HR Coordinators</strong> (Kristy Stewart & Amber Johnson). As <strong>{currentPersona.name} ({currentPersona.role})</strong>, your access is configured in <strong>Reviewer Mode</strong>.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('queue')}
                  className="px-5 py-2.5 bg-[#0f2352] hover:bg-[#1a3880] text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
                >
                  Go to Reviewer Queue
                </button>
              </div>
            ) : (
            <div className="max-w-3xl mx-auto bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
              <div className="border-b border-slate-200 pb-4 mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-black text-slate-900 tracking-tight">
                      Initiate Staff Payout or Payroll Deduction Request
                    </h3>
                    <p className="text-xs text-slate-500">
                      Submit compensation adjustments for CPO authorization ahead of upcoming ADP cut-off deadlines.
                    </p>
                  </div>
                  <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-xl">
                    Submitter: {currentPersona.name} ({currentPersona.role})
                  </span>
                </div>
              </div>

              <form onSubmit={handleSubmitNewRequest} className="space-y-6">
                
                {/* 1. Request Type Selector (Payment vs Deduction) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    1. Select Request Type: <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => handleTypeChange('payment')}
                      className={`p-4 rounded-2xl border-2 text-left transition-all flex items-start space-x-3.5 ${
                        formPayoutType === 'payment'
                          ? 'border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-500/20 shadow-xs'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <ArrowUpCircle className={`w-6 h-6 shrink-0 mt-0.5 ${
                        formPayoutType === 'payment' ? 'text-emerald-600' : 'text-slate-400'
                      }`} />
                      <div>
                        <div className="text-sm font-black text-slate-900 flex items-center space-x-1.5">
                          <span>💰 Payment (Payout to Staff)</span>
                          {formPayoutType === 'payment' && <Check className="w-4 h-4 text-emerald-600" />}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                          Adds money to employee's paycheck: retroactive salary adjustments, tutoring stipends, sign-on bonuses, or travel expense reimbursements.
                        </p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleTypeChange('deduction')}
                      className={`p-4 rounded-2xl border-2 text-left transition-all flex items-start space-x-3.5 ${
                        formPayoutType === 'deduction'
                          ? 'border-amber-500 bg-amber-50/60 ring-2 ring-amber-500/20 shadow-xs'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <ArrowDownCircle className={`w-6 h-6 shrink-0 mt-0.5 ${
                        formPayoutType === 'deduction' ? 'text-amber-600' : 'text-slate-400'
                      }`} />
                      <div>
                        <div className="text-sm font-black text-slate-900 flex items-center space-x-1.5">
                          <span>✂️ Deduction from Staff Pay</span>
                          {formPayoutType === 'deduction' && <Check className="w-4 h-4 text-amber-600" />}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                          Subtracts money from paycheck: unearned PTO recoupment, prior pay cycle overpayment corrections, or unreturned equipment fees.
                        </p>
                      </div>
                    </button>
                  </div>
                </div>

                {/* 2. Target Staff Details */}
                <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200 space-y-3">
                  <div className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                    <span>2. Target Staff Member Details</span>
                    <span className="text-[10px] text-slate-400 font-normal">Search ADP, or enter details exactly as in ADP</span>
                  </div>

                  <AdpEmployeeSearch
                    idPrefix="payout-lookup"
                    onSelect={applyAdpWorker}
                    inputClassName="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0f2352]/20"
                  />

                  {formLinkedWorker && (
                    <div className="flex items-start justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] text-emerald-900">
                      <span>
                        Filled from ADP: <strong>{formLinkedWorker.fullName}</strong> ({formLinkedWorker.adpId}).
                        {formLinkedWorker.employmentStatus !== 'Active' && <> ADP status: <strong>{formLinkedWorker.employmentStatus}</strong>.</>}
                        {!formLinkedWorker.campus && formLinkedWorker.locationName && <> ADP location did not match an SST campus; check the campus below.</>}
                      </span>
                      <button type="button" onClick={() => setFormLinkedWorker(null)} className="shrink-0 font-semibold hover:underline">
                        Unlink
                      </button>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Staff Full Name: *</label>
                      <input 
                        type="text"
                        required
                        placeholder="e.g. Marcus Vance"
                        value={formEmployeeName}
                        onChange={(e) => setFormEmployeeName(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0f2352]/20"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">ADP ID: *</label>
                      <input 
                        type="text"
                        required
                        placeholder="e.g. MRG92014A"
                        value={formAdpId}
                        onChange={(e) => setFormAdpId(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0f2352]/20"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Campus / Location: *</label>
                      <input 
                        type="text"
                        required
                        placeholder="e.g. SST Champions Elementary"
                        value={formCampus}
                        onChange={(e) => {
                          setFormCampus(e.target.value);
                          const isHou = e.target.value.toLowerCase().includes('champions') || 
                                        e.target.value.toLowerCase().includes('spring') || 
                                        e.target.value.toLowerCase().includes('sugar') || 
                                        e.target.value.toLowerCase().includes('woodlands') || 
                                        e.target.value.toLowerCase().includes('advancement');
                          setFormRegion(isHou ? 'Houston Area' : 'San Antonio & Corpus Christi');
                        }}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0f2352]/20"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Job Title:</label>
                      <input 
                        type="text"
                        placeholder="e.g. Science Lead Teacher"
                        value={formJobTitle}
                        onChange={(e) => setFormJobTitle(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0f2352]/20"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Financial Category, Amount & Payroll Cutoff */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Reason Category: *
                    </label>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-none"
                    >
                      {PAYOUT_CATEGORIES[formPayoutType].map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Dollar Amount ($): *
                    </label>
                    <div className="relative">
                      <DollarSign className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input 
                        type="number"
                        step="0.01"
                        required
                        placeholder="0.00"
                        value={formAmount}
                        onChange={(e) => setFormAmount(e.target.value)}
                        className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0f2352]/20"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Target Payroll Cut-Off: *
                    </label>
                    <select
                      value={formCutoffDate}
                      onChange={(e) => {
                        setFormCutoffDate(e.target.value);
                        const matched = SST_PAYROLL_CYCLES.find(c => c.cutoffDate === e.target.value);
                        if (matched) setFormCycleName(matched.cycleName);
                      }}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-none"
                    >
                      {SST_PAYROLL_CYCLES.map(cycle => (
                        <option key={cycle.id} value={cycle.cutoffDate}>
                          Period {cycle.periodNumber} ({cycle.periodStartFormatted} – {cycle.periodEndFormatted}) · Corrections Due: {cycle.correctionsDueFormatted} · Pay: {cycle.payDateFormatted}
                        </option>
                      ))}
                    </select>
                    <div className="mt-1.5 flex items-center space-x-1.5">
                      <input 
                        type="checkbox"
                        id="formIsUrgent"
                        checked={formIsUrgent}
                        onChange={(e) => setFormIsUrgent(e.target.checked)}
                        className="rounded text-red-600 focus:ring-red-500 cursor-pointer"
                      />
                      <label htmlFor="formIsUrgent" className="text-[11px] font-bold text-red-700 cursor-pointer">
                        Flag as Cut-Off Critical
                      </label>
                    </div>
                  </div>
                </div>

                {/* 4. Detailed Reason and Justification */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    4. Detailed Reason & Justification for Chief People Officer: *
                  </label>
                  <textarea 
                    rows={3}
                    required
                    placeholder="Type the specific business explanation (e.g., date of certification completion, hours worked, agreement reached with employee, or cycle correction details)..."
                    value={formReason}
                    onChange={(e) => setFormReason(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0f2352]/20"
                  />
                </div>

                {/* 5. Supporting Document Attachments */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
                        <Paperclip className="w-3.5 h-3.5 text-blue-600" />
                        <span>5. Attached Supporting Documentation</span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Upload timesheets, signed employee deduction agreements, expense receipts, or certificates for CPO verification.
                      </p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => setShowTemplateOptions(prev => !prev)}
                        className={`inline-flex items-center space-x-1.5 px-3 py-1.5 border rounded-xl text-xs font-bold transition-all shadow-2xs ${
                          showTemplateOptions
                            ? 'bg-blue-50 border-blue-300 text-blue-800 ring-2 ring-blue-500/20'
                            : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700'
                        }`}
                        title="Optional template documents to attach or add new templates"
                      >
                        <FilePlus className="w-3.5 h-3.5 text-blue-600" />
                        <span>{showTemplateOptions ? 'Close Templates' : '+ Add from Template (Optional)'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-[#0f2352] shadow-2xs transition-colors"
                      >
                        <Upload className="w-3.5 h-3.5 text-blue-600" />
                        <span>Upload File</span>
                      </button>
                    </div>
                  </div>

                  {/* Attached files list */}
                  {formDocs.length > 0 && (
                    <div className="space-y-1.5">
                      {formDocs.map(doc => (
                        <div key={doc.id} className="flex items-center justify-between bg-white px-3 py-2 rounded-xl border border-slate-200 text-xs shadow-2xs">
                          <div className="flex items-center space-x-2 truncate">
                            <FileText className="w-4 h-4 text-blue-500 shrink-0" />
                            <span className="font-semibold text-slate-800 truncate">{doc.name}</span>
                            <span className="text-[10px] text-slate-400 font-mono">({doc.size})</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setFormDocs(prev => prev.filter(d => d.id !== doc.id))}
                            className="text-slate-400 hover:text-rose-600 p-1"
                            title="Remove attachment"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Expandable Template Library & Custom Template Creator */}
                  {showTemplateOptions && (
                    <div className="pt-3 border-t border-slate-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <FileText className="w-4 h-4 text-blue-600" />
                          <span className="text-xs font-bold text-slate-800">SST Document Templates Library</span>
                          <span className="text-[11px] text-slate-500 font-medium">({templates.length} saved)</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsAddingNewTemplate(prev => !prev)}
                          className="inline-flex items-center space-x-1 px-2.5 py-1 bg-white hover:bg-blue-50 border border-blue-200 text-xs font-bold text-blue-700 rounded-lg transition-colors shadow-2xs"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>{isAddingNewTemplate ? 'Cancel' : 'Add New Template'}</span>
                        </button>
                      </div>

                      {/* Add New Template Form */}
                      {isAddingNewTemplate && (
                        <div className="p-3 bg-white rounded-xl border border-blue-200 shadow-2xs space-y-2.5">
                          <div className="text-[11px] font-bold text-slate-800 flex items-center space-x-1">
                            <Plus className="w-3 h-3 text-blue-600" />
                            <span>Save New Document Template for Future Use</span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                                Template Title *
                              </label>
                              <input
                                type="text"
                                placeholder="e.g. Bilingual Stipend Verification"
                                value={newTemplateName}
                                onChange={e => setNewTemplateName(e.target.value)}
                                className="w-full text-xs px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                                Attachment File Name (Optional)
                              </label>
                              <input
                                type="text"
                                placeholder="e.g. Bilingual_Stipend_Verification.pdf"
                                value={newTemplateFileName}
                                onChange={e => setNewTemplateFileName(e.target.value)}
                                className="w-full text-xs px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                              />
                            </div>
                          </div>
                          <div className="flex justify-end items-center space-x-2 pt-1">
                            <button
                              type="button"
                              onClick={() => setIsAddingNewTemplate(false)}
                              className="px-3 py-1 text-xs font-medium text-slate-500 hover:text-slate-700"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={handleCreateCustomTemplate}
                              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors"
                            >
                              Save Template
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Templates Grid */}
                      {templates.length === 0 ? (
                        <div className="p-3 bg-white/70 rounded-xl text-center border border-dashed border-slate-300">
                          <p className="text-xs text-slate-500 font-medium">No templates currently saved.</p>
                          <p className="text-[11px] text-slate-400">Click &ldquo;Add New Template&rdquo; above to register forms you frequently attach.</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                          {templates.map(tpl => (
                            <div
                              key={tpl.id}
                              className="p-2.5 bg-white border border-slate-200 rounded-xl flex items-center justify-between hover:border-blue-300 transition-colors shadow-2xs group"
                            >
                              <div className="truncate mr-2">
                                <div className="text-xs font-bold text-slate-800 truncate" title={tpl.name}>
                                  {tpl.name}
                                </div>
                                <div className="text-[10px] text-slate-400 font-mono truncate">
                                  {tpl.fileName} &bull; {tpl.size}
                                </div>
                              </div>
                              <div className="flex items-center space-x-1 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => handleAttachTemplate(tpl)}
                                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 text-[11px] font-bold rounded-lg transition-colors"
                                  title="Attach this template to this request"
                                >
                                  + Attach
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteTemplate(tpl.id)}
                                  className="p-1 text-slate-300 hover:text-rose-500 transition-colors rounded"
                                  title="Delete template from library"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Form Footer & Actions */}
                <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setActiveTab('queue')}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="inline-flex items-center space-x-2 px-6 py-2.5 bg-[#0f2352] hover:bg-[#1a3880] text-white text-xs font-black rounded-xl shadow-md shadow-[#0f2352]/20 transition-all active:scale-95"
                  >
                    <Send className="w-4 h-4" />
                    <span>Submit for CPO Approval</span>
                  </button>
                </div>
              </form>
            </div>
            )
          )}

          {/* TAB 3: PAYROLL CUT-OFF CALENDAR (FOR REVIEWERS & AUDIT) */}
          {/* TAB 3: PAYROLL CUT-OFF CALENDAR (FOR REVIEWERS & AUDIT) */}
          {activeTab === 'calendar' && (
            <div className="max-w-5xl mx-auto space-y-6">
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
                <div className="border-b border-slate-200 pb-4 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-5 h-5 text-amber-600" />
                      <h3 className="text-lg font-black text-slate-900 tracking-tight">
                        SCHOOL OF SCIENCE AND TECHNOLOGY 2026 - 2027 SY PAYROLL SCHEDULE
                      </h3>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Official semi-monthly district schedule for Regional HR compensation entry, corrections cut-off deadlines, CPO authorization, and ADP payroll disbursement.
                    </p>
                  </div>
                  <div className="flex items-center space-x-2 bg-amber-50 border border-amber-300 px-3 py-1.5 rounded-xl">
                    <Clock className="w-4 h-4 text-amber-700 shrink-0" />
                    <div className="text-xs font-bold text-amber-900">
                      Current Cut-Off: <strong>Period 5 (Due Sept 29, 2026 — 5 Days Left)</strong>
                    </div>
                  </div>
                </div>

                {/* Timeline Process Steps */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-emerald-50/60 p-4 rounded-2xl border border-emerald-200">
                    <div className="flex items-center space-x-2 text-xs font-black text-emerald-900">
                      <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">1</span>
                      <span>Regional HR Entry</span>
                    </div>
                    <p className="text-[11px] text-emerald-800 mt-1.5 leading-snug">
                      Regional HR coordinators submit staff payout or deduction entries and attach required documents by <strong>5:00 PM on the Corrections Due date</strong>.
                    </p>
                  </div>

                  <div className="bg-purple-50/60 p-4 rounded-2xl border border-purple-200">
                    <div className="flex items-center space-x-2 text-xs font-black text-purple-900">
                      <span className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center text-[10px]">2</span>
                      <span>CPO Review & Digital E-Sign</span>
                    </div>
                    <p className="text-[11px] text-purple-800 mt-1.5 leading-snug">
                      Chief People Officer (Dr. Kevin Demirci) reviews the employee compensation dossier and signs with PIN verification.
                    </p>
                  </div>

                  <div className="bg-blue-50/60 p-4 rounded-2xl border border-blue-200">
                    <div className="flex items-center space-x-2 text-xs font-black text-blue-900">
                      <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">3</span>
                      <span>Payroll ADP Batching</span>
                    </div>
                    <p className="text-[11px] text-blue-800 mt-1.5 leading-snug">
                      Payroll Coordinator (Paola Comparini) pulls approved requests, enters adjustments into ADP Workforce Now, and logs confirmation numbers.
                    </p>
                  </div>
                </div>

                {/* Pay Cycle Table (All 24 Cycles) */}
                <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-xs">
                  <div className="bg-[#0f2352] text-white px-4 py-2.5 flex items-center justify-between text-xs">
                    <span className="font-black uppercase tracking-wider text-[11px]">
                      District Semi-Monthly Pay Cycles (24 Cycles)
                    </span>
                    <span className="text-[11px] text-amber-300 font-bold">
                      2026 – 2027 School Year
                    </span>
                  </div>
                  <div className="max-h-[500px] overflow-y-auto">
                    <table className="min-w-full divide-y divide-slate-200 text-xs text-left">
                      <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[10px] sticky top-0 z-10 border-b border-slate-200">
                        <tr>
                          <th className="px-3 py-2.5 text-center w-12">#</th>
                          <th colSpan={2} className="px-4 py-2.5 text-center border-x border-slate-200">
                            Pay Period
                          </th>
                          <th className="px-4 py-2.5 text-center bg-amber-100 text-amber-900 font-black border-r border-slate-200">
                            Corrections Due
                          </th>
                          <th className="px-4 py-2.5 text-left">
                            Pay Date
                          </th>
                          <th className="px-4 py-2.5 text-right">
                            Status
                          </th>
                        </tr>
                        <tr className="bg-slate-50 text-[9px] text-slate-500 font-bold border-t border-slate-200">
                          <th className="px-3 py-1.5 text-center">Period</th>
                          <th className="px-4 py-1.5 text-center border-l border-slate-200">Start Date</th>
                          <th className="px-4 py-1.5 text-center border-r border-slate-200">End Date</th>
                          <th className="px-4 py-1.5 text-center bg-amber-50 text-amber-800 border-r border-slate-200">Cut-Off</th>
                          <th className="px-4 py-1.5">Official Disbursement</th>
                          <th className="px-4 py-1.5 text-right">Phase</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {SST_PAYROLL_CYCLES.map(cycle => {
                          const isActive = cycle.status === 'active';
                          return (
                            <tr 
                              key={cycle.id} 
                              className={`transition-colors ${
                                isActive 
                                  ? 'bg-amber-50/90 font-bold border-l-4 border-l-amber-500' 
                                  : 'hover:bg-slate-50/80'
                              }`}
                            >
                              <td className="px-3 py-2.5 text-center font-black text-slate-900">
                                {cycle.periodNumber}
                              </td>
                              <td className="px-4 py-2.5 text-center font-semibold text-slate-800 border-l border-slate-100">
                                {cycle.periodStartFormatted}
                              </td>
                              <td className="px-4 py-2.5 text-center font-semibold text-slate-800 border-r border-slate-100">
                                {cycle.periodEndFormatted}
                              </td>
                              <td className="px-4 py-2.5 text-center font-black text-amber-950 bg-amber-50/40 border-r border-slate-100">
                                {cycle.correctionsDueFormatted}
                              </td>
                              <td className="px-4 py-2.5 font-bold text-slate-900">
                                <div className="flex items-center space-x-2">
                                  <span>{cycle.payDateFormatted}</span>
                                  {isActive && (
                                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-600 text-white font-black">
                                      NEXT PAY
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-2.5 text-right">
                                {isActive ? (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-blue-950 border border-amber-500">
                                    ⏳ ACTIVE ({cycle.daysRemaining}d left)
                                  </span>
                                ) : cycle.status === 'closed' ? (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                                    Completed
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                                    Scheduled
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );

    {/* DETAILED DOSSIER & CPO REVIEW MODAL DRAWER */}
    const dossierModal = selectedPayout ? (
      <div className="fixed inset-0 z-60 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 my-auto">
            
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-blue-50/50 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-xl bg-white border border-slate-200 shadow-2xs">
                  {selectedPayout.payoutType === 'payment' ? (
                    <ArrowUpCircle className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <ArrowDownCircle className="w-5 h-5 text-amber-600" />
                  )}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-bold text-[#0f2352]">
                      {selectedPayout.trackingNumber}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${
                      formatPayoutStatusBadge(selectedPayout.status).badgeClass
                    }`}>
                      {formatPayoutStatusBadge(selectedPayout.status).label}
                    </span>
                  </div>
                  <h3 className="text-base font-black text-slate-900 mt-0.5">
                    {selectedPayout.employeeName} — {formatCurrency(selectedPayout.amount)}
                  </h3>
                </div>
              </div>

              <button
                onClick={() => setSelectedPayout(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Dossier Content */}
            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              
              {/* Staff & Payroll Info Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Campus:</span>
                  <strong className="text-slate-900 truncate block">{selectedPayout.campus}</strong>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">ADP ID:</span>
                  <strong className="text-slate-900 font-mono block">{selectedPayout.adpId}</strong>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Target Cut-Off:</span>
                  <strong className="text-slate-900 block">{formatDate(selectedPayout.payrollCutoffDate)}</strong>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Submitted By:</span>
                  <strong className="text-slate-900 truncate block">{selectedPayout.submittedBy}</strong>
                </div>
              </div>

              {/* Justification Box */}
              <div className="border border-slate-200 rounded-2xl p-4 bg-white shadow-2xs space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">
                  Category & Detailed Justification:
                </span>
                <div className="text-sm font-black text-slate-900">
                  {selectedPayout.category}
                </div>
                <p className="text-xs text-slate-700 leading-relaxed bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                  {selectedPayout.reason}
                </p>
              </div>

              {/* Attached Supporting Documents */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center justify-between">
                  <span>Attached Supporting Documents ({selectedPayout.supportingDocs.length})</span>
                </div>
                {selectedPayout.supportingDocs.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No files were attached with this request.</p>
                ) : (
                  <div className="space-y-2">
                    {selectedPayout.supportingDocs.map(doc => (
                      <div 
                        key={doc.id}
                        className="flex items-center justify-between bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-blue-50/50 hover:border-blue-200 transition-colors"
                      >
                        <div className="flex items-center space-x-2.5 truncate">
                          <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                          <div>
                            <div className="text-xs font-bold text-slate-900 truncate">{doc.name}</div>
                            <div className="text-[10px] text-slate-500 font-mono">
                              {doc.size} • Uploaded by {doc.uploadedBy}
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setPreviewDoc(doc)}
                          className="inline-flex items-center space-x-1 px-2.5 py-1 bg-white hover:bg-blue-100 border border-slate-200 text-blue-700 rounded-lg text-xs font-bold transition-colors shrink-0"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Preview</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* CPO Approval / Signature Status */}
              {selectedPayout.status !== 'pending_cpo' && (
                <div className="bg-blue-50/60 p-4 rounded-2xl border border-blue-200 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[#0f2352] flex items-center space-x-1.5">
                      <ShieldCheck className="w-4 h-4 text-blue-600" />
                      <span>Chief People Officer Review Log</span>
                    </span>
                    <span className="text-[10px] text-slate-500">{formatDateTime(selectedPayout.cpoDecisionDate)}</span>
                  </div>
                  <div className="text-xs text-slate-800">
                    <strong>Decision:</strong> {formatPayoutStatusBadge(selectedPayout.status).label}
                  </div>
                  {selectedPayout.cpoDecisionNotes && (
                    <div className="text-xs text-slate-700 bg-white p-2.5 rounded-xl border border-blue-100 italic">
                      "{selectedPayout.cpoDecisionNotes}"
                    </div>
                  )}
                  {selectedPayout.cpoSignerName && (
                    <div className="text-[11px] font-mono text-slate-500 flex items-center space-x-3 pt-1">
                      <span>Signer: {selectedPayout.cpoSignerName}</span>
                      <span>ID: {selectedPayout.cpoSignerId}</span>
                      <span>IP: {selectedPayout.cpoIpAddress}</span>
                    </div>
                  )}
                </div>
              )}

              {/* ADP Payroll Processing Log */}
              {selectedPayout.status === 'processed_payroll' && (
                <div className="bg-emerald-50/60 p-4 rounded-2xl border border-emerald-200 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-900 flex items-center space-x-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>ADP Payroll Closeout Log</span>
                    </span>
                    <span className="text-[10px] text-slate-500">{formatDateTime(selectedPayout.payrollProcessedAt)}</span>
                  </div>
                  <div className="text-slate-800">
                    <strong>Executed By:</strong> {selectedPayout.payrollProcessedBy}
                  </div>
                  <div className="font-mono text-[11px] text-emerald-800">
                    <strong>Batch #:</strong> {selectedPayout.adpBatchNumber}
                  </div>
                  {selectedPayout.payrollNotes && (
                    <p className="text-slate-600 italic mt-1">"{selectedPayout.payrollNotes}"</p>
                  )}
                </div>
              )}

              {/* ACTION PANEL FOR CHIEF PEOPLE OFFICER (Pending Review) */}
              {selectedPayout.status === 'pending_cpo' && (
                <div className="border-t border-slate-200 pt-4 space-y-4">
                  {isCpo ? (
                    <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-black text-amber-900 flex items-center space-x-1.5">
                          <Lock className="w-4 h-4 text-amber-700" />
                          <span>Chief People Officer Authorization & Digital E-Sign</span>
                        </div>
                        <span className="text-[10px] uppercase font-mono bg-white px-2 py-0.5 rounded border border-amber-300 text-amber-800">
                          Super Admin Authority
                        </span>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Approval Notes / Instructions for Payroll:
                        </label>
                        <input 
                          type="text"
                          placeholder="e.g. Approved for Sept 25 cycle. Please execute in ADP."
                          value={cpoNotes}
                          onChange={(e) => setCpoNotes(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0f2352]/20"
                        />
                      </div>

                      <div className="flex items-center space-x-3 pt-1">
                        <div className="flex-1">
                          <label className="block text-[10px] font-bold text-slate-500 mb-0.5">
                            CPO Signing PIN (e-Signature):
                          </label>
                          <input 
                            type="password"
                            value={cpoPinInput}
                            onChange={(e) => setCpoPinInput(e.target.value)}
                            className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-mono"
                          />
                        </div>
                        <div className="text-[10px] text-slate-500 pt-3">
                          Signer: Dr. Kevin Demirci (kdemirci@ssttx.org)
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={() => handleCpoReturn(selectedPayout.id)}
                            className="px-3 py-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 transition-colors"
                          >
                            ↩️ Return for Info
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCpoReject(selectedPayout.id)}
                            className="px-3 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl text-xs font-bold text-rose-800 transition-colors"
                          >
                            ❌ Reject
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleCpoApprove(selectedPayout.id)}
                          className="inline-flex items-center space-x-1.5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-md shadow-emerald-600/30 transition-all active:scale-95"
                        >
                          <Check className="w-4 h-4" />
                          <span>Approve & Route to Payroll</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
                      <div>
                        <strong>Awaiting CPO Digital Authorization:</strong> This request is pending review by Dr. Kevin Demirci (Chief People Officer).
                      </div>
                      <span className="text-[11px] font-bold text-slate-400">Read-Only</span>
                    </div>
                  )}
                </div>
              )}

              {/* ACTION PANEL FOR PAYROLL COORDINATOR (Approved -> ADP closeout) */}
              {selectedPayout.status === 'approved_by_cpo' && (
                <div className="border-t border-slate-200 pt-4 space-y-3">
                  {isPayroll || isCpo ? (
                    <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-300 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-black text-emerald-900 flex items-center space-x-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                          <span>ADP Payroll Final Processing & Execution</span>
                        </div>
                        <span className="text-[10px] uppercase font-bold text-emerald-800 bg-white px-2 py-0.5 rounded border border-emerald-300">
                          Ready for Cut-Off
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            ADP Batch Confirmation Number:
                          </label>
                          <input 
                            type="text"
                            value={payrollBatchNo}
                            onChange={(e) => setPayrollBatchNo(e.target.value)}
                            className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-900"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            Execution Notes:
                          </label>
                          <input 
                            type="text"
                            placeholder="e.g. Added to semi-monthly direct deposit batch."
                            value={payrollExecNotes}
                            onChange={(e) => setPayrollExecNotes(e.target.value)}
                            className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end pt-2">
                        <button
                          type="button"
                          onClick={() => handlePayrollExecute(selectedPayout.id)}
                          className="inline-flex items-center space-x-1.5 px-5 py-2.5 bg-[#0f2352] hover:bg-[#1a3880] text-white rounded-xl text-xs font-black shadow-md shadow-[#0f2352]/20 transition-all active:scale-95"
                        >
                          <Check className="w-4 h-4" />
                          <span>Mark Processed in ADP Payroll</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs text-slate-600">
                      <strong>Approved by CPO:</strong> Queued for ADP execution by Paola Comparini (Payroll Coordinator).
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null;

  const previewModal = previewDoc ? (
    <div className="fixed inset-0 z-70 overflow-y-auto bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-300">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileText className="w-4 h-4 text-blue-600" />
            <h4 className="text-sm font-bold text-slate-900 truncate">{previewDoc.name}</h4>
          </div>
          <button
            onClick={() => setPreviewDoc(null)}
            className="p-1 text-slate-400 hover:text-slate-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="border-2 border-dashed border-slate-300 rounded-2xl p-8 text-center bg-slate-50/60 space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center mx-auto shadow-2xs">
              <FileText className="w-8 h-8" />
            </div>
            <div>
              <h5 className="font-bold text-slate-900">{previewDoc.name}</h5>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                {previewDoc.size} • {previewDoc.fileType}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Uploaded by {previewDoc.uploadedBy} on {formatDate(previewDoc.uploadedAt)}
              </p>
            </div>
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-bold border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>SST Verified Payroll Supporting Document</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-slate-400">Document authenticated for audit trail.</span>
            <button
              type="button"
              onClick={() => {
                alert(`Simulating secure download for "${previewDoc.name}"...`);
              }}
              className="inline-flex items-center space-x-1.5 px-4 py-2 bg-[#0f2352] text-white rounded-xl text-xs font-bold hover:bg-[#1a3880]"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Document</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  ) : null;

  if (embedded) {
    return (
      <div className="w-full animate-fadeIn relative">
        {innerCard}
        {dossierModal}
        {previewModal}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/65 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 md:p-6 animate-fadeIn">
      {innerCard}
      {dossierModal}
      {previewModal}
    </div>
  );
};
