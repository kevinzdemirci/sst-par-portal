import React, { useState, useEffect } from 'react';
import { 
  ApprovalStep,
  WorkflowStage,
  PersonnelActionRequest, 
  UserPersona 
} from '../types/par';
import { SST_DEFAULT_LOGO } from '../data/sstLogo';
import { 
  formatCurrency, 
  formatDate, 
  formatDateTime, 
  getActionTypeInfo, 
  getStageInfo, 
  getPriorityBadge, 
  canPersonaActOnPar,
  getDepartmentNotificationRecipients,
  HR_REVISION_REASONS,
  getTexasCobraDeadline,
  canPersonaViewSstSheet,
  isSuperAdmin
} from '../utils/formatters';
import { sendGmailEmail } from '../utils/gmailService';
import { getDistrictEmailCredentials } from '../utils/emailChannel';
import { syncParToSstGoogleSheet, getStoredAppsScriptConfig } from '../utils/sstAppsScriptService';
import { getStoredAdpStaff, executeAdpTerminationCloseout } from '../utils/adpService';
import { 
  X, 
  Printer, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Send, 
  RotateCcw, 
  ThumbsUp, 
  ThumbsDown, 
  ShieldCheck,
  FileCheck,
  Check,
  Pencil,
  Trash2,
  Bell,
  Laptop,
  Fingerprint,
  UserPlus,
  Mail,
  Info,
  FileSpreadsheet,
  Lock,
  Calendar,
  DollarSign
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface ParDetailModalProps {
  par: PersonnelActionRequest | null;
  currentPersona: UserPersona;
  onClose: () => void;
  onApprovePar: (parId: string, comments: string, persona: UserPersona) => void;
  onRejectPar: (parId: string, comments: string, persona: UserPersona) => void;
  onRequestRevisionPar: (parId: string, comments: string, persona: UserPersona) => void;
  onAddComment: (parId: string, message: string, persona: UserPersona) => void;
  onDeletePar?: (parId: string) => void;
  onUpdatePar?: (updatedPar: PersonnelActionRequest) => void;
  onSwitchPersona?: (persona: UserPersona) => void;
  availablePersonas?: UserPersona[];
}

/**
 * One approval signature on the official form. Shows only what the PAR's routing history
 * records: never a placeholder name or date.
 */
const SignatureBox: React.FC<{ title: string; step?: ApprovalStep; currentStage: WorkflowStage }> = ({ title, step, currentStage }) => {
  if (!step) {
    return (
      <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/50 text-slate-400">
        <span className="text-[11px] block font-medium">{title}:</span>
        <div className="text-xs italic my-1">Not required for this PAR</div>
      </div>
    );
  }
  const signed = step.status === 'approved';
  const sentBack = step.status === 'rejected' || step.status === 'returned';
  return (
    <div className={`p-2.5 rounded-lg border ${signed ? 'bg-emerald-50/40 border-emerald-300' : sentBack ? 'bg-rose-50/50 border-rose-200' : 'bg-slate-50 border-slate-200'}`}>
      <span className="text-[11px] text-slate-500 block font-medium">{title}:</span>
      {signed ? (
        <>
          <div className="font-serif italic text-blue-900 text-base font-bold my-1">{step.reviewerName || step.assignedRole}</div>
          <div className="text-[11px] text-slate-600">Date: {formatDate(step.decisionDate)}</div>
          {step.comments && <div className="text-[10px] text-slate-600 mt-1">Notes: {step.comments}</div>}
          <div className="text-[10px] text-emerald-700 font-semibold mt-1">✓ Signed electronically</div>
        </>
      ) : sentBack ? (
        <>
          <div className="text-xs font-semibold text-rose-800 my-1">{step.status === 'rejected' ? 'Rejected' : 'Returned for revision'} by {step.reviewerName || step.assignedRole}</div>
          <div className="text-[11px] text-slate-600">Date: {formatDate(step.decisionDate)}</div>
          {step.comments && <div className="text-[10px] text-slate-600 mt-1">Notes: {step.comments}</div>}
        </>
      ) : (
        <>
          <div className="text-xs italic text-slate-500 my-1">Awaiting signature</div>
          <div className="text-[10px] text-slate-500">{step.assignedRole}{step.assignedEmail ? ` · ${step.assignedEmail}` : ''}</div>
          <div className="text-[10px] text-slate-500 mt-1">{currentStage === step.stage ? '⏳ Current step' : 'After earlier signatures'}</div>
        </>
      )}
    </div>
  );
};

export const ParDetailModal: React.FC<ParDetailModalProps> = ({
  par,
  currentPersona,
  onClose,
  onApprovePar,
  onRejectPar,
  onRequestRevisionPar,
  onAddComment,
  onDeletePar,
  onUpdatePar,
  onSwitchPersona,
  availablePersonas
}) => {
  const [decisionNotes, setDecisionNotes] = useState('');
  const [generalComment, setGeneralComment] = useState('');
  const [activeTab, setActiveTab] = useState<'form' | 'signatures' | 'audit' | 'notifications'>('form');
  const [notificationsSentToast, setNotificationsSentToast] = useState<string | null>(null);
  const [isSyncingSheet, setIsSyncingSheet] = useState(false);
  const [sheetSyncToast, setSheetSyncToast] = useState<string | null>(null);
  const [pinInput, setPinInput] = useState('');
  const [selectedReasonTemplate, setSelectedReasonTemplate] = useState('');
  const [adpBatchNumber, setAdpBatchNumber] = useState('ADP-2026-B849');

  // Employee details editing
  const [isEditingEmployee, setIsEditingEmployee] = useState(false);
  const [editFirstName, setEditFirstName] = useState(par?.firstName || '');
  const [editLastName, setEditLastName] = useState(par?.lastName || '');
  const [editEmployeeId, setEditEmployeeId] = useState(par?.employeeId || '');
  const [editTitle, setEditTitle] = useState(par?.title || '');

  useEffect(() => {
    if (par) {
      setEditFirstName(par.firstName);
      setEditLastName(par.lastName);
      setEditEmployeeId(par.employeeId);
      setEditTitle(par.title);
      setIsEditingEmployee(false);
    }
  }, [par]);

  if (!par) return null;

  const handleSaveEmployeeDetails = () => {
    if (!editFirstName.trim() || !editLastName.trim() || !editEmployeeId.trim()) {
      alert('First Name, Last Name, and Employee ID cannot be blank.');
      return;
    }
    if (onUpdatePar) {
      onUpdatePar({
        ...par,
        firstName: editFirstName.trim(),
        lastName: editLastName.trim(),
        employeeId: editEmployeeId.trim(),
        title: editTitle.trim() || par.title
      });
    }
    setIsEditingEmployee(false);
  };

  const typeInfo = getActionTypeInfo(par.actionType);
  const stageInfo = getStageInfo(par.currentStage);
  const priorityInfo = getPriorityBadge(par.priority);
  const canAct = canPersonaActOnPar(currentPersona, par);
  const eligiblePersona = availablePersonas?.find(p => canPersonaActOnPar(p, par));

  const currentStep = par.routingSteps.find(s => s.stage === par.currentStage && s.status === 'pending');
  const supervisorStep = par.routingSteps.find(s => s.stage === 'supervisor_review');
  const cpoStep = par.routingSteps.find(s => s.stage === 'cpo_review');
  const regionalStep = par.routingSteps.find(s => s.stage === 'regional_review');
  const hrStep = par.routingSteps.find(s => s.stage === 'hr_review');
  const benefitsStep = par.routingSteps.find(s => s.stage === 'benefits_review');
  const payrollStep = par.routingSteps.find(s => s.stage === 'payroll_action');

  const deptNotifications = par.departmentNotifications && par.departmentNotifications.length > 0 
    ? par.departmentNotifications 
    : getDepartmentNotificationRecipients(par.location, par.campus, par.actionType);

  const handleResendNotifications = () => {
    const itContact = deptNotifications.find(n => n.type === 'it');
    const taContact = deptNotifications.find(n => n.type === 'talent_acquisition');

    // Automatically dispatch via configured Gmail if active
    const creds = getDistrictEmailCredentials();
    if (creds.isEnabled) {
      const empFullName = `${par.firstName} ${par.lastName}`;
      if (itContact?.recipientEmail) {
        sendGmailEmail({
          to: itContact.recipientEmail,
          toName: itContact.recipientName,
          subject: `📢 [SST IT NOTIFICATION] Staff Action: ${empFullName} (${par.trackingNumber})`,
          bodyText: `Dear ${itContact.recipientName},\n\nThis is an automated informational notification regarding personnel action ${par.trackingNumber} for ${empFullName} (${par.title}, ${par.campus}).\n\nAction Type: ${par.actionType}\nEffective Date: ${par.effectiveDate}\n\nNo approval action or signature is required from your department. Please review this notice for district IT hardware, account deactivation, or licensing tracking.\n\nSchool of Science and Technology HR Systems`,
          category: 'notification'
        }, creds).catch(console.error);
      }
      if (taContact?.recipientEmail) {
        sendGmailEmail({
          to: taContact.recipientEmail,
          toName: taContact.recipientName,
          subject: `📢 [SST TA NOTIFICATION] Staff Action: ${empFullName} (${par.trackingNumber})`,
          bodyText: `Dear ${taContact.recipientName},\n\nThis is an automated informational notification regarding personnel action ${par.trackingNumber} for ${empFullName} (${par.title}, ${par.campus}).\n\nAction Type: ${par.actionType}\nEffective Date: ${par.effectiveDate}\n\nNo approval action or signature is required from your department. Please review this notice for campus vacancy tracking and talent pipeline management.\n\nSchool of Science and Technology HR Systems`,
          category: 'notification'
        }, creds).catch(console.error);
      }
    }

    const msg = `Automated notification emails successfully dispatched to ${itContact?.recipientName} (${itContact?.recipientEmail}) and ${taContact?.recipientName} (${taContact?.recipientEmail}) for informational processing (No Action Required).`;
    setNotificationsSentToast(msg);
    onAddComment(par.id, `[AUTOMATED NOTIFICATION]: Re-dispatched informational notice to IT (${itContact?.recipientName}) and Talent Acquisition (${taContact?.recipientName}). No action required.`, currentPersona);
    setTimeout(() => setNotificationsSentToast(null), 5000);
  };

  const handleSyncToGoogleSheet = async () => {
    setIsSyncingSheet(true);
    try {
      const res = await syncParToSstGoogleSheet(par, 'Manual Detail Sync', currentPersona);
      if (res.success) {
        setSheetSyncToast(`✅ ${par.trackingNumber} successfully synchronized to SSTTX Google Sheet!`);
      } else {
        setSheetSyncToast(`⚠️ ${res.message}`);
      }
    } catch (err: any) {
      setSheetSyncToast(`Sync error: ${err.message}`);
    } finally {
      setIsSyncingSheet(false);
      setTimeout(() => setSheetSyncToast(null), 4500);
    }
  };

  const handleApprove = () => {
    if (currentPersona.signingPin && pinInput.trim() !== currentPersona.signingPin) {
      alert('The signing PIN is incorrect. Enter your signing PIN to sign this document.');
      return;
    }

    let notes = decisionNotes.trim();
    if (par.currentStage === 'payroll_action') {
      const batchRef = adpBatchNumber.trim() || 'ADP-2026-AUTO';
      notes = notes 
        ? `[ADP Batch Ref: ${batchRef}] ${notes}` 
        : `[ADP Batch Ref: ${batchRef}] Finalized and executed in ADP Workforce Now.`;

      // Align with ADP: Mark employee as Terminated with batch confirmation
      if (par.actionType === 'termination') {
        try {
          const currentRoster = getStoredAdpStaff();
          executeAdpTerminationCloseout(currentRoster, par.employeeId, par, batchRef);
        } catch (e) {
          console.error('Error auto-closing worker in ADP:', e);
        }
      }
    } else if (!notes) {
      notes = 'Endorsed and electronically signed.';
    }

    onApprovePar(par.id, notes, currentPersona);
    setDecisionNotes('');
    setPinInput('');
    
    const remainingPending = par.routingSteps.filter(s => s.status === 'pending');
    if (remainingPending.length <= 1) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch {
        // ignore
      }
    }
  };

  const handleReject = () => {
    if (!decisionNotes.trim()) {
      alert('Please provide a reason for rejection in the reviewer comments.');
      return;
    }
    onRejectPar(par.id, decisionNotes, currentPersona);
    setDecisionNotes('');
  };

  const handleRevision = () => {
    if (!decisionNotes.trim()) {
      alert('Please provide notes explaining what changes are needed before revision.');
      return;
    }
    onRequestRevisionPar(par.id, decisionNotes, currentPersona);
    setDecisionNotes('');
  };

  const handlePostComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!generalComment.trim()) return;
    onAddComment(par.id, generalComment, currentPersona);
    setGeneralComment('');
  };

  // Print (or save as PDF) the whole official form: switch to the form tab, then let the
  // print stylesheet lay the pop-up out as normal pages (see "par-printing" in index.css).
  const handlePrint = () => {
    setActiveTab('form');
    document.body.classList.add('par-printing');
    const done = () => {
      document.body.classList.remove('par-printing');
      window.removeEventListener('afterprint', done);
    };
    window.addEventListener('afterprint', done);
    setTimeout(() => window.print(), 50);
  };

  return (
    <div className="par-print-root fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 md:p-6">
      <div className="par-print-panel bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[95vh] flex flex-col overflow-hidden border border-slate-200">
        
        {/* Header Bar */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/90 flex items-center justify-between no-print">
          <div className="flex items-center space-x-3">
            <div className="font-mono font-black text-[#0f2352] text-base">
              {par.trackingNumber}
            </div>
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${typeInfo.badgeClass}`}>
              {typeInfo.label}
            </span>
            <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${priorityInfo.className}`}>
              {priorityInfo.label}
            </span>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${stageInfo.badgeClass}`}>
              {stageInfo.label}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            {onDeletePar && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm(`Delete request ${par.trackingNumber} for ${par.firstName} ${par.lastName} (ADP: ${par.employeeId})? This action cannot be undone.`)) {
                    onDeletePar(par.id);
                    onClose();
                  }
                }}
                className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-white hover:bg-rose-50 border border-slate-300 hover:border-rose-300 text-rose-600 transition-colors shadow-2xs"
                title="Delete this test request"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                <span>Delete Request</span>
              </button>
            )}

            {/* PARs sync to the SST Sheet automatically; only the Sheet's viewers see it here. */}
            {canPersonaViewSstSheet(currentPersona) && (
              <a
                href={getStoredAppsScriptConfig().spreadsheetUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-900 transition-colors shadow-2xs"
                title="Open the SST PAR tracker in Google Sheets (view only). PARs sync automatically."
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
                <span>SST Sheet</span>
              </a>
            )}
            {isSuperAdmin(currentPersona) && (
              <button
                type="button"
                onClick={handleSyncToGoogleSheet}
                disabled={isSyncingSheet}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white hover:bg-emerald-50 border border-emerald-300 text-emerald-900 transition-colors shadow-2xs"
                title="Send this PAR to the SST Sheet again (it syncs automatically on every submission and approval)"
              >
                <FileSpreadsheet className={`w-3.5 h-3.5 text-emerald-700 ${isSyncingSheet ? 'animate-spin' : ''}`} />
                <span>{isSyncingSheet ? 'Syncing...' : 'Re-sync'}</span>
              </button>
            )}

            <button
              onClick={handlePrint}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors shadow-2xs"
              title="Print official SST Personnel Action Request"
            >
              <Printer className="w-3.5 h-3.5 text-[#0f2352]" />
              <span>Print Official PAR Form</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Sync Feedback Toast */}
        {sheetSyncToast && (
          <div className="bg-emerald-600 text-white px-6 py-2.5 text-xs font-bold flex items-center justify-between shadow-sm no-print animate-fadeIn">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-200" />
              <span>{sheetSyncToast}</span>
            </div>
            <button onClick={() => setSheetSyncToast(null)} className="text-emerald-200 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Workflow Routing Stepper (Visual Department Pipeline) */}
        <div className="bg-[#0f2352] text-white px-6 py-4 no-print shadow-inner">
          <div className="text-[11px] font-bold uppercase tracking-wider text-blue-200 mb-3 flex items-center justify-between">
            <span>SST Multi-Department Approval Routing Workflow</span>
            <span className="text-white font-semibold">
              Current Stage: <strong className="text-amber-300">{currentStep?.stageLabel || stageInfo.label}</strong>
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {par.routingSteps.map((step, idx) => {
              const isApproved = step.status === 'approved';
              const isPending = step.status === 'pending' && step.stage === par.currentStage;
              const isReturned = step.status === 'returned';

              return (
                <div
                  key={step.id}
                  className={`p-2.5 rounded-xl border text-xs transition-all relative ${
                    isApproved 
                      ? 'bg-emerald-950/50 border-emerald-400 text-emerald-100' 
                      : isPending 
                      ? 'bg-amber-950/60 border-amber-300 text-amber-100 ring-2 ring-amber-300/40' 
                      : isReturned
                      ? 'bg-rose-950/50 border-rose-400 text-rose-100'
                      : 'bg-white/5 border-white/10 text-blue-200/60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-mono opacity-75">Step {idx + 1}</span>
                    {isApproved && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />}
                    {isPending && <Clock className="w-3.5 h-3.5 text-amber-300 animate-spin" />}
                    {isReturned && <AlertCircle className="w-3.5 h-3.5 text-rose-300" />}
                  </div>
                  <div className="font-bold text-[11px] truncate">{step.stageLabel}</div>
                  <div className="text-[10px] opacity-75 truncate">{step.assignedRole}</div>

                  {step.reviewerName && (
                    <div className="mt-1.5 pt-1.5 border-t border-white/15 text-[10px] flex items-center justify-between opacity-90">
                      <span className="truncate">{step.reviewerName}</span>
                      <span>{formatDate(step.decisionDate)}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="px-6 pt-3 bg-white border-b border-slate-200 flex space-x-6 text-xs font-bold no-print">
          <button
            onClick={() => setActiveTab('form')}
            className={`pb-3 border-b-2 transition-colors flex items-center space-x-2 ${
              activeTab === 'form'
                ? 'border-[#0f2352] text-[#0f2352]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileCheck className="w-4 h-4 text-[#b91c1c]" />
            <span>Personnel Action Request Form (SST Official)</span>
          </button>

          <button
            onClick={() => setActiveTab('signatures')}
            className={`pb-3 border-b-2 transition-colors flex items-center space-x-2 ${
              activeTab === 'signatures'
                ? 'border-[#0f2352] text-[#0f2352]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Electronic Signatures & GTPUID Audit ({par.electronicSignatures.filter(s => s.status === 'signed').length} Signed)</span>
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`pb-3 border-b-2 transition-colors flex items-center space-x-2 ${
              activeTab === 'audit'
                ? 'border-[#0f2352] text-[#0f2352]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Clock className="w-4 h-4 text-slate-500" />
            <span>Activity Thread & Notes ({par.comments.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('notifications')}
            className={`pb-3 border-b-2 transition-colors flex items-center space-x-2 ${
              activeTab === 'notifications'
                ? 'border-purple-600 text-purple-700 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Bell className="w-4 h-4 text-purple-600" />
            <span>Department Notifications (IT & Talent Acquisition — No Action Required)</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="par-print-body flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/70">
          
          {/* TAB 1: EXACT OFFICIAL SST FORM */}
          {activeTab === 'form' && (
            <div className="space-y-6">
              
              {/* Document Container Formatted exactly like the PDF */}
              <div className="par-print-document bg-white p-6 sm:p-8 rounded-2xl border border-slate-300 shadow-sm font-sans text-slate-900">
                
                {/* PDF Header Stamp */}
                <div className="flex justify-between text-[11px] text-slate-400 border-b pb-2 mb-4 font-mono">
                  <span>{new Date().toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' })}</span>
                  <span className="font-sans font-medium text-slate-500">Personnel Action Request</span>
                  <span>{par.trackingNumber}</span>
                </div>

                {/* Logo & Form Title */}
                <div className="text-center mb-6">
                  <img 
                    src={SST_DEFAULT_LOGO} 
                    alt="School of Science & Technology" 
                    className="h-[90px] mx-auto object-contain mb-3 drop-shadow-xs"
                  />
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    Personnel Action Request Form
                  </h1>
                  <h2 className="text-base font-bold text-slate-700">
                    School of Science and Technology
                  </h2>
                  <div className="mt-2 text-sm font-black text-[#b91c1c] uppercase tracking-wide">
                    PAR Type: {typeInfo.label.replace(' / Separation', '').replace(' / Stipend Adjustment', '')}
                  </div>
                </div>

                {/* Box 1: Employee (Current Information) */}
                <div className="border border-slate-400 rounded-lg p-3.5 mb-6 bg-slate-50/40">
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center justify-between">
                    <span>Employee (Current Information)</span>
                    <button
                      type="button"
                      onClick={() => setIsEditingEmployee(!isEditingEmployee)}
                      className="inline-flex items-center space-x-1 px-2.5 py-1 bg-white hover:bg-blue-50 border border-slate-300 hover:border-blue-400 text-blue-800 text-[11px] font-bold rounded-lg transition-colors shadow-2xs no-print"
                      title="Edit employee name or ID"
                    >
                      <Pencil className="w-3 h-3" />
                      <span>{isEditingEmployee ? 'Cancel Editing' : 'Edit Employee Name / ID'}</span>
                    </button>
                  </div>

                  {isEditingEmployee ? (
                    <div className="space-y-3 p-3 bg-blue-50/60 rounded-xl border border-blue-200 no-print">
                      <div className="text-[11px] font-bold text-blue-900 flex items-center justify-between">
                        <span>Modify Employee Demographics</span>
                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={() => setIsEditingEmployee(false)}
                            className="px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-300 rounded-lg"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={handleSaveEmployeeDetails}
                            className="px-3 py-1 text-[11px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs flex items-center space-x-1"
                          >
                            <Check className="w-3 h-3" />
                            <span>Save Changes</span>
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">First Name:</label>
                          <input
                            type="text"
                            value={editFirstName}
                            onChange={(e) => setEditFirstName(e.target.value)}
                            className="w-full px-2 py-1.5 bg-white border border-blue-300 rounded-lg font-bold text-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Last Name:</label>
                          <input
                            type="text"
                            value={editLastName}
                            onChange={(e) => setEditLastName(e.target.value)}
                            className="w-full px-2 py-1.5 bg-white border border-blue-300 rounded-lg font-bold text-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">ADP Employee ID:</label>
                          <input
                            type="text"
                            value={editEmployeeId}
                            onChange={(e) => setEditEmployeeId(e.target.value)}
                            className="w-full px-2 py-1.5 bg-white border border-blue-300 rounded-lg font-mono font-bold text-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Title / Role:</label>
                          <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            className="w-full px-2 py-1.5 bg-white border border-blue-300 rounded-lg text-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs border-b border-slate-200 pb-3 mb-3">
                      <div>
                        <span className="text-slate-500 block text-[11px]">First Name:</span>
                        <strong className="text-sm text-slate-900">{par.firstName}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[11px]">Last Name:</span>
                        <strong className="text-sm text-slate-900">{par.lastName}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[11px]">ADP Position ID:</span>
                        <strong className="font-mono text-sm text-slate-900">{par.employeeId}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[11px]">Title:</span>
                        <strong className="text-sm text-slate-900 uppercase">{par.title}</strong>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs border-b border-slate-200 pb-3 mb-3">
                    <div>
                      <span className="text-slate-500 block text-[11px]">Location Region:</span>
                      <strong className="text-slate-900">{par.location}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">SST Campus:</span>
                      <strong className="text-slate-900">{par.campus}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">Employment Status:</span>
                      <strong className="text-slate-900">{par.employmentStatus}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">Employment Agreement:</span>
                      <strong className="text-blue-900 font-semibold">{par.contractType || 'At-Will'}</strong>
                    </div>
                  </div>
                </div>

                {/* Box 2: Termination Documentation (Questions 1 - 9) */}
                {par.actionType === 'termination' && (
                  <div className="border border-slate-400 rounded-lg p-3.5 mb-6 bg-white space-y-3.5 text-xs text-slate-800">
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 pb-1.5 flex items-center justify-between">
                      <span>Termination Documentation</span>
                      <span className="text-[11px] font-semibold text-blue-800">
                        {par.trsNotificationRequired ? 'TRS Separation Report Required' : 'TRS Notification Not Required'}
                      </span>
                    </div>

                    {/* Texas Statutory COBRA Election Deadline Alert */}
                    {(() => {
                      const cobra = getTexasCobraDeadline(par.lastDayWorked);
                      return (
                        <div className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${
                          cobra.isOverdue ? 'bg-rose-50 border-rose-200 text-rose-900' : 'bg-blue-50/70 border-blue-200 text-blue-900'
                        }`}>
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4 text-blue-700 shrink-0" />
                            <div>
                              <span className="font-bold">COBRA Notice to Plan Administrator Due: </span>
                              <span className="font-semibold">{cobra.deadlineDateStr}</span>
                              <span className="ml-1 text-[11px] text-slate-500">(30 calendar days from Last Day Worked)</span>
                            </div>
                          </div>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            cobra.isOverdue ? 'bg-rose-200 text-rose-900' : 'bg-blue-200 text-blue-900'
                          }`}>
                            {cobra.isOverdue ? '⚠️ Notice Overdue' : `${cobra.daysRemaining} days remaining`}
                          </span>
                        </div>
                      );
                    })()}

                    {par.finalPayDeadline && (
                      <div className="p-2.5 rounded-xl border text-xs bg-amber-50/70 border-amber-200 text-amber-950">
                        <span className="font-bold">Texas Final Pay Due (Tex. Lab. Code § 61.014): </span>
                        <span className="font-semibold">{formatDate(par.finalPayDeadline)}</span>
                        <span className="ml-1 text-[11px] text-slate-600">
                          ({par.isVoluntary ? 'next regular payday after resignation' : 'within 6 calendar days of discharge'})
                        </span>
                      </div>
                    )}

                    {par.outstandingPropertyNotes && (
                      <div className="p-2.5 rounded-xl border text-xs bg-rose-50/70 border-rose-200 text-rose-950">
                        <span className="font-bold">Property Still Outstanding: </span>
                        <span>{par.outstandingPropertyNotes}</span>
                      </div>
                    )}

                    {/* District Asset De-provisioning Checklist */}
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                      <div className="font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                        <span>District Asset De-provisioning & Equipment Handover:</span>
                        <span className="text-[10px] text-emerald-800 font-semibold bg-emerald-100 px-2 py-0.2 rounded">
                          IT & Facilities Verification
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                        <div className="flex items-center space-x-1.5">
                          <CheckCircle2 className={`w-3.5 h-3.5 ${par.laptopReturned !== false ? 'text-emerald-600' : 'text-slate-300'}`} />
                          <span className={par.laptopReturned !== false ? 'text-slate-800 font-medium' : 'text-slate-400'}>
                            District Laptop & Charger Handed In
                          </span>
                        </div>
                        <div className="flex items-center space-x-1.5">
                          <CheckCircle2 className={`w-3.5 h-3.5 ${par.keysBadgesReturned !== false ? 'text-emerald-600' : 'text-slate-300'}`} />
                          <span className={par.keysBadgesReturned !== false ? 'text-slate-800 font-medium' : 'text-slate-400'}>
                            Master Keys & Security Badge Returned
                          </span>
                        </div>
                        <div className="flex items-center space-x-1.5">
                          <CheckCircle2 className={`w-3.5 h-3.5 ${par.sisGradebookClosed !== false ? 'text-emerald-600' : 'text-slate-300'}`} />
                          <span className={par.sisGradebookClosed !== false ? 'text-slate-800 font-medium' : 'text-slate-400'}>
                            SIS Gradebook & Student Records Closed
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap justify-between gap-2 text-xs border-b border-slate-200 pb-2">
                      <div>
                        <span className="text-slate-500 font-medium">Employee's Work Email: </span>
                        <strong className="text-blue-700">{par.workEmail}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 font-medium">Associate ID: </span>
                        <strong className="font-mono text-slate-900">{par.associateId}</strong>
                        <span className="text-[10px] text-red-600 font-semibold ml-1">*required for IT group</span>
                      </div>
                    </div>

                    {/* ADP Workforce Now Alignment Card */}
                    <div className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-50 to-slate-50 border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-[#0f2352] text-white">
                            ADP Workforce Now® Alignment
                          </span>
                          <span className="text-[11px] font-bold text-slate-700">
                            Associate ID: <span className="font-mono text-blue-950 font-black">{par.associateId || par.employeeId}</span>
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-600 mt-1">
                          {par.currentStage === 'completed' ? (
                            <span className="text-emerald-800 font-bold flex items-center space-x-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Terminated & Position Control Released in ADP</span>
                            </span>
                          ) : (
                            <span className="text-amber-800 font-semibold flex items-center space-x-1">
                              <Clock className="w-3.5 h-3.5 text-amber-600" />
                              <span>ADP Closeout Queued for Payroll Final Processing</span>
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black inline-flex items-center space-x-1 ${
                          par.currentStage === 'completed'
                            ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                            : 'bg-amber-100 text-amber-900 border border-amber-300'
                        }`}>
                          <span>{par.currentStage === 'completed' ? '🟢 ADP Aligned (Terminated)' : '⏳ Alignment in Progress'}</span>
                        </span>
                      </div>
                    </div>

                    {/* Question 1 */}
                    <div>
                      <div className="font-bold text-slate-900">1. Is this termination voluntary or involuntary?</div>
                      <div className="mt-1 flex items-center space-x-6 text-xs">
                        <label className="flex items-center space-x-2">
                          <input type="radio" checked={par.isVoluntary === true} readOnly className="text-blue-600" />
                          <span>Voluntary</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input type="radio" checked={par.isVoluntary === false} readOnly className="text-blue-600" />
                          <span className="font-bold text-rose-800">Involuntary</span>
                        </label>
                        <span className="text-[11px] text-slate-400 italic">
                          (voluntary = employee resigned & involuntary = employee was terminated by SST)
                        </span>
                      </div>
                    </div>

                    {/* Question 2 */}
                    <div>
                      <div className="font-bold text-slate-900">
                        2. Is the termination due to a non-renewal for the end of the current school year?
                      </div>
                      <div className="mt-1 flex items-center space-x-4">
                        <label className="flex items-center space-x-1.5">
                          <input type="radio" checked={par.isSchoolYearNonRenewal === true} readOnly />
                          <span>Yes</span>
                        </label>
                        <label className="flex items-center space-x-1.5">
                          <input type="radio" checked={par.isSchoolYearNonRenewal === false} readOnly />
                          <span className="font-bold">No</span>
                        </label>
                      </div>
                    </div>

                    {/* Question 3 */}
                    <div>
                      <span className="font-bold text-slate-900">3. Last Day Worked: </span>
                      <strong className="text-slate-900 font-mono text-sm">{formatDate(par.lastDayWorked)}</strong>
                    </div>

                    {/* Question 4 */}
                    <div>
                      <div className="font-bold text-slate-900">4. Reason for termination:</div>
                      <div className="mt-1 p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-slate-800 font-medium">
                        {par.reasonForTermination}
                      </div>
                    </div>

                    {/* Question 5 */}
                    <div>
                      <div className="font-bold text-slate-900">
                        5. To-date, has all PTO/UTO/Leave been entered in ADP timesheets for employee. If not, please enter all leave into ADP before processing termination:
                      </div>
                      <div className="mt-1 flex items-center space-x-4">
                        <label className="flex items-center space-x-1.5">
                          <input type="radio" checked={par.allPtoEnteredInAdp === true} readOnly />
                          <span className="font-bold text-emerald-800">Yes</span>
                        </label>
                        <label className="flex items-center space-x-1.5">
                          <input type="radio" checked={par.allPtoEnteredInAdp === false} readOnly />
                          <span>No</span>
                        </label>
                      </div>
                    </div>

                    {/* Question 6 */}
                    <div>
                      <div className="font-bold text-slate-900">
                        6. Did employee return all Charter School property?
                      </div>
                      <div className="mt-1 flex items-center space-x-4">
                        <label className="flex items-center space-x-1.5">
                          <input type="radio" checked={par.returnedCharterProperty === true} readOnly />
                          <span className="font-bold text-emerald-800">Yes</span>
                        </label>
                        <label className="flex items-center space-x-1.5">
                          <input type="radio" checked={par.returnedCharterProperty === false} readOnly />
                          <span>No</span>
                        </label>
                      </div>
                    </div>

                    {/* Question 7: Documentation Upload */}
                    <div className="border-t border-slate-200 pt-2.5">
                      <div className="font-bold text-slate-900">7. Other Documentation Upload:</div>
                      <div className="text-[11px] text-slate-400 italic mb-1.5">
                        (ex: resignation letter, PIP/TINA documentation, emails and other documents relating to an involuntary termination)
                      </div>
                      {par.attachments.length > 0 ? (
                        par.attachments.map(att => (
                          <div key={att.id} className="text-blue-700 font-bold hover:underline cursor-pointer flex items-center space-x-1">
                            <span>📎 {att.name}</span>
                            <span className="text-[10px] text-slate-400">({att.size} • Please read)</span>
                          </div>
                        ))
                      ) : (
                        <div className="text-slate-400 italic">None attached</div>
                      )}
                    </div>

                    {/* Question 8 */}
                    <div>
                      <div className="font-bold text-slate-900">
                        8. Were there any Written Statements/Incident Reports?
                      </div>
                      <div className="mt-1 flex items-center space-x-4">
                        <label className="flex items-center space-x-1.5">
                          <input type="radio" checked={par.hasWrittenStatements === true} readOnly />
                          <span>Yes</span>
                        </label>
                        <label className="flex items-center space-x-1.5">
                          <input type="radio" checked={par.hasWrittenStatements === false} readOnly />
                          <span className="font-bold">No</span>
                        </label>
                      </div>
                    </div>

                    {/* Question 9 */}
                    <div>
                      <div className="font-bold text-slate-900">
                        9. Does the employee have any outstanding stipends, home visit payments, or other supplemental pay owed?
                      </div>
                      <div className="mt-1 flex items-center space-x-4">
                        <label className="flex items-center space-x-1.5">
                          <input type="radio" checked={par.outstandingStipendsOwed === true} readOnly />
                          <span>Yes</span>
                        </label>
                        <label className="flex items-center space-x-1.5">
                          <input type="radio" checked={par.outstandingStipendsOwed === false} readOnly />
                          <span className="font-bold">No</span>
                        </label>
                      </div>
                    </div>

                  </div>
                )}

                {/* Leave of Absence Details (SST Employee Request For Leave) */}
                {par.actionType === 'leave_of_absence' && (par.leaveTypes?.length || par.leaveType) && (
                  <div className="border border-slate-400 rounded-lg p-3.5 mb-6 bg-white text-xs space-y-3">
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 pb-1.5">
                      Leave of Absence Details
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">Type of Leave:</span>
                      <strong className="text-slate-900">{(par.leaveTypes?.length ? par.leaveTypes : [par.leaveType]).join(', ')}</strong>
                      {par.bereavementRelationship && <div className="text-slate-700 mt-0.5">Bereavement: relationship of the deceased: {par.bereavementRelationship}</div>}
                      {par.emergencyLeaveReason && <div className="text-slate-700 mt-0.5">Emergency leave reason: {par.emergencyLeaveReason}</div>}
                      {par.otherLeaveReason && <div className="text-slate-700 mt-0.5">Other: {par.otherLeaveReason}</div>}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div>
                        <span className="text-slate-500 block text-[11px]">First Day of Employment:</span>
                        <strong className="text-slate-900">{formatDate(par.firstDayOfEmployment)}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[11px]">Leave Begins:</span>
                        <strong className="text-slate-900">{formatDate(par.leaveStartDate)}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[11px]">Anticipated Return:</span>
                        <strong className="text-slate-900">{formatDate(par.expectedReturnDate)}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[11px]">Pay Status:</span>
                        <strong className="text-slate-900">{par.isPaidLeave ? 'Paid (accrued leave)' : 'Unpaid'}</strong>
                      </div>
                    </div>
                    {par.medicalCertificationStatus && (
                      <div className="rounded-md bg-amber-50 border border-amber-200 px-2.5 py-1.5 text-amber-950">
                        Medical certification: <strong>{par.medicalCertificationStatus}</strong> (kept by Benefits, not attached to this PAR)
                      </div>
                    )}
                    {par.employeeLeaveRequestSigned !== undefined && (
                      <ul className="text-slate-700 space-y-0.5">
                        <li>{par.employeeLeaveRequestSigned ? '✓' : '✗'} Employee signed the SST Employee Request For Leave</li>
                        <li>{par.leavePremiumsAcknowledged ? '✓' : '✗'} Employee agreed to pay benefit premiums while on leave</li>
                        <li>{par.leaveReturnCertAcknowledged ? '✓' : '✗'} Employee agreed to provide medical certification to return if required</li>
                      </ul>
                    )}
                  </div>
                )}

                {/* Box 3: Role Change / Campus Transfer Details */}
                {(par.actionType === 'campus_transfer' || par.actionType === 'role_change' || par.actionType === 'promotion' || par.actionType === 'salary_change') && (
                  <div className="border border-slate-400 rounded-lg p-3.5 mb-6 bg-slate-50/40 text-xs">
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Position Modification & Campus Assignment Details
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-3 bg-white rounded-lg border border-slate-200">
                        <span className="text-[11px] text-slate-400 font-bold uppercase block mb-1">Current Assignment</span>
                        <div className="space-y-1">
                          <div><strong>Title:</strong> {par.title}</div>
                          <div><strong>Campus:</strong> {par.campus}</div>
                          <div><strong>Salary:</strong> {formatCurrency(par.currentSalary)}</div>
                        </div>
                      </div>
                      <div className="p-3 bg-blue-50/70 rounded-lg border border-blue-200">
                        <span className="text-[11px] text-blue-800 font-bold uppercase block mb-1">Proposed Assignment</span>
                        <div className="space-y-1">
                          <div><strong>Title:</strong> {par.proposedTitle || par.title}</div>
                          <div><strong>Campus:</strong> {par.proposedCampus || par.campus}</div>
                          {par.proposedSalary && (
                            <div className="text-emerald-800 font-bold">
                              <strong>Salary:</strong> {formatCurrency(par.proposedSalary)} ({(par.percentIncrease ?? 0) >= 0 ? '+' : ''}{par.percentIncrease?.toFixed(1)}%)
                            </div>
                          )}
                          {par.stipendAmount && (
                            <div className="text-purple-800 font-bold">
                              <strong>Stipend:</strong> +{formatCurrency(par.stipendAmount)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    {par.notesRelatingToPositionChange && (
                      <div className="mt-3 pt-2 border-t border-slate-200 text-slate-700">
                        <strong>Notes Relating to Position Change:</strong> {par.notesRelatingToPositionChange}
                      </div>
                    )}
                  </div>
                )}

                {/* Box 4: Signature Approvals (Page 2 layout) */}
                <div className="border border-slate-400 rounded-lg p-3.5 mb-6 bg-white text-xs">
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 pb-1.5 mb-3 flex items-center justify-between">
                    <span>Signature Approvals</span>
                    <span className="text-[10px] text-slate-400 font-sans font-normal lowercase">
                      (electronic signatures recorded in the portal)
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <SignatureBox title="Principal / Supervisor" step={supervisorStep} currentStage={par.currentStage} />
                    <SignatureBox title="Chief People Officer" step={cpoStep} currentStage={par.currentStage} />
                    <SignatureBox title="Regional Executive Director" step={regionalStep} currentStage={par.currentStage} />
                  </div>

                  {par.finalPayCheckComment && (
                    <div className="mt-3 pt-2 border-t border-slate-200">
                      <span className="font-bold text-slate-700">Final Pay Check Comment: </span>
                      <span className="text-slate-800">{par.finalPayCheckComment}</span>
                    </div>
                  )}
                </div>

                {/* Box 5: HR - Termination Information & PTO Calculation (Page 2 & 3 layout) */}
                <div className="border border-slate-400 rounded-lg p-3.5 mb-6 bg-slate-50/50 text-xs">
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 pb-1.5 mb-3">
                    HR - Termination Information & Time Audit
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3 pb-3 border-b border-slate-200">
                    <div>
                      <span className="text-slate-500 block text-[11px]">Mark Rehire Status:</span>
                      {(() => {
                        const rehire = par.rehireEligibility || (par.markRehireStatus ? 'Yes' : 'No');
                        return (
                          <strong className={rehire === 'Yes' ? 'text-emerald-700' : rehire === 'No' ? 'text-red-700' : 'text-amber-700'}>
                            {rehire}
                          </strong>
                        );
                      })()}
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">Notify SIS?:</span>
                      <strong>{par.notifySis ? 'Yes' : 'No'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">Immediate Payout Require?:</span>
                      <strong>{par.immediatePayoutRequired ? 'Yes' : 'No'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">DPS SID#/Name:</span>
                      <strong className="font-mono">{par.dpsSid || '—'}</strong>
                    </div>
                  </div>

                  {/* PTO & Days Calculation Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
                    <div>
                      <span className="text-slate-500 font-sans block text-[10px]">Start Date / End Date:</span>
                      <span>{formatDate(par.startDate)} / {formatDate(par.endDate)}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 font-sans block text-[10px]">Total Worked Days:</span>
                      <span>{par.totalWorkedDays ?? 0}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 font-sans block text-[10px]">PTO Balance:</span>
                      <span>{par.ptoBalance ?? 0}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 font-sans block text-[10px]">Reason Code:</span>
                      <strong className="text-red-800 font-sans">{par.terminationCode || '—'}</strong>
                    </div>
                  </div>
                </div>

                {/* Box 6: Payroll & Final Wage Computation (Page 3 layout) */}
                <div className="border border-slate-400 rounded-lg p-3.5 mb-6 bg-white text-xs">
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 pb-1.5 mb-3">
                    Payroll & Final Settlement
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono mb-3">
                    <div>
                      <span className="text-slate-500 font-sans block text-[10px]">Total Compensated Days:</span>
                      <span>{par.totalCompensatedDays ?? '0.00'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 font-sans block text-[10px]">Daily Rate:</span>
                      <span>{formatCurrency(par.dailyRate || 161.54)}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 font-sans block text-[10px]">Unearned PTO Deduction:</span>
                      <span>{formatCurrency(par.unearnedPtoDeduction ?? 0)}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 font-sans block text-[10px]">Final Net Pay:</span>
                      <strong className="text-sm font-bold text-slate-900">{formatCurrency(par.finalPay ?? 0)}</strong>
                    </div>
                  </div>

                  {/* Signatures from HR, Benefits, Payroll */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-200">
                    <SignatureBox title={hrStep?.stageLabel || 'Regional HR Coordinator'} step={hrStep} currentStage={par.currentStage} />
                    <SignatureBox title="Benefits" step={benefitsStep} currentStage={par.currentStage} />
                    <SignatureBox title="Payroll" step={payrollStep} currentStage={par.currentStage} />
                  </div>

                  {/* Automated Department Notifications (FYI / No Action Required) */}
                  <div className="mt-6 pt-5 border-t-2 border-dashed border-slate-300">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-3 border-b border-slate-200 gap-2">
                      <div>
                        <h4 className="text-xs font-black uppercase tracking-wider text-[#0f2352] flex items-center space-x-2">
                          <Bell className="w-4 h-4 text-purple-600" />
                          <span>Department Notification & Asset Control (No Action Required)</span>
                        </h4>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Automated informational distribution list for equipment recovery, Google Workspace de-provisioning, and vacancy backfill recruitment.
                        </p>
                      </div>
                      <span className="px-2.5 py-1 bg-purple-100 text-purple-900 border border-purple-200 rounded-lg text-[10px] font-bold tracking-wider uppercase inline-flex items-center space-x-1 shrink-0">
                        <span>INFORMATIONAL ONLY • NO ACTION REQUIRED</span>
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      {deptNotifications.map((notif, nIdx) => (
                        <div key={nIdx} className="p-3.5 bg-purple-50/50 rounded-xl border border-purple-200 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="font-bold text-slate-900 text-xs flex items-center space-x-1.5">
                                {notif.type === 'it' ? <Laptop className="w-3.5 h-3.5 text-blue-600" /> : notif.type === 'dps' ? <Fingerprint className="w-3.5 h-3.5 text-rose-700" /> : <UserPlus className="w-3.5 h-3.5 text-emerald-600" />}
                                <span>{notif.department}</span>
                              </span>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center space-x-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>NOTIFIED</span>
                              </span>
                            </div>
                            <div className="font-bold text-slate-900 text-xs">{notif.recipientName}</div>
                            <div className="text-[11px] text-[#0f2352] font-semibold">{notif.recipientRole}</div>
                            <div className="text-[11px] text-blue-700 font-mono mt-0.5">{notif.recipientEmail}</div>
                            <p className="text-[11px] text-slate-600 mt-2 bg-white/80 p-2 rounded-lg border border-purple-100">
                              <strong>Scope:</strong> {notif.purpose}
                            </p>
                          </div>
                          <div className="mt-2.5 pt-2 border-t border-purple-100 text-[10px] text-slate-400 flex items-center justify-between">
                            <span>Region: {notif.region}</span>
                            <span className="text-purple-700 font-bold">No Signature Required</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

              </div>
            </div>
          )}

          {/* TAB 2: ELECTRONIC SIGNATURE PROCESS RECORD (Page 4 layout) */}
          {activeTab === 'signatures' && (
            <div className="space-y-4">
              <div className="bg-white p-6 rounded-2xl border border-slate-300 shadow-sm font-mono text-xs text-slate-800 leading-relaxed">
                
                <div className="border border-slate-700 rounded-xl p-5 bg-slate-50">
                  <h3 className="text-base font-bold text-slate-900 mb-2 font-sans flex items-center space-x-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-600" />
                    <span>Electronic Signature Process Record</span>
                  </h3>
                  <p className="text-xs text-slate-600 font-sans mb-4">
                    The document above has been electronically signed in accordance with state and federal electronic signature law.
                  </p>

                  <div className="bg-slate-900 text-emerald-400 p-2.5 rounded-lg text-xs break-all mb-6">
                    <span className="text-slate-400 font-sans font-bold">GTPUID Transaction Token: </span>
                    {par.gtpuid}
                  </div>

                  <div className="space-y-4 font-mono text-xs">
                    {par.electronicSignatures.map((sig, idx) => (
                      <div key={idx} className="p-3 bg-white rounded-lg border border-slate-300 shadow-2xs">
                        <div className="flex items-center justify-between font-bold text-slate-900 pb-1 mb-1 border-b border-slate-200">
                          <span>Signing party: {sig.signingParty}</span>
                          {sig.status === 'signed' ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center space-x-1">
                              <Check className="w-3 h-3" />
                              <span>ELECTRONICALLY SIGNED</span>
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                              PENDING SIGNATURE
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-600 space-y-0.5">
                          <div>Signer ID: <span className="text-slate-800 font-semibold">{sig.signerId}</span></div>
                          <div>IP Address: <span className="text-slate-800 font-semibold">{sig.ipAddress}</span></div>
                          <div>Timestamp: <span className="text-slate-800">{sig.timestamp || 'Pending Sign-Off'}</span></div>
                          <div>Email: <span className="text-blue-700 font-semibold">{sig.signerEmail}</span></div>
                          <div>User: <span className="text-slate-900 font-bold">{sig.signerName} &lt;{sig.signerEmail}&gt;</span></div>
                        </div>
                      </div>
                    ))}
                  </div>

                </div>

              </div>
            </div>
          )}

          {/* TAB 3: AUDIT TRAIL & COLLABORATION COMMENTS */}
          {activeTab === 'audit' && (
            <div className="space-y-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4 flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-[#0f2352]" />
                  <span>SST Campus & Department Activity Log</span>
                </h3>

                <div className="space-y-3.5">
                  {par.comments.map((comm) => (
                    <div key={comm.id} className="flex items-start space-x-3 text-xs">
                      <div className="w-8 h-8 rounded-full bg-[#0f2352] text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                        {comm.authorName.charAt(0)}
                      </div>
                      <div className="flex-1 bg-slate-50 p-3 rounded-xl border border-slate-200">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-slate-900">{comm.authorName}</span>
                          <span className="text-[11px] text-slate-400">{formatDateTime(comm.timestamp)}</span>
                        </div>
                        <div className="text-[11px] text-[#0f2352] font-semibold mb-1">
                          {comm.authorRole} • {comm.authorDepartment}
                        </div>
                        <p className="text-slate-700 leading-relaxed">{comm.message}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <form onSubmit={handlePostComment} className="mt-6 pt-4 border-t border-slate-200">
                  <label className="block text-xs font-bold text-slate-700 mb-2">
                    Add SST Internal Communication Note:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder={`Comment as ${currentPersona.name} (${currentPersona.role})...`}
                      value={generalComment}
                      onChange={(e) => setGeneralComment(e.target.value)}
                      className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0f2352]/20 focus:border-[#0f2352]"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-[#0f2352] hover:bg-[#1a3880] text-white text-xs font-bold rounded-xl flex items-center space-x-1.5 transition-colors"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Post</span>
                    </button>
                  </div>
                </form>

              </div>
            </div>
          )}

          {/* TAB 4: DEPARTMENT NOTIFICATIONS & ASSET/RECRUITMENT CONTROL (NO ACTION REQUIRED) */}
          {activeTab === 'notifications' && (
            <div className="space-y-5">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-slate-200 gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                      <Bell className="w-4 h-4 text-purple-600" />
                      <span>Stakeholder Department Notifications</span>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                        INFORMATIONAL ONLY • NO ACTION REQUIRED
                      </span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      The following departments receive automated notifications upon PAR creation and updates for informational coordination, asset de-provisioning, and backfill recruitment. No signature or approval is required.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleResendNotifications}
                    className="shrink-0 px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs rounded-xl shadow-xs flex items-center space-x-1.5 transition-colors"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Resend Automated Notifications</span>
                  </button>
                </div>

                {notificationsSentToast && (
                  <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center space-x-2 animate-fadeIn">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{notificationsSentToast}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {deptNotifications.map((notif, nIdx) => (
                    <div key={nIdx} className="p-5 rounded-2xl border border-purple-200 bg-gradient-to-br from-purple-50/60 to-white shadow-2xs space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs uppercase tracking-wider text-purple-900 flex items-center space-x-1.5">
                          {notif.type === 'it' ? <Laptop className="w-4 h-4 text-blue-600" /> : notif.type === 'dps' ? <Fingerprint className="w-4 h-4 text-rose-700" /> : <UserPlus className="w-4 h-4 text-emerald-600" />}
                          <span>{notif.department}</span>
                        </span>
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center space-x-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>AUTOMATED NOTICE SENT</span>
                        </span>
                      </div>

                      <div className="border-t border-purple-100 pt-3">
                        <div className="text-sm font-bold text-slate-900">{notif.recipientName}</div>
                        <div className="text-xs font-medium text-[#0f2352]">{notif.recipientRole}</div>
                        <div className="text-xs text-blue-700 font-mono mt-0.5">{notif.recipientEmail}</div>
                      </div>

                      <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs text-slate-700 space-y-1">
                        <div className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">Department Operational Scope:</div>
                        <div className="text-[11px] text-slate-600 leading-relaxed">{notif.purpose}</div>
                      </div>

                      <div className="pt-2 border-t border-purple-100 text-[11px] text-slate-500 flex items-center justify-between">
                        <span>Assigned Region: <strong>{notif.region}</strong></span>
                        <span className="text-purple-700 font-bold">No Signature Required</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-5 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-start space-x-3">
                  <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-800">Why are these departments notified without requiring approval?</strong>
                    <p className="mt-0.5 leading-relaxed text-[11px]">
                      Per SST District policy, IT requires prompt notification to initiate hardware returns and account deactivations (or device provisioning for transfers/promotions), while Talent Acquisition requires real-time vacancy updates to launch recruitment backfills. Because these are operational workflows rather than administrative authorizers, their involvement is strictly informational and does not delay or block PAR processing.
                    </p>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* Department Action Box (Visible when active persona can sign!) */}
          {canAct && (
            <div className="bg-gradient-to-br from-amber-50 to-orange-50/70 p-5 rounded-2xl border-2 border-amber-400 shadow-md no-print">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-amber-500 animate-ping" />
                  <h4 className="text-xs font-black uppercase tracking-wider text-amber-900">
                    SST Electronic Sign-Off Required for Your Department
                  </h4>
                </div>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-200 text-amber-900 border border-amber-300">
                  Acting as: {currentPersona.name} ({currentPersona.role})
                </span>
              </div>

              <p className="text-xs text-amber-900 mb-3">
                Review the submission and payroll data above. Entering sign-off remarks will electronically record your signature with IP <code className="font-mono bg-amber-200/60 px-1 py-0.5 rounded">{currentPersona.ipAddress}</code> and advance the request to the next department.
              </p>

              <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                <span className="font-bold text-slate-700">Quick HR Compliance & Return Remarks:</span>
                <select
                  value={selectedReasonTemplate}
                  onChange={(e) => {
                    setSelectedReasonTemplate(e.target.value);
                    if (e.target.value) {
                      setDecisionNotes(e.target.value);
                    }
                  }}
                  className="text-xs bg-white border border-amber-300 rounded-xl px-2.5 py-1 text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500 font-medium max-w-xs sm:max-w-sm truncate"
                >
                  <option value="">-- Choose Standard HR Reason --</option>
                  {HR_REVISION_REASONS.map((reason, idx) => (
                    <option key={idx} value={reason}>{reason}</option>
                  ))}
                </select>
              </div>

              <textarea
                rows={2}
                placeholder="Enter endorsement notes, policy compliance remarks, or return instructions..."
                value={decisionNotes}
                onChange={(e) => setDecisionNotes(e.target.value)}
                className="w-full p-3 text-xs bg-white border border-amber-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-slate-900 mb-3"
              />

              {/* ADP Payroll Execution Batch Reference */}
              {par.currentStage === 'payroll_action' && (
                <div className="mb-3 p-3 bg-emerald-50 rounded-xl border border-emerald-300 text-xs flex flex-wrap items-center justify-between gap-2 shadow-2xs">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="w-4 h-4 text-emerald-700 shrink-0" />
                    <div>
                      <span className="font-bold text-emerald-950">ADP Workforce Now Batch Reference:</span>
                      <div className="text-[11px] text-emerald-800">Record the ADP payroll batch number or transaction ID for the audit trail</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={adpBatchNumber}
                      onChange={(e) => setAdpBatchNumber(e.target.value)}
                      placeholder="e.g. ADP-2026-B849"
                      className="w-36 px-2.5 py-1 text-xs font-mono font-bold bg-white border border-emerald-400 rounded-lg text-emerald-950 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={() => setAdpBatchNumber(`ADP-${new Date().getFullYear()}-B${Math.floor(100 + Math.random() * 900)}`)}
                      className="text-[10px] text-emerald-800 underline font-semibold hover:text-emerald-900"
                      title="Generate fresh batch ID"
                    >
                      (Auto-Gen)
                    </button>
                  </div>
                </div>
              )}

              {currentPersona.signingPin && (
                <div className="mb-3 p-3 bg-white rounded-xl border border-amber-300 text-xs flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <Lock className="w-4 h-4 text-amber-600 shrink-0" />
                    <div>
                      <span className="font-bold text-slate-800">Texas UETA Electronic Signature Verification:</span>
                      <div className="text-[11px] text-slate-500">Enter your assigned 4-6 digit PIN to execute this endorsement</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="password"
                      maxLength={6}
                      value={pinInput}
                      onChange={(e) => setPinInput(e.target.value)}
                      placeholder="PIN"
                      className="w-20 px-2 py-1 text-center font-mono font-bold bg-amber-50 border border-amber-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={handleRevision}
                  className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-white hover:bg-orange-50 border border-orange-300 text-orange-800 text-xs font-bold rounded-xl transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-orange-600" />
                  <span>Request Campus Revision</span>
                </button>

                <button
                  type="button"
                  onClick={handleReject}
                  className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-white hover:bg-rose-50 border border-rose-300 text-rose-700 text-xs font-bold rounded-xl transition-colors"
                >
                  <ThumbsDown className="w-3.5 h-3.5 text-rose-600" />
                  <span>Reject Request</span>
                </button>

                <button
                  type="button"
                  onClick={handleApprove}
                  className="inline-flex items-center space-x-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl shadow-md shadow-emerald-600/20 transition-all active:scale-95"
                >
                  <ThumbsUp className="w-4 h-4" />
                  <span>{par.currentStage === 'payroll_action' ? 'Execute in ADP & Complete PAR' : 'Sign & Forward to Next Department'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Notification-Only Informational Banner */}
          {currentPersona.isNotificationOnly && (
            <div className="bg-purple-50 border border-purple-200 p-4 rounded-2xl text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-purple-900 shadow-2xs no-print">
              <div className="flex items-center space-x-3">
                <Bell className="w-5 h-5 text-purple-600 shrink-0" />
                <div>
                  <div className="font-bold">
                    📢 Notification Recipient: {currentPersona.name} ({currentPersona.role})
                  </div>
                  <div className="text-[11px] text-purple-700">
                    This Personnel Action Request is provided to your department for informational coordination & asset/vacancy management. No signature or approval action is required from you.
                  </div>
                </div>
              </div>
              <span className="px-3 py-1 bg-purple-200/80 text-purple-950 font-bold rounded-lg text-[10px] uppercase tracking-wider shrink-0 border border-purple-300">
                No Action Required
              </span>
            </div>
          )}

          {/* Helper banner when user is viewing but cannot sign as current persona */}
          {!canAct && !currentPersona.isNotificationOnly && par.currentStage !== 'completed' && par.currentStage !== 'rejected' && (
            <div className="bg-gradient-to-r from-amber-50 to-blue-50 p-4 rounded-2xl border border-amber-200 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 no-print shadow-2xs">
              <div className="flex items-center space-x-3 text-slate-700">
                <Clock className="w-5 h-5 text-amber-600 shrink-0" />
                <div>
                  <div className="font-medium text-slate-800">
                    Currently waiting for endorsement by <strong className="text-slate-900">{currentStep?.assignedRole} ({currentStep?.assignedDepartment})</strong>.
                  </div>
                  {eligiblePersona && (
                    <div className="text-[11px] text-slate-500">
                      Eligible approver: <span className="font-semibold text-slate-700">{eligiblePersona.name}</span> ({eligiblePersona.email})
                    </div>
                  )}
                </div>
              </div>

              {eligiblePersona && onSwitchPersona ? (
                <button
                  type="button"
                  onClick={() => onSwitchPersona(eligiblePersona)}
                  className="shrink-0 px-4 py-2 bg-[#0f2352] hover:bg-[#1a3880] text-white font-bold text-xs rounded-xl shadow-xs flex items-center space-x-2 transition-all active:scale-95"
                  title={`Switch active persona to ${eligiblePersona.name} to sign this request`}
                >
                  <ShieldCheck className="w-4 h-4 text-amber-300" />
                  <span>Switch to {eligiblePersona.name.split(' ')[0]} to Sign ({currentStep?.stageLabel || 'Pending Stage'})</span>
                </button>
              ) : (
                <span className="text-[11px] text-[#0f2352] font-bold bg-white px-2.5 py-1 rounded-lg border border-slate-200 shrink-0">
                  Switch role in top-right to test this sign-off
                </span>
              )}
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
