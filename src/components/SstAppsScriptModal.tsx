import React, { useState } from 'react';
import { 
  X, 
  CheckCircle2, 
  AlertTriangle, 
  Copy, 
  Check, 
  ExternalLink, 
  Sparkles, 
  Code, 
  Zap,
  Globe,
  FileSpreadsheet,
  RefreshCw,
  Send,
  Database,
  History
} from 'lucide-react';
import { 
  AppsScriptConfig, 
  getStoredAppsScriptConfig, 
  saveAppsScriptConfig, 
  testAppsScriptConnection, 
  bulkSyncParsToSstGoogleSheet,
  FULL_APPS_SCRIPT_SOURCE 
} from '../utils/sstAppsScriptService';
import { PersonnelActionRequest } from '../types/par';

interface SstAppsScriptModalProps {
  isOpen: boolean;
  onClose: () => void;
  pars: PersonnelActionRequest[];
  onToast: (text: string, type?: 'success' | 'warning' | 'info') => void;
}

export const SstAppsScriptModal: React.FC<SstAppsScriptModalProps> = ({
  isOpen,
  onClose,
  pars,
  onToast
}) => {
  if (!isOpen) return null;

  const [config, setConfig] = useState<AppsScriptConfig>(() => getStoredAppsScriptConfig());
  const [activeTab, setActiveTab] = useState<'config' | 'code' | 'structure' | 'logs'>('config');
  const [copiedCode, setCopiedCode] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isBulkSyncing, setIsBulkSyncing] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; spreadsheetUrl?: string } | null>(null);

  const isConfigured = Boolean(config.scriptUrl && config.scriptUrl.startsWith('http'));

  const handleCopyScriptCode = () => {
    navigator.clipboard.writeText(FULL_APPS_SCRIPT_SOURCE);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 3000);
    onToast('Google Apps Script code copied to clipboard!', 'info');
  };

  const handleSaveConfig = () => {
    saveAppsScriptConfig(config);
    onToast('Google Apps Script & Sheets settings saved.', 'success');
  };

  const handleTestConnection = async () => {
    if (!config.scriptUrl.trim()) {
      alert('Please enter your Google Apps Script Web App URL first.');
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      const result = await testAppsScriptConnection(config.scriptUrl.trim());
      setTestResult({
        success: result.success,
        message: result.message,
        spreadsheetUrl: result.spreadsheetUrl
      });

      if (result.success) {
        if (result.spreadsheetUrl && !config.spreadsheetUrl) {
          const updated = { ...config, spreadsheetUrl: result.spreadsheetUrl };
          setConfig(updated);
          saveAppsScriptConfig(updated);
        }
        onToast('✅ Successfully verified SST Google Apps Script connection!', 'success');
      } else {
        onToast(`⚠️ Connection test failed: ${result.message}`, 'warning');
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Connection failed.'
      });
      onToast('Connection error. Verify Web App deployment access is set to Anyone.', 'warning');
    } finally {
      setIsTesting(false);
    }
  };

  const handleBulkSync = async () => {
    if (!config.scriptUrl.trim()) {
      alert('Please configure your Google Apps Script Web App URL first.');
      return;
    }

    setIsBulkSyncing(true);
    try {
      const result = await bulkSyncParsToSstGoogleSheet(pars);
      if (result.success) {
        onToast(`🎉 Successfully synchronized ${result.count} PAR records to Google Sheets!`, 'success');
        if (result.sheetUrl && !config.spreadsheetUrl) {
          const updated = { ...config, spreadsheetUrl: result.sheetUrl };
          setConfig(updated);
          saveAppsScriptConfig(updated);
        }
        // refresh config for updated log & timestamp
        setConfig(getStoredAppsScriptConfig());
      } else {
        onToast(`⚠️ Bulk sync issue: ${result.message}`, 'warning');
      }
    } catch (err: any) {
      onToast(`Bulk sync error: ${err.message}`, 'warning');
    } finally {
      setIsBulkSyncing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
        
        {/* Header Bar */}
        <div className="px-6 py-4 border-b border-slate-200 bg-[#0f2352] text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400 text-blue-950 flex items-center justify-center font-black shadow-md">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-black tracking-tight">SSTTX Google Apps Script & Sheets PAR Tracker</h3>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-400 text-blue-950">
                  Google Workspace
                </span>
              </div>
              <p className="text-xs text-blue-200 mt-0.5">
                Automated multi-tab spreadsheet tracking, audit logs, and Gmail dispatch for ssttx.org
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-blue-200 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Live Status Bar */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1.5">
              <span className={`w-2.5 h-2.5 rounded-full ${isConfigured ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              <span className="font-bold text-slate-800">
                {isConfigured ? 'Connected to Google Workspace' : 'Setup Required'}
              </span>
            </div>

            {config.lastSyncedAt && (
              <span className="text-slate-500 text-[11px] hidden sm:inline">
                Last Synced: <strong className="text-slate-700">{new Date(config.lastSyncedAt).toLocaleTimeString()}</strong>
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {config.spreadsheetUrl && (
              <a
                href={config.spreadsheetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-1 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold rounded-xl text-xs transition-colors shadow-2xs"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>Open SST Google Sheet</span>
                <ExternalLink className="w-3 h-3 ml-0.5" />
              </a>
            )}

            <button
              type="button"
              onClick={handleBulkSync}
              disabled={isBulkSyncing || !config.scriptUrl}
              className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-[#0f2352] hover:bg-[#1a3880] disabled:bg-slate-300 text-white font-bold rounded-xl text-xs shadow-xs transition-all active:scale-95"
              title="Push all active PAR records to Google Sheets"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isBulkSyncing ? 'animate-spin' : ''}`} />
              <span>{isBulkSyncing ? 'Syncing...' : `Sync All (${pars.length}) PARs Now`}</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 pt-3 bg-white border-b border-slate-200 flex space-x-4 text-xs font-bold">
          <button
            onClick={() => setActiveTab('config')}
            className={`pb-3 border-b-2 transition-colors flex items-center space-x-2 ${
              activeTab === 'config'
                ? 'border-[#0f2352] text-[#0f2352]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Zap className="w-4 h-4 text-amber-500" />
            <span>Connection & Tracking Settings</span>
          </button>

          <button
            onClick={() => setActiveTab('code')}
            className={`pb-3 border-b-2 transition-colors flex items-center space-x-2 ${
              activeTab === 'code'
                ? 'border-[#0f2352] text-[#0f2352]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Code className="w-4 h-4 text-blue-600" />
            <span>Google Apps Script Code (Code.gs)</span>
          </button>

          <button
            onClick={() => setActiveTab('structure')}
            className={`pb-3 border-b-2 transition-colors flex items-center space-x-2 ${
              activeTab === 'structure'
                ? 'border-[#0f2352] text-[#0f2352]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Database className="w-4 h-4 text-purple-600" />
            <span>Sheet Schema & Features</span>
          </button>

          <button
            onClick={() => setActiveTab('logs')}
            className={`pb-3 border-b-2 transition-colors flex items-center space-x-2 ${
              activeTab === 'logs'
                ? 'border-[#0f2352] text-[#0f2352]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <History className="w-4 h-4 text-slate-500" />
            <span>Sync Activity Log ({config.syncHistory?.length || 0})</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/60">
          
          {/* TAB 1: CONNECTION SETTINGS */}
          {activeTab === 'config' && (
            <div className="space-y-5">
              
              {/* Deployment URL Setup Card */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center space-x-2.5">
                    <Globe className="w-4 h-4 text-blue-600" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                      Google Apps Script Web App Deployment
                    </h4>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-500">
                    Host: Google Workspace (ssttx.org)
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Google Apps Script Web App URL <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                      value={config.scriptUrl}
                      onChange={(e) => setConfig({ ...config, scriptUrl: e.target.value })}
                      className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0f2352]/20 focus:border-[#0f2352] font-mono text-slate-800"
                    />
                    <button
                      type="button"
                      onClick={handleTestConnection}
                      disabled={isTesting || !config.scriptUrl}
                      className="px-4 py-2 bg-blue-50 hover:bg-blue-100 disabled:bg-slate-100 text-blue-900 font-bold text-xs rounded-xl border border-blue-200 transition-colors flex items-center space-x-1.5 shrink-0"
                    >
                      <Zap className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : 'text-blue-600'}`} />
                      <span>{isTesting ? 'Testing...' : 'Test Connection'}</span>
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Obtained after deploying the script as a Web App with access set to "Anyone".
                  </p>
                </div>

                {testResult && (
                  <div className={`p-3 rounded-xl border text-xs flex items-start space-x-2.5 ${
                    testResult.success 
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                      : 'bg-rose-50 border-rose-200 text-rose-800'
                  }`}>
                    {testResult.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <div className="font-bold">{testResult.message}</div>
                      {testResult.spreadsheetUrl && (
                        <div className="mt-1">
                          <a 
                            href={testResult.spreadsheetUrl} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="underline font-semibold"
                          >
                            Open Initialized Google Sheet &rarr;
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Google Spreadsheet URL (Optional Direct Shortcut)
                  </label>
                  <input
                    type="url"
                    placeholder="https://docs.google.com/spreadsheets/d/.../edit"
                    value={config.spreadsheetUrl}
                    onChange={(e) => setConfig({ ...config, spreadsheetUrl: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0f2352]/20 focus:border-[#0f2352] text-slate-800"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Allows administrators to open the live Google Sheet directly from the portal navigation bar.
                  </p>
                </div>
              </div>

              {/* District Email & Auto-Sync Card */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center space-x-2.5">
                    <Send className="w-4 h-4 text-purple-600" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                      District Automated Email & Auto-Sync Rules
                    </h4>
                  </div>
                  <span className="text-[11px] font-semibold text-purple-700">
                    SST Google Workspace Gmail
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Sender Email Address
                    </label>
                    <input
                      type="email"
                      value={config.senderEmail}
                      onChange={(e) => setConfig({ ...config, senderEmail: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
                    />
                    <p className="text-[11px] text-slate-500 mt-1">
                      Default: <code className="text-[#0f2352] font-semibold">sstpar@ssttx.org</code>
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      District Display Name
                    </label>
                    <input
                      type="text"
                      value={config.senderName}
                      onChange={(e) => setConfig({ ...config, senderName: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-slate-800">
                      Enable Real-Time Auto-Sync to Google Sheets
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Automatically push to Google Sheets whenever a request is submitted, signed, approved, or rejected.
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.autoSyncEnabled}
                      onChange={(e) => setConfig({ ...config, autoSyncEnabled: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0f2352]"></div>
                  </label>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={handleSaveConfig}
                  className="px-5 py-2.5 bg-[#0f2352] hover:bg-[#1a3880] text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-95"
                >
                  Save Configuration
                </button>

                <div className="text-xs text-slate-500">
                  Ready to deploy? View the <strong className="text-slate-800 cursor-pointer underline" onClick={() => setActiveTab('code')}>Apps Script Code</strong> tab.
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: GOOGLE APPS SCRIPT CODE */}
          {activeTab === 'code' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-blue-50/70 p-4 rounded-2xl border border-blue-200">
                <div className="flex items-center space-x-3">
                  <Code className="w-5 h-5 text-blue-700 shrink-0" />
                  <div>
                    <div className="text-xs font-bold text-blue-950">
                      Official SSTTX Google Apps Script Code (Code.gs)
                    </div>
                    <div className="text-[11px] text-blue-800">
                      Copy and paste this into Google Apps Script connected to your SST Google Sheet.
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCopyScriptCode}
                  className="px-4 py-2 bg-[#0f2352] hover:bg-[#1a3880] text-white font-bold text-xs rounded-xl shadow-xs flex items-center space-x-1.5 shrink-0 transition-colors"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode ? 'Copied to Clipboard!' : 'Copy Entire Apps Script'}</span>
                </button>
              </div>

              {/* Step by Step Visual Guide */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                  <div className="w-6 h-6 rounded-lg bg-blue-100 text-blue-900 font-black flex items-center justify-center text-xs">1</div>
                  <div className="font-bold text-slate-800">Create Sheet</div>
                  <div className="text-[11px] text-slate-500">Open Google Sheets, create a new blank spreadsheet.</div>
                </div>

                <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                  <div className="w-6 h-6 rounded-lg bg-blue-100 text-blue-900 font-black flex items-center justify-center text-xs">2</div>
                  <div className="font-bold text-slate-800">Open Apps Script</div>
                  <div className="text-[11px] text-slate-500">Click <strong>Extensions &gt; Apps Script</strong> in Google Sheets.</div>
                </div>

                <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                  <div className="w-6 h-6 rounded-lg bg-blue-100 text-blue-900 font-black flex items-center justify-center text-xs">3</div>
                  <div className="font-bold text-slate-800">Paste & Deploy</div>
                  <div className="text-[11px] text-slate-500">Paste this script in <code>Code.gs</code>. Click <strong>Deploy &gt; New deployment &gt; Web app</strong>.</div>
                </div>

                <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                  <div className="w-6 h-6 rounded-lg bg-blue-100 text-blue-900 font-black flex items-center justify-center text-xs">4</div>
                  <div className="font-bold text-slate-800">Set Access: Anyone</div>
                  <div className="text-[11px] text-slate-500">Execute as <strong>Me</strong> and Access: <strong>Anyone</strong>. Copy Web App URL into the portal!</div>
                </div>
              </div>

              {/* Code Snippet Display */}
              <div className="relative rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-inner">
                <div className="px-4 py-2 bg-slate-950/80 border-b border-slate-800 text-[11px] font-mono text-slate-400 flex items-center justify-between">
                  <span>Code.gs — Google Apps Script for ssttx.org</span>
                  <button
                    onClick={handleCopyScriptCode}
                    className="text-amber-400 hover:text-amber-300 font-sans font-bold text-[11px] flex items-center space-x-1"
                  >
                    <Copy className="w-3 h-3" />
                    <span>Copy</span>
                  </button>
                </div>
                <pre className="p-4 text-[11px] font-mono text-emerald-300 overflow-x-auto max-h-[360px] leading-relaxed">
                  {FULL_APPS_SCRIPT_SOURCE}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 3: SHEET SCHEMA & STRUCTURE */}
          {activeTab === 'structure' && (
            <div className="space-y-4">
              <div className="p-4 bg-purple-50 rounded-2xl border border-purple-200 text-xs text-purple-950">
                <div className="font-bold mb-1 flex items-center space-x-2">
                  <Database className="w-4 h-4 text-purple-700" />
                  <span>SST District Multi-Tab Google Sheet Architecture</span>
                </div>
                <p className="text-[11px] text-purple-800">
                  When deployed, this Google Apps Script automatically generates, styles, and maintains 4 dedicated tabs in your Google Sheet with official SST Navy branding, frozen headers, and Texas charter compliance tracking.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Tab 1 */}
                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-blue-950 flex items-center space-x-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#0f2352]" />
                      <span>Tab 1: PAR_Master_Tracker</span>
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-900">
                      24 Columns
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    Live tracking of every request: Tracking #, Employee, Campus, Title, Action Type, Effective Date, Current Status, Approvers for Steps 1-5, Salaries, Payout totals, and direct portal link.
                  </p>
                </div>

                {/* Tab 2 */}
                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-blue-950 flex items-center space-x-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-700" />
                      <span>Tab 2: Audit_Trail</span>
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                      10 Columns
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    Immutable legal audit log: Timestamp, Event Action, Actor Name, Role, Stage Transitions, Signer UETA ID, IP Address, and compliance comments.
                  </p>
                </div>

                {/* Tab 3 */}
                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-emerald-950 flex items-center space-x-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                      <span>Tab 3: Payout_Authorizations</span>
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-900">
                      13 Columns
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    Separation payouts & wage deductions: Daily rate calculations, compensated days, gross payout, unearned PTO deductions, net wage, CPO approval, and ADP entry status.
                  </p>
                </div>

                {/* Tab 4 */}
                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-purple-950 flex items-center space-x-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-purple-600" />
                      <span>Tab 4: Email_Dispatches</span>
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-900">
                      8 Columns
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    Comprehensive log of all Gmail notifications sent to principals, executive directors, HR, benefits, payroll, IT, and talent acquisition.
                  </p>
                </div>

              </div>

              {/* In-Sheet Menu Preview */}
              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-xs">
                <div className="font-bold text-amber-950 mb-1 flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span>Custom Google Sheets Menu: "🏛️ SST HR Hub"</span>
                </div>
                <p className="text-[11px] text-amber-900 leading-relaxed">
                  Inside Google Sheets, an official <strong>"🏛️ SST HR Hub"</strong> menu will appear at the top allowing district HR staff to refresh table formatting, trigger automated reminder emails to pending approvers, or generate Texas Education Agency (TEA/PEIMS) summary snapshots with a single click.
                </p>
              </div>
            </div>
          )}

          {/* TAB 4: SYNC LOGS */}
          {activeTab === 'logs' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 text-xs">
                <div className="font-bold text-slate-800">
                  Recent Synchronization Events ({config.syncHistory?.length || 0})
                </div>
                {config.syncHistory?.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      const updated = { ...config, syncHistory: [] };
                      setConfig(updated);
                      saveAppsScriptConfig(updated);
                      onToast('Sync log cleared.', 'info');
                    }}
                    className="text-[11px] text-slate-500 hover:text-slate-800 font-semibold"
                  >
                    Clear History
                  </button>
                )}
              </div>

              {(!config.syncHistory || config.syncHistory.length === 0) ? (
                <div className="p-8 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200">
                  No synchronization events recorded yet. Click "Test Connection" or "Sync All PARs Now" to generate activity.
                </div>
              ) : (
                <div className="space-y-2">
                  {config.syncHistory.map((log) => (
                    <div
                      key={log.id}
                      className={`p-3 rounded-xl border text-xs flex items-start justify-between gap-3 ${
                        log.status === 'success' 
                          ? 'bg-white border-slate-200' 
                          : 'bg-rose-50 border-rose-200'
                      }`}
                    >
                      <div className="flex items-start space-x-2.5">
                        {log.status === 'success' ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        )}
                        <div>
                          <div className="font-bold text-slate-900 flex items-center space-x-2">
                            <span>{log.action.replace('_', ' ').toUpperCase()}</span>
                            <span className="text-[10px] text-slate-500 font-mono font-normal">
                              ({log.target})
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-600 mt-0.5">{log.message}</div>
                        </div>
                      </div>

                      <div className="text-[10px] text-slate-400 font-mono shrink-0">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
