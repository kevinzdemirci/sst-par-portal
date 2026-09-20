import React, { useState } from 'react';
import { ApproverRoleConfig, UserPersona } from '../types/par';
import { 
  X, 
  Mail, 
  Send, 
  Copy, 
  Check, 
  ShieldCheck, 
  Sparkles,
  ArrowRight
} from 'lucide-react';

interface ActivationEmailModalProps {
  role: ApproverRoleConfig | UserPersona;
  onClose: () => void;
  onOpenActivationPortal: (role: ApproverRoleConfig | UserPersona) => void;
}

export const ActivationEmailModal: React.FC<ActivationEmailModalProps> = ({
  role,
  onClose,
  onOpenActivationPortal
}) => {
  const [copied, setCopied] = useState(false);

  // Build activation link
  const baseUrl = window.location.origin + window.location.pathname;
  const activationUrl = `${baseUrl}?activate=${encodeURIComponent(role.id)}`;

  const roleTitle = 'title' in role ? role.title : role.role;
  const roleCampus = role.campus || 'District-Wide';
  const roleRegion = role.region || 'All SST Schools';

  const emailSubject = `ACTION REQUIRED: Complete Your Electronic Signature & Activate Approver Role (${roleTitle})`;
  
  const emailBodyText = `Dear ${role.name},

You have been designated as an official workflow approver for the School of Science and Technology (SST) Personnel Action Request (PAR) system.

Role: ${roleTitle}
Department: ${role.department}
Campus / Region: ${roleCampus} • ${roleRegion}
Official Email: ${role.email}

In accordance with the Texas Uniform Electronic Transactions Act (Tex. Bus. & Com. Code § 322) and SST District Policy, you are required to claim your role, set up your digital signature, and establish your secure 4-6 digit signing PIN before you can endorse personnel actions.

To complete your self-onboarding and activate your electronic signature profile, click the secure link below:

${activationUrl}

Sincerely,
School of Science and Technology
Human Capital & HR Systems
School of Science and Technology Charter District`;

  const mailtoUrl = `mailto:${encodeURIComponent(role.email)}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBodyText)}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(emailBodyText);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full flex flex-col overflow-hidden border border-slate-200 animate-scaleUp">
        
        {/* Modal Header */}
        <div className="p-6 bg-gradient-to-r from-[#0f2352] to-[#1a3880] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-white/10 rounded-2xl border border-white/20">
              <Mail className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-black tracking-tight">Activation Email Sent</h3>
                <span className="text-[10px] font-bold bg-emerald-400/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-400/30 flex items-center space-x-1">
                  <Sparkles className="w-3 h-3" />
                  <span>Dispatched</span>
                </span>
              </div>
              <p className="text-xs text-blue-200 mt-0.5">
                Invitation sent to <strong className="text-white font-mono">{role.email}</strong> to activate their approver role.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-blue-200 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Email Envelope Container */}
        <div className="p-6 overflow-y-auto space-y-4 max-h-[65vh]">
          
          {/* Metadata Header Bar */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs space-y-2">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="text-slate-500 font-medium">From:</span>
              <span className="font-semibold text-slate-800">SST Human Capital Systems &lt;noreply@ssttx.org&gt;</span>
            </div>
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="text-slate-500 font-medium">To:</span>
              <span className="font-bold text-[#0f2352] font-mono">{role.name} &lt;{role.email}&gt;</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">Subject:</span>
              <span className="font-bold text-slate-900 truncate">{emailSubject}</span>
            </div>
          </div>

          {/* Letterhead Preview */}
          <div className="bg-white border-2 border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
            
            {/* SST Crest Branding Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-3">
                <img 
                  src="/sst-logo.jpg" 
                  alt="SST Logo" 
                  className="w-10 h-10 object-contain rounded-lg border border-slate-200"
                />
                <div>
                  <h4 className="font-black text-sm text-[#0f2352] tracking-tight">School of Science and Technology</h4>
                  <div className="text-[10px] text-slate-400 font-semibold">Texas Public Charter School District • Human Resources</div>
                </div>
              </div>
              <span className="text-[10px] font-mono bg-blue-50 text-blue-800 px-2 py-1 rounded-lg border border-blue-200">
                UETA Compliant
              </span>
            </div>

            {/* Email Body */}
            <div className="space-y-3 text-xs text-slate-700 leading-relaxed">
              <p>Dear <strong>{role.name}</strong>,</p>

              <p>
                You have been designated as an official workflow approver for the <strong>School of Science and Technology</strong> Personnel Action Request (PAR) system.
              </p>

              <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl space-y-1.5 text-[11px]">
                <div><span className="text-slate-500 font-medium">Assigned Role:</span> <strong className="text-slate-900">{roleTitle}</strong></div>
                <div><span className="text-slate-500 font-medium">Department:</span> <strong className="text-slate-800">{role.department}</strong></div>
                <div><span className="text-slate-500 font-medium">Campus Scope:</span> <strong className="text-slate-800">{roleCampus} • {roleRegion}</strong></div>
              </div>

              <p>
                In accordance with the <strong>Texas Uniform Electronic Transactions Act (Tex. Bus. & Com. Code § 322)</strong> and SST District Policy, you must claim your account, configure your electronic signature, and establish your 4-6 digit signing PIN before you can endorse personnel actions.
              </p>

              {/* Big Call to Action Button */}
              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenActivationPortal(role);
                  }}
                  className="inline-flex items-center space-x-2 px-6 py-3 bg-[#0f2352] hover:bg-[#1a3880] text-white font-black text-xs rounded-xl shadow-md transition-all active:scale-95"
                >
                  <ShieldCheck className="w-4 h-4 text-amber-300" />
                  <span>Claim & Activate Approver Account</span>
                  <ArrowRight className="w-4 h-4 text-blue-200" />
                </button>
              </div>

              {/* Direct Link Fallback */}
              <div className="pt-2 text-[11px] text-slate-500">
                <span>Or copy and paste this link in your browser:</span>
                <div className="mt-1 p-2 bg-slate-50 rounded-lg border border-slate-200 font-mono text-[10px] text-blue-800 break-all select-all">
                  {activationUrl}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 text-[10px] text-slate-400">
              School of Science and Technology • Texas Public Charter District • Human Resources Department
            </div>
          </div>

        </div>

        {/* Modal Action Bar */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <a
              href={mailtoUrl}
              className="flex-1 sm:flex-none inline-flex items-center justify-center space-x-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-colors shadow-2xs"
              title="Open your email client (Outlook, Gmail, Apple Mail) with this message pre-filled"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send via Outlook / Gmail</span>
            </a>

            <button
              type="button"
              onClick={handleCopy}
              className="flex-1 sm:flex-none inline-flex items-center justify-center space-x-1.5 px-3.5 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-bold text-xs rounded-xl transition-colors"
              title="Copy the full email message and activation link"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-600" />}
              <span>{copied ? 'Copied to Clipboard!' : 'Copy Link & Text'}</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
