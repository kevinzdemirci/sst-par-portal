import React, { useState, useRef, useEffect } from 'react';
import { UserPersona, PersonnelActionRequest } from '../types/par';
import { USER_PERSONAS } from '../data/mockData';
import { SST_DEFAULT_LOGO, getNormalizedLogoUrl } from '../data/sstLogo';
import { canPersonaActOnPar, canPersonaCreatePar, isSuperAdmin } from '../utils/formatters';
import { Plus, Users, LogOut, ShieldAlert, Sliders, UserCheck, Mail, Lock, FileSpreadsheet, ChevronDown, Settings, GitBranch, DollarSign, Calendar } from 'lucide-react';
import { ApproverRoleConfig } from '../types/par';
import { getStoredGmailCredentials } from '../utils/gmailService';
import { getStoredAppsScriptConfig } from '../utils/sstAppsScriptService';

interface NavbarProps {
  currentPersona: UserPersona;
  availablePersonas?: UserPersona[];
  onSelectPersona: (persona: UserPersona) => void;
  onOpenNewParModal: () => void;
  onOpenWorkflowModal?: () => void;
  onOpenAdminModal?: () => void;
  onOpenAccountModal?: (role?: ApproverRoleConfig) => void;
  onOpenRoleManagerModal?: () => void;
  onOpenPayoutModal?: () => void;
  pendingPayoutsCount?: number;
  pars: PersonnelActionRequest[];
  filterActionQueue: boolean;
  onToggleActionQueue: () => void;
  districtLogo?: string;
  districtName?: string;
  activeHubTab?: 'pars' | 'payouts' | 'directory' | 'workflow';
  onSelectHubTab?: (tab: 'pars' | 'payouts' | 'directory' | 'workflow') => void;
  onOpenGmailSettings?: () => void;
  onOpenAuthModal?: () => void;
  onOpenAppsScriptModal?: () => void;
  onOpenPayScheduleModal?: () => void;
  onOpenAdpStaffModal?: () => void;
  /** False for signed-in staff who are not admins: they cannot switch personas. */
  canSwitchPersona?: boolean;
  signedInEmail?: string;
  onSignOut?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentPersona,
  availablePersonas = USER_PERSONAS,
  onSelectPersona,
  onOpenNewParModal,
  onOpenWorkflowModal,
  onOpenAdminModal,
  onOpenAccountModal,
  onOpenRoleManagerModal,
  onOpenPayoutModal,
  pendingPayoutsCount = 0,
  pars,
  filterActionQueue,
  onToggleActionQueue,
  districtLogo,
  districtName,
  activeHubTab = 'pars',
  onSelectHubTab,
  onOpenGmailSettings,
  onOpenAuthModal,
  onOpenAppsScriptModal,
  onOpenPayScheduleModal,
  onOpenAdpStaffModal,
  canSwitchPersona = true,
  signedInEmail,
  onSignOut
}) => {
  const pendingForPersona = pars.filter(p => canPersonaActOnPar(currentPersona, p)).length;
  const isAdmin = isSuperAdmin(currentPersona);
  const canCreatePar = canPersonaCreatePar(currentPersona);
  const gmailCreds = getStoredGmailCredentials();
  const appsScriptConfig = getStoredAppsScriptConfig();

  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const toolsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (toolsRef.current && !toolsRef.current.contains(event.target as Node)) {
        setIsToolsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between min-h-[84px] py-1.5">
          
          {/* SST Brand Logo */}
          <div className="flex items-center">
            <div 
              className="flex items-center py-1 cursor-pointer"
              onClick={() => onSelectHubTab && onSelectHubTab('pars')}
              title="School of Science and Technology — Home"
            >
              <img 
                src={getNormalizedLogoUrl(districtLogo)} 
                alt={districtName || 'School of Science and Technology'} 
                className="h-16 sm:h-[72px] w-auto max-w-[280px] object-contain rounded transition-transform hover:scale-105"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = SST_DEFAULT_LOGO;
                }}
              />
            </div>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            
            {/* Authenticated Staff Persona Badge & Switch Account */}
            <div className="relative flex items-center bg-slate-100/90 rounded-2xl p-1.5 border border-slate-200 shadow-2xs">
              <div 
                className={`flex items-center px-2 py-1 space-x-2.5 ${canSwitchPersona ? 'cursor-pointer' : ''}`}
                onClick={canSwitchPersona ? onOpenAuthModal : undefined}
                title={signedInEmail ? `Signed in as ${signedInEmail}` : 'Click to Switch Staff Account or Authenticate'}
              >
                <img 
                  src={currentPersona.avatar} 
                  alt={currentPersona.name} 
                  className="w-8 h-8 rounded-full object-cover border-2 border-white shadow-2xs"
                />
                <div className="text-left text-xs hidden md:block">
                  <div className="font-bold text-slate-900 leading-tight flex items-center space-x-1">
                    <span>{currentPersona.name}</span>
                    {isAdmin && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-400 text-blue-950 font-black">
                        Admin
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium">{currentPersona.role}</div>
                </div>
              </div>

              {canSwitchPersona && onOpenAuthModal && (
                <button
                  type="button"
                  onClick={onOpenAuthModal}
                  className="ml-1 p-1.5 text-slate-400 hover:text-slate-800 hover:bg-white rounded-xl transition-colors"
                  title="Switch Staff Account / Enter PIN"
                >
                  <Lock className="w-3.5 h-3.5 text-slate-600" />
                </button>
              )}

              {canSwitchPersona && (
              <select
                value={currentPersona.id}
                onChange={(e) => {
                  if (e.target.value === '__NEW_ACCOUNT__') {
                    if (onOpenAccountModal) onOpenAccountModal();
                  } else if (e.target.value === '__MY_ESIGN__') {
                    // Non-CPO self-onboarding: opens their own profile
                    const matchedAppr = currentPersona ? {
                      id: currentPersona.id,
                      name: currentPersona.name,
                      title: currentPersona.role,
                      roleKey: 'custom',
                      email: currentPersona.email,
                      department: currentPersona.department,
                      campus: currentPersona.campus,
                      region: currentPersona.region || 'All SST Campuses',
                      avatar: currentPersona.avatar,
                      signerId: currentPersona.signerId,
                      ipAddress: currentPersona.ipAddress,
                      isAccountActivated: currentPersona.isAccountActivated,
                      signingPin: currentPersona.signingPin,
                      signatureImage: currentPersona.signatureImage,
                      canReviewStages: currentPersona.canReviewStages
                    } : undefined;
                    if (onOpenAccountModal) onOpenAccountModal(matchedAppr as any);
                  } else if (e.target.value === '__MANAGE_ROLES__' || e.target.value === '__VIEW_DIRECTORY__') {
                    if (onSelectHubTab) {
                      onSelectHubTab('directory');
                    } else if (onOpenRoleManagerModal) {
                      onOpenRoleManagerModal();
                    }
                  } else if (e.target.value === '__GMAIL_SETTINGS__') {
                    if (onOpenGmailSettings) onOpenGmailSettings();
                  } else if (e.target.value === '__APPS_SCRIPT__') {
                    if (onOpenAppsScriptModal) onOpenAppsScriptModal();
                  } else {
                    const found = availablePersonas.find(p => p.id === e.target.value);
                    if (found) onSelectPersona(found);
                  }
                }}
                className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                title="Switch Viewing Persona"
              >
                <optgroup label="SST Workflow Approvers (Signatures Required)">
                  {availablePersonas.filter(p => !p.isNotificationOnly).map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} — {p.role} ({p.department})
                    </option>
                  ))}
                </optgroup>
                {availablePersonas.some(p => p.isNotificationOnly) && (
                  <optgroup label="📢 Department Notifications (No Action Required)">
                    {availablePersonas.filter(p => p.isNotificationOnly).map(p => (
                      <option key={p.id} value={p.id}>
                        📢 {p.name} — {p.role} ({p.department})
                      </option>
                    ))}
                  </optgroup>
                )}
                <optgroup label={isAdmin ? "District Administration Controls" : "My Account"}>
                  {isAdmin ? (
                    <>
                      <option value="__APPS_SCRIPT__">📊 SSTTX Google Sheets Tracker & Apps Script...</option>
                      <option value="__NEW_ACCOUNT__">+ Add Approver Role / Create Account...</option>
                      <option value="__MANAGE_ROLES__">⚙️ Manage & Remove Roles...</option>
                      <option value="__GMAIL_SETTINGS__">📧 Gmail Dispatcher Setup...</option>
                    </>
                  ) : (
                    <option value="__MY_ESIGN__">✍️ Configure My E-Sign Profile...</option>
                  )}
                </optgroup>
              </select>
              )}

              {canSwitchPersona && (
                <span className="text-xs font-semibold text-[#0f2352] bg-white shadow-2xs border border-slate-200 px-2.5 py-1 rounded-xl pointer-events-none hidden lg:inline-flex items-center space-x-1">
                  <Users className="w-3.5 h-3.5 mr-1 text-[#b91c1c]" />
                  <span>Simulate Role</span>
                </span>
              )}
            </div>

            {onSignOut && (
              <button
                type="button"
                onClick={onSignOut}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                title={signedInEmail ? `Sign out ${signedInEmail}` : 'Sign out'}
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Sign out</span>
              </button>
            )}

            {/* SSTTX Google Apps Script & Sheets Tracker Button (Super Admin only) */}
            {isAdmin && onOpenAppsScriptModal && (
              <button
                type="button"
                onClick={onOpenAppsScriptModal}
                className={`inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all shadow-2xs border ${
                  appsScriptConfig.scriptUrl
                    ? 'bg-emerald-50 hover:bg-emerald-100 border-emerald-300 text-emerald-950'
                    : 'bg-amber-50 hover:bg-amber-100 border-amber-300 text-amber-950'
                }`}
                title={`SSTTX Google Apps Script & Sheets PAR Tracker (${appsScriptConfig.scriptUrl ? 'Connected' : 'Setup Required'})`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
                <span className="hidden xl:inline">SSTTX Sheets</span>
                <span className={`w-2 h-2 rounded-full ${appsScriptConfig.scriptUrl ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              </button>
            )}

            {/* My Action Queue Button */}
            <button
              onClick={onToggleActionQueue}
              className={`relative inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                filterActionQueue 
                  ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20' 
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
              title="Filter requests requiring your department's approval"
            >
              <ShieldAlert className={`w-4 h-4 ${filterActionQueue ? 'text-white' : 'text-amber-500'}`} />
              <span className="hidden sm:inline">My Approvals</span>
              {pendingForPersona > 0 && (
                <span className={`px-1.5 py-0.5 rounded-full text-[11px] font-black ${
                  filterActionQueue ? 'bg-white text-amber-600' : 'bg-amber-100 text-amber-800'
                }`}>
                  {pendingForPersona}
                </span>
              )}
            </button>

            {/* District Tools & Administration Dropdown (Super Admin only) */}
            {isAdmin && (
            <div className="relative" ref={toolsRef}>
              <button
                type="button"
                onClick={() => setIsToolsOpen(!isToolsOpen)}
                className={`inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all border shadow-2xs ${
                  isToolsOpen 
                    ? 'bg-[#0f2352] text-white border-[#0f2352]' 
                    : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
                }`}
                title="District Tools & HR Administration"
              >
                <Settings className={`w-3.5 h-3.5 ${isToolsOpen ? 'text-white' : 'text-slate-600'}`} />
                <span className="hidden md:inline">District Tools</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${isToolsOpen ? 'rotate-180 text-white' : 'text-slate-500'}`} />
              </button>

              {isToolsOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 text-xs">
                  <div className="px-3 py-1.5 border-b border-slate-100 text-[11px] font-black text-slate-400 uppercase tracking-wider">
                    District HR Administration
                  </div>

                  {/* Workflow Admin (CPO Only) */}
                  {isAdmin && onOpenAdminModal && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsToolsOpen(false);
                        onOpenAdminModal();
                      }}
                      className="w-full text-left px-3 py-2 flex items-center space-x-2.5 hover:bg-slate-50 text-slate-800 transition-colors"
                    >
                      <Sliders className="w-4 h-4 text-[#b91c1c] shrink-0" />
                      <div>
                        <div className="font-bold flex items-center space-x-1">
                          <span>Workflow & Approver Setup</span>
                          <span className="text-[9px] px-1 py-0.2 bg-amber-100 text-blue-950 font-black rounded">CPO</span>
                        </div>
                        <div className="text-[10px] text-slate-500">Configure routing stages & approvers</div>
                      </div>
                    </button>
                  )}

                  {/* Manage Approver Directory */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsToolsOpen(false);
                      if (onSelectHubTab) {
                        onSelectHubTab('directory');
                      } else if (onOpenRoleManagerModal) {
                        onOpenRoleManagerModal();
                      }
                    }}
                    className={`w-full text-left px-3 py-2 flex items-center space-x-2.5 hover:bg-slate-50 transition-colors ${activeHubTab === 'directory' ? 'bg-slate-100 font-bold' : 'text-slate-800'}`}
                  >
                    <Users className="w-4 h-4 text-blue-600 shrink-0" />
                    <div>
                      <div className="font-bold">Approvers Directory</div>
                      <div className="text-[10px] text-slate-500">View & search district signatories</div>
                    </div>
                  </button>

                  {/* Payouts & Stipends Shortcut */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsToolsOpen(false);
                      if (onSelectHubTab) {
                        onSelectHubTab('payouts');
                      } else if (onOpenPayoutModal) {
                        onOpenPayoutModal();
                      }
                    }}
                    className={`w-full text-left px-3 py-2 flex items-center space-x-2.5 hover:bg-slate-50 transition-colors ${activeHubTab === 'payouts' ? 'bg-slate-100 font-bold' : 'text-slate-800'}`}
                  >
                    <DollarSign className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div className="flex-1">
                      <div className="font-bold flex items-center justify-between">
                        <span>Payouts & Stipends</span>
                        {pendingPayoutsCount > 0 && (
                          <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-rose-500 text-white">
                            {pendingPayoutsCount}
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-500">Staff stipends and deductions ledger</div>
                    </div>
                  </button>

                  {/* SST 2026-2027 Payroll Schedule */}
                  {onOpenPayScheduleModal && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsToolsOpen(false);
                        onOpenPayScheduleModal();
                      }}
                      className="w-full text-left px-3 py-2 flex items-center space-x-2.5 hover:bg-slate-50 transition-colors text-slate-800"
                    >
                      <Calendar className="w-4 h-4 text-amber-600 shrink-0" />
                      <div className="flex-1">
                        <div className="font-bold flex items-center justify-between">
                          <span>2026–27 Payroll Schedule</span>
                          <span className="text-[9px] px-1 py-0.2 bg-amber-100 text-amber-950 font-black rounded">
                            24 Cycles
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500">Official cut-offs & pay dates</div>
                      </div>
                    </button>
                  )}

                  {/* ADP Workforce Now Staff List & Termination Alignment */}
                  {onOpenAdpStaffModal && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsToolsOpen(false);
                        onOpenAdpStaffModal();
                      }}
                      className="w-full text-left px-3 py-2 flex items-center space-x-2.5 hover:bg-slate-50 transition-colors text-slate-800"
                    >
                      <Users className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div className="flex-1">
                        <div className="font-bold flex items-center justify-between">
                          <span>ADP Staff & Terminations</span>
                          <span className="text-[9px] px-1 py-0.2 bg-emerald-100 text-emerald-950 font-black rounded">
                            ADP Sync
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500">Roster & termination alignment</div>
                      </div>
                    </button>
                  )}

                  {/* Routing Architecture Map */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsToolsOpen(false);
                      if (onSelectHubTab) {
                        onSelectHubTab('workflow');
                      } else if (onOpenWorkflowModal) {
                        onOpenWorkflowModal();
                      }
                    }}
                    className={`w-full text-left px-3 py-2 flex items-center space-x-2.5 hover:bg-slate-50 transition-colors ${activeHubTab === 'workflow' ? 'bg-slate-100 font-bold' : 'text-slate-800'}`}
                  >
                    <GitBranch className="w-4 h-4 text-purple-600 shrink-0" />
                    <div>
                      <div className="font-bold">SST Routing Map</div>
                      <div className="text-[10px] text-slate-500">Visual approval architecture</div>
                    </div>
                  </button>

                  {/* E-Sign & PIN Profile */}
                  {onOpenAccountModal && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsToolsOpen(false);
                        if (isAdmin) {
                          onOpenAccountModal();
                        } else {
                          const matchedAppr = currentPersona ? {
                            id: currentPersona.id,
                            name: currentPersona.name,
                            title: currentPersona.role,
                            roleKey: 'custom',
                            email: currentPersona.email,
                            department: currentPersona.department,
                            campus: currentPersona.campus,
                            region: currentPersona.region || 'All SST Campuses',
                            avatar: currentPersona.avatar,
                            signerId: currentPersona.signerId,
                            ipAddress: currentPersona.ipAddress,
                            isAccountActivated: currentPersona.isAccountActivated,
                            signingPin: currentPersona.signingPin,
                            signatureImage: currentPersona.signatureImage,
                            canReviewStages: currentPersona.canReviewStages
                          } : undefined;
                          onOpenAccountModal(matchedAppr as any);
                        }
                      }}
                      className="w-full text-left px-3 py-2 flex items-center space-x-2.5 hover:bg-slate-50 text-slate-800 transition-colors"
                    >
                      <UserCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div>
                        <div className="font-bold">{isAdmin ? 'Activate Staff Roles' : 'My E-Sign & PIN Profile'}</div>
                        <div className="text-[10px] text-slate-500">{isAdmin ? 'Add or invite approver accounts' : 'Set your digital signature and signing PIN'}</div>
                      </div>
                    </button>
                  )}

                  {/* Gmail Dispatcher Setup */}
                  {onOpenGmailSettings && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsToolsOpen(false);
                        onOpenGmailSettings();
                      }}
                      className="w-full text-left px-3 py-2 flex items-center space-x-2.5 hover:bg-slate-50 text-slate-800 transition-colors"
                    >
                      <Mail className="w-4 h-4 text-red-600 shrink-0" />
                      <div className="flex-1">
                        <div className="font-bold flex items-center justify-between">
                          <span>SST Gmail Dispatcher</span>
                          <span className={`w-2 h-2 rounded-full ${gmailCreds.isEnabled ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                        </div>
                        <div className="text-[10px] text-slate-500">{gmailCreds.isEnabled ? `Active (${gmailCreds.senderEmail})` : 'Configure district email relay'}</div>
                      </div>
                    </button>
                  )}

                  {/* Google Apps Script & Sheets Modal */}
                  {onOpenAppsScriptModal && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsToolsOpen(false);
                        onOpenAppsScriptModal();
                      }}
                      className="w-full text-left px-3 py-2 flex items-center space-x-2.5 hover:bg-slate-50 text-slate-800 transition-colors"
                    >
                      <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div className="flex-1">
                        <div className="font-bold flex items-center justify-between">
                          <span>Google Sheets Sync</span>
                          <span className={`w-2 h-2 rounded-full ${appsScriptConfig.scriptUrl ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                        </div>
                        <div className="text-[10px] text-slate-500">Live tracker & webhook connection</div>
                      </div>
                    </button>
                  )}

                </div>
              )}
            </div>
            )}

            {/* Primary Action: New PAR Button — ONLY FOR APPROVED INITIATORS */}
            {canCreatePar && (
              <button
                onClick={onOpenNewParModal}
                className="inline-flex items-center space-x-1.5 px-4 py-2.5 bg-[#0f2352] hover:bg-[#1a3880] text-white text-xs font-bold rounded-xl shadow-md shadow-[#0f2352]/20 transition-all active:scale-95 cursor-pointer"
                title="Initiate a new Personnel Action Request (PAR)"
              >
                <Plus className="w-4 h-4" />
                <span>Create New PAR</span>
              </button>
            )}

          </div>
        </div>
      </div>
    </header>
  );
};
