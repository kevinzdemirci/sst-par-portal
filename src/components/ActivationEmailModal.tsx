import React, { useState } from 'react';
import { ApproverRoleConfig, UserPersona } from '../types/par';
import { SST_DEFAULT_LOGO } from '../data/sstLogo';
import { 
  X, 
  Mail, 
  Send, 
  Copy, 
  Check, 
  ShieldCheck, 
  Sparkles,
  ArrowRight,
  ExternalLink,
  Settings,
  Zap
} from 'lucide-react';
import { 
  getStoredGmailCredentials, 
  sendGmailEmail 
} from '../utils/gmailService';

interface ActivationEmailModalProps {
  role: ApproverRoleConfig | UserPersona;
  onClose: () => void;
  onOpenActivationPortal: (role: ApproverRoleConfig | UserPersona) => void;
  onOpenGmailSettings?: () => void;
  hrNotificationEmail?: string;
  emailWebhookUrl?: string;
}

export const ActivationEmailModal: React.FC<ActivationEmailModalProps> = ({
  role,
  onClose,
  onOpenActivationPortal,
  onOpenGmailSettings,
  hrNotificationEmail = 'hr@ssttx.org',
  emailWebhookUrl
}) => {
  const [copied, setCopied] = useState(false);
  const [isSendingWebhook, setIsSendingWebhook] = useState(false);
  const [webhookSent, setWebhookSent] = useState(false);
  const [isSendingGmail, setIsSendingGmail] = useState(false);
  const [gmailSent, setGmailSent] = useState(false);
  const [gmailFeedback, setGmailFeedback] = useState<string | null>(null);

  const gmailCreds = getStoredGmailCredentials();
  const hrEmail = gmailCreds.isEnabled && gmailCreds.senderEmail ? gmailCreds.senderEmail : (hrNotificationEmail || 'hr@ssttx.org');

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
District HR Office: ${hrEmail}
School of Science and Technology Charter District`;

  const mailtoUrl = `mailto:${encodeURIComponent(role.email)}?cc=${encodeURIComponent(hrEmail)}&subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBodyText)}`;
  const gmailWebUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(role.email)}&cc=${encodeURIComponent(hrEmail)}&su=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBodyText)}`;
  const outlookWebUrl = `https://outlook.office.com/mail/deeplink/compose?to=${encodeURIComponent(role.email)}&cc=${encodeURIComponent(hrEmail)}&subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBodyText)}`;

  const handleSendGmail = async () => {
    const creds = getStoredGmailCredentials();
    if (!creds.isEnabled || (!creds.scriptUrl && !creds.emailJsServiceId && !creds.smtpEndpoint)) {
      if (onOpenGmailSettings) {
        onOpenGmailSettings();
      } else {
        alert('Please configure your Gmail credentials first.');
      }
      return;
    }

    setIsSendingGmail(true);
    setGmailFeedback(null);
    try {
      const result = await sendGmailEmail({
        to: role.email,
        toName: role.name,
        subject: emailSubject,
        bodyText: emailBodyText,
        category: 'activation'
      }, creds);

      if (result.success) {
        setGmailSent(true);
        setGmailFeedback(`Dispatched from ${creds.senderEmail} via Gmail!`);
      } else {
        setGmailFeedback(`⚠️ ${result.message}`);
      }
    } catch (err: any) {
      setGmailFeedback(`⚠️ Failed: ${err.message || 'Error reaching Gmail dispatcher'}`);
    } finally {
      setIsSendingGmail(false);
    }
  };

  const handleSendWebhook = async () => {
    if (!emailWebhookUrl) return;
    setIsSendingWebhook(true);
    try {
      await fetch(emailWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: role.email,
          cc: hrEmail,
          subject: emailSubject,
          body: emailBodyText,
          activationUrl,
          recipientName: role.name,
          roleTitle,
          timestamp: new Date().toISOString()
        })
      });
      setWebhookSent(true);
    } catch {
      alert('Could not dispatch via webhook. Please use the Gmail or Outlook buttons.');
    } finally {
      setIsSendingWebhook(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(emailBodyText);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleCopyLinkOnly = () => {
    navigator.clipboard.writeText(activationUrl);
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
              <span className="font-semibold text-slate-800 flex items-center space-x-1.5">
                <span>{gmailCreds.isEnabled ? `${gmailCreds.senderName} <${gmailCreds.senderEmail}>` : 'SST Human Capital Systems <noreply@ssttx.org>'}</span>
                {gmailCreds.isEnabled && (
                  <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded border border-emerald-200 flex items-center space-x-0.5">
                    <Zap className="w-2.5 h-2.5 text-emerald-600" />
                    <span>Gmail Active</span>
                  </span>
                )}
              </span>
            </div>
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="text-slate-500 font-medium">To (Designated Approver):</span>
              <span className="font-bold text-[#0f2352] font-mono">{role.name} &lt;{role.email}&gt;</span>
            </div>
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="text-slate-500 font-medium">CC Audit Copy:</span>
              <span className="font-semibold text-slate-700 font-mono">District HR Office &lt;{hrEmail}&gt;</span>
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
                  src={SST_DEFAULT_LOGO} 
                  alt="SST Logo" 
                  className="w-14 h-14 object-contain rounded-lg border border-slate-200"
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
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col gap-3 shrink-0">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Dispatch to Approver ({role.email}):
            </span>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleCopyLinkOnly}
                className="px-2.5 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-bold text-xs rounded-xl transition-colors inline-flex items-center space-x-1"
                title="Copy only the direct activation URL"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                <span>Copy Link Only</span>
              </button>

              <button
                type="button"
                onClick={handleCopy}
                className="px-2.5 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-bold text-xs rounded-xl transition-colors inline-flex items-center space-x-1"
                title="Copy full official invitation letter text"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                <span>Copy Full Email</span>
              </button>
            </div>
          </div>

          {/* Gmail Feedback Alert if sent/failed */}
          {gmailFeedback && (
            <div className={`p-2.5 rounded-xl text-xs flex items-center justify-between border ${
              gmailSent 
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                : 'bg-amber-50 text-amber-800 border-amber-200'
            }`}>
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span className="font-semibold">{gmailFeedback}</span>
              </div>
              {onOpenGmailSettings && (
                <button
                  type="button"
                  onClick={onOpenGmailSettings}
                  className="underline text-[11px] font-bold ml-2 hover:text-slate-900"
                >
                  Configure Gmail
                </button>
              )}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
            <div className="flex flex-wrap items-center gap-2">
              {/* Automated 1-Click Send via Gmail */}
              {gmailCreds.isEnabled ? (
                <button
                  type="button"
                  onClick={handleSendGmail}
                  disabled={isSendingGmail || gmailSent}
                  className="inline-flex items-center justify-center space-x-1.5 px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 disabled:from-emerald-400 disabled:to-teal-500 text-white font-bold text-xs rounded-xl transition-all shadow-md active:scale-95"
                  title={`Send directly from authenticated Gmail account (${gmailCreds.senderEmail})`}
                >
                  <Send className="w-3.5 h-3.5 text-amber-300" />
                  <span>
                    {gmailSent 
                      ? '✅ Sent via Gmail' 
                      : isSendingGmail 
                        ? 'Dispatching via Gmail...' 
                        : `🚀 Send via Gmail (${gmailCreds.senderEmail})`}
                  </span>
                </button>
              ) : (
                onOpenGmailSettings && (
                  <button
                    type="button"
                    onClick={onOpenGmailSettings}
                    className="inline-flex items-center justify-center space-x-1.5 px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs rounded-xl transition-colors shadow-2xs"
                    title="Configure your Gmail credentials to send invitations automatically"
                  >
                    <Settings className="w-3.5 h-3.5 text-amber-600" />
                    <span>⚙️ Setup Gmail Dispatcher</span>
                  </button>
                )
              )}

              {/* Gmail Web */}
              <a
                href={gmailWebUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center space-x-1.5 px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-bold text-xs rounded-xl transition-colors"
                title="Open new draft in Gmail Web (Google Workspace)"
              >
                <ExternalLink className="w-3.5 h-3.5 text-red-600" />
                <span>Open Gmail Web</span>
              </a>

              {/* Mail App */}
              <a
                href={mailtoUrl}
                className="inline-flex items-center justify-center space-x-1.5 px-3.5 py-2 bg-[#0f2352] hover:bg-[#1a3880] text-white font-bold text-xs rounded-xl transition-colors shadow-2xs"
                title="Launch default email app (Apple Mail, Outlook, Thunderbird)"
              >
                <Send className="w-3.5 h-3.5 text-amber-300" />
                <span>Send via Mail App</span>
              </a>

              {/* Outlook 365 Web */}
              <a
                href={outlookWebUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center space-x-1.5 px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-bold text-xs rounded-xl transition-colors"
                title="Open new draft in Outlook 365 Web"
              >
                <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
                <span>Open Outlook 365</span>
              </a>

              {/* Background Webhook Dispatch (if configured) */}
              {emailWebhookUrl && (
                <button
                  type="button"
                  onClick={handleSendWebhook}
                  disabled={isSendingWebhook || webhookSent}
                  className="inline-flex items-center justify-center space-x-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-bold text-xs rounded-xl transition-colors shadow-2xs"
                  title={`Send directly in background from ${hrEmail}`}
                >
                  <Send className="w-3.5 h-3.5 text-white" />
                  <span>{webhookSent ? '✅ Sent via Webhook' : isSendingWebhook ? 'Sending...' : '⚡ Send via HR Webhook'}</span>
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl transition-colors ml-auto"
            >
              Done / Close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
