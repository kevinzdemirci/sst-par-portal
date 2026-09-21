import React, { useState } from 'react';
import { 
  X, 
  Send, 
  CheckCircle2, 
  AlertTriangle, 
  Copy, 
  Check, 
  ExternalLink, 
  Sparkles, 
  Code, 
  Key, 
  RotateCcw,
  Zap,
  Globe
} from 'lucide-react';
import { 
  GmailCredentials, 
  DEFAULT_GMAIL_CREDENTIALS, 
  getStoredGmailCredentials, 
  saveGmailCredentials, 
  sendGmailEmail, 
  GOOGLE_APPS_SCRIPT_SAMPLE 
} from '../utils/gmailService';
import { SST_DEFAULT_LOGO } from '../data/sstLogo';

interface GmailSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onToast: (text: string, type?: 'success' | 'warning' | 'info') => void;
  onSaved?: (creds: GmailCredentials) => void;
}

export const GmailSettingsModal: React.FC<GmailSettingsModalProps> = ({
  isOpen,
  onClose,
  onToast,
  onSaved
}) => {
  if (!isOpen) return null;

  const [creds, setCreds] = useState<GmailCredentials>(() => getStoredGmailCredentials());
  const [copiedCode, setCopiedCode] = useState(false);
  const [testRecipient, setTestRecipient] = useState(creds.senderEmail || 'sstpar@ssttx.org');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const isConfigured = Boolean(
    creds.isEnabled && (
      (creds.mode === 'google_script' && creds.scriptUrl) ||
      (creds.mode === 'emailjs' && creds.emailJsServiceId && creds.emailJsPublicKey) ||
      (creds.mode === 'smtp_relay' && creds.smtpEndpoint)
    )
  );

  const handleCopyScriptCode = () => {
    navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_SAMPLE);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 3000);
    onToast('Google Apps Script code copied to clipboard!', 'info');
  };

  const handleTestConnection = async () => {
    if (!testRecipient.trim() || !testRecipient.includes('@')) {
      alert('Please enter a valid recipient email address for testing.');
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      const result = await sendGmailEmail({
        to: testRecipient.trim(),
        toName: 'SST System Tester',
        subject: '🧪 SST Portal: Gmail Dispatch Verification Test',
        bodyText: `Hello!\n\nThis is a verification test from the School of Science and Technology (SST) Personnel Action Request & HR Portal.\n\nYour Gmail dispatch connection is working properly!\n\nConfigured Sender: ${creds.senderEmail}\nSender Name: ${creds.senderName}\nDispatch Mode: ${creds.mode}\nTimestamp: ${new Date().toLocaleString()}\n\nAll subsequent account activation invitations, IT/TA notifications, and payout alerts will be dispatched automatically through this email.\n\nBest regards,\nSchool of Science and Technology\nHuman Capital Systems`,
        category: 'test'
      }, { ...creds, isEnabled: true });

      setTestResult({
        success: result.success,
        message: result.message
      });

      if (result.success) {
        onToast(`✅ Test email successfully sent to ${testRecipient}!`, 'success');
      } else {
        onToast(`⚠️ Test email failed: ${result.message}`, 'warning');
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Network error occurred while testing connection.'
      });
      onToast('Test email failed. Please verify credentials.', 'warning');
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = () => {
    if (!creds.senderEmail.trim() || !creds.senderEmail.includes('@')) {
      alert('Please enter a valid sender Gmail address.');
      return;
    }

    saveGmailCredentials(creds);
    if (onSaved) onSaved(creds);
    onToast(`🎉 Gmail configuration saved! Automated emails will dispatch from ${creds.senderEmail}.`, 'success');
    onClose();
  };

  const handleResetDefaults = () => {
    if (confirm('Reset Gmail configuration back to SST district defaults?')) {
      setCreds(DEFAULT_GMAIL_CREDENTIALS);
      saveGmailCredentials(DEFAULT_GMAIL_CREDENTIALS);
      setTestResult(null);
      onToast('Reset Gmail configuration to defaults.', 'info');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full flex flex-col overflow-hidden border border-slate-200 animate-scaleUp">
        
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-[#0f2352] to-[#1a3880] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3.5">
            <img src={SST_DEFAULT_LOGO} alt="SST Logo" className="h-12 w-auto object-contain bg-white/10 p-1 rounded-xl border border-white/20" />
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-black tracking-tight">Gmail & Google Workspace Dispatcher</h3>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center space-x-1 ${
                  isConfigured 
                    ? 'bg-emerald-400/20 text-emerald-300 border-emerald-400/30' 
                    : 'bg-amber-400/20 text-amber-300 border-amber-400/30'
                }`}>
                  <Sparkles className="w-3 h-3" />
                  <span>{isConfigured ? '🟢 Connected & Ready' : '🟡 Setup Required'}</span>
                </span>
              </div>
              <p className="text-xs text-blue-200 mt-0.5">
                Connect your district Gmail account so account activation invitations and notifications send directly from your email.
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

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 max-h-[70vh]">
          
          {/* Active Status & Enable Switch */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between flex-wrap gap-3">
            <div>
              <div className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                <Zap className="w-4 h-4 text-amber-500" />
                <span>Automated Email Dispatcher Status</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                When enabled, invitations and notifications will be sent automatically in the background using your credentials.
              </p>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={creds.isEnabled} 
                onChange={(e) => setCreds(prev => ({ ...prev, isEnabled: e.target.checked }))}
                className="sr-only peer" 
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              <span className="ml-2.5 text-xs font-bold text-slate-700">
                {creds.isEnabled ? 'Enabled' : 'Disabled'}
              </span>
            </label>
          </div>

          {/* Section 1: Sender Identity */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <div className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5 border-b border-slate-100 pb-2">
              <Globe className="w-3.5 h-3.5 text-blue-600" />
              <span>1. Official Sender Identity</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                  Gmail / Google Workspace Sender Address *
                </label>
                <input 
                  type="email"
                  value={creds.senderEmail}
                  onChange={(e) => setCreds(prev => ({ ...prev, senderEmail: e.target.value.trim().toLowerCase() }))}
                  placeholder="sstpar@ssttx.org"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0f2352]/20"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  All automated PAR and payout notification emails will dispatch from this SST PAR address.
                </span>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                  Sender Display Name *
                </label>
                <input 
                  type="text"
                  value={creds.senderName}
                  onChange={(e) => setCreds(prev => ({ ...prev, senderName: e.target.value }))}
                  placeholder="School of Science and Technology (SST PAR)"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0f2352]/20"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Appears in recipient inboxes as the sender header.
                </span>
              </div>
            </div>

            {/* CC District HR Audit Copy */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input 
                  type="checkbox"
                  checked={creds.ccHrCopy}
                  onChange={(e) => setCreds(prev => ({ ...prev, ccHrCopy: e.target.checked }))}
                  className="rounded text-[#0f2352] focus:ring-[#0f2352]/20"
                />
                <span className="text-xs text-slate-700 font-medium">
                  Automatically send a CC audit copy of all outgoing notifications to:
                </span>
              </label>
              <input 
                type="email"
                value={creds.hrEmail}
                onChange={(e) => setCreds(prev => ({ ...prev, hrEmail: e.target.value.trim().toLowerCase() }))}
                placeholder="sstpar@ssttx.org"
                className="w-48 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs text-slate-800"
              />
            </div>
          </div>

          {/* Section 2: Choose Gmail Dispatch Method */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <div className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5 border-b border-slate-100 pb-2">
              <Key className="w-3.5 h-3.5 text-blue-600" />
              <span>2. Gmail Dispatch Method & Credentials</span>
            </div>

            {/* Mode Selector Tabs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setCreds(prev => ({ ...prev, mode: 'google_script' }))}
                className={`p-3 rounded-xl border text-left transition-all ${
                  creds.mode === 'google_script'
                    ? 'border-blue-500 bg-blue-50/60 ring-2 ring-blue-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="text-xs font-bold text-[#0f2352] flex items-center justify-between">
                  <span>Google Apps Script</span>
                  <span className="text-[9px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-bold uppercase">Official</span>
                </div>
                <div className="text-[10px] text-slate-500 mt-1">
                  Sends directly from your Gmail inbox via a free Google Web App.
                </div>
              </button>

              <button
                type="button"
                onClick={() => setCreds(prev => ({ ...prev, mode: 'emailjs' }))}
                className={`p-3 rounded-xl border text-left transition-all ${
                  creds.mode === 'emailjs'
                    ? 'border-blue-500 bg-blue-50/60 ring-2 ring-blue-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="text-xs font-bold text-[#0f2352]">EmailJS (Gmail)</div>
                <div className="text-[10px] text-slate-500 mt-1">
                  Browser-direct OAuth connection to Gmail API.
                </div>
              </button>

              <button
                type="button"
                onClick={() => setCreds(prev => ({ ...prev, mode: 'smtp_relay' }))}
                className={`p-3 rounded-xl border text-left transition-all ${
                  creds.mode === 'smtp_relay'
                    ? 'border-blue-500 bg-blue-50/60 ring-2 ring-blue-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="text-xs font-bold text-[#0f2352]">SMTP Relay / Webhook</div>
                <div className="text-[10px] text-slate-500 mt-1">
                  Custom endpoint or SMTP proxy with App Password.
                </div>
              </button>
            </div>

            {/* Mode 1: Google Apps Script Web App Details */}
            {creds.mode === 'google_script' && (
              <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-200/80 space-y-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">
                    Google Apps Script Web App URL *
                  </label>
                  <input 
                    type="url"
                    value={creds.scriptUrl || ''}
                    onChange={(e) => setCreds(prev => ({ ...prev, scriptUrl: e.target.value.trim() }))}
                    placeholder="https://script.google.com/macros/s/.../exec"
                    className="w-full px-3 py-2 bg-white border border-blue-300 rounded-xl font-mono text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>

                <div className="p-3 bg-white rounded-xl border border-blue-200 text-xs space-y-2">
                  <div className="font-bold text-slate-800 flex items-center justify-between">
                    <span className="flex items-center space-x-1.5">
                      <Code className="w-3.5 h-3.5 text-blue-600" />
                      <span>Quick 2-Minute Google Setup:</span>
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyScriptCode}
                      className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-[10px] rounded-lg transition-colors flex items-center space-x-1 shadow-2xs"
                    >
                      {copiedCode ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedCode ? 'Copied Script!' : 'Copy Script Code'}</span>
                    </button>
                  </div>
                  <ol className="list-decimal pl-5 space-y-1 text-[11px] text-slate-600">
                    <li>Open <a href="https://script.google.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline font-semibold inline-flex items-center">script.google.com <ExternalLink className="w-2.5 h-2.5 ml-0.5 inline" /></a> signed in to your SST Gmail address.</li>
                    <li>Click <strong>New project</strong> and paste the copied script code into <code>Code.gs</code>.</li>
                    <li>Click <strong>Deploy &rarr; New deployment</strong>, choose <strong>Web app</strong>.</li>
                    <li>Set <em>Execute as:</em> <strong>Me ({creds.senderEmail})</strong>, and <em>Who has access:</em> <strong>Anyone</strong>.</li>
                    <li>Click <strong>Deploy</strong>, grant permissions, and paste the resulting Web App URL into the box above!</li>
                  </ol>
                </div>
              </div>
            )}

            {/* Mode 2: EmailJS Credentials */}
            {creds.mode === 'emailjs' && (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                      EmailJS Service ID *
                    </label>
                    <input 
                      type="text"
                      value={creds.emailJsServiceId || ''}
                      onChange={(e) => setCreds(prev => ({ ...prev, emailJsServiceId: e.target.value.trim() }))}
                      placeholder="service_gmail"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                      Template ID (Optional)
                    </label>
                    <input 
                      type="text"
                      value={creds.emailJsTemplateId || ''}
                      onChange={(e) => setCreds(prev => ({ ...prev, emailJsTemplateId: e.target.value.trim() }))}
                      placeholder="template_sst"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                      Public Key *
                    </label>
                    <input 
                      type="password"
                      value={creds.emailJsPublicKey || ''}
                      onChange={(e) => setCreds(prev => ({ ...prev, emailJsPublicKey: e.target.value.trim() }))}
                      placeholder="user_xxxx / public_key"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-mono text-xs"
                    />
                  </div>
                </div>
                <div className="text-[11px] text-slate-500">
                  Connect your Gmail account in your <a href="https://dashboard.emailjs.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline font-semibold">EmailJS Dashboard</a> under Email Services &rarr; Gmail.
                </div>
              </div>
            )}

            {/* Mode 3: SMTP Relay / Webhook Credentials */}
            {creds.mode === 'smtp_relay' && (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                      SMTP Relay Endpoint URL *
                    </label>
                    <input 
                      type="url"
                      value={creds.smtpEndpoint || ''}
                      onChange={(e) => setCreds(prev => ({ ...prev, smtpEndpoint: e.target.value.trim() }))}
                      placeholder="https://api.yourdomain.com/send-email"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                      App Password / Bearer Token
                    </label>
                    <input 
                      type="password"
                      value={creds.smtpToken || ''}
                      onChange={(e) => setCreds(prev => ({ ...prev, smtpToken: e.target.value.trim() }))}
                      placeholder="Gmail 16-digit App Password or Token"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-mono text-xs"
                    />
                  </div>
                </div>
                <div className="text-[11px] text-slate-500">
                  If using direct Gmail SMTP, generate a 16-character App Password at <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline font-semibold">Google Account Security &rarr; App Passwords</a>.
                </div>
              </div>
            )}
          </div>

          {/* Section 3: Live Connection & Delivery Tester */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
            <div className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>3. Live Connection & Delivery Tester</span>
            </div>
            <p className="text-[11px] text-slate-500">
              Send a real test notification to verify that emails are reaching the destination inbox from <strong>{creds.senderEmail}</strong>.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-2">
              <input 
                type="email"
                value={testRecipient}
                onChange={(e) => setTestRecipient(e.target.value)}
                placeholder="Enter recipient email address..."
                className="w-full sm:flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono"
              />
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTesting}
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-1.5 px-4 py-2 bg-[#0f2352] hover:bg-[#1a3880] disabled:bg-slate-400 text-white font-bold text-xs rounded-xl transition-all shadow-xs shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isTesting ? 'Sending Test...' : '🧪 Send Test Email via Gmail'}</span>
              </button>
            </div>

            {testResult && (
              <div className={`p-3 rounded-xl border text-xs flex items-center space-x-2 ${
                testResult.success 
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}>
                {testResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{testResult.message}</span>
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="p-5 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="inline-flex items-center space-x-1 text-xs font-bold text-slate-500 hover:text-slate-700 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to Defaults</span>
          </button>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSave}
              className="inline-flex items-center space-x-1.5 px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl shadow-md transition-all active:scale-95"
            >
              <Check className="w-4 h-4" />
              <span>Save & Activate Gmail</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
