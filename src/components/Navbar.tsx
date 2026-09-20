import React from 'react';
import { UserPersona, PersonnelActionRequest } from '../types/par';
import { USER_PERSONAS } from '../data/mockData';
import { SST_DEFAULT_LOGO, getNormalizedLogoUrl } from '../data/sstLogo';
import { canPersonaActOnPar, isChiefPeopleOfficer, isRegionalHrCoordinator, isPayrollCoordinator } from '../utils/formatters';
import { Plus, Users, GitBranch, RefreshCw, ShieldAlert, Sliders, UserCheck, Trash2, DollarSign } from 'lucide-react';
import { ApproverRoleConfig } from '../types/par';

interface NavbarProps {
  currentPersona: UserPersona;
  availablePersonas?: UserPersona[];
  onSelectPersona: (persona: UserPersona) => void;
  onOpenNewParModal: () => void;
  onOpenWorkflowModal: () => void;
  onOpenAdminModal?: () => void;
  onOpenAccountModal?: (role?: ApproverRoleConfig) => void;
  onOpenRoleManagerModal?: () => void;
  onOpenPayoutModal?: () => void;
  pendingPayoutsCount?: number;
  onResetData: () => void;
  pars: PersonnelActionRequest[];
  filterActionQueue: boolean;
  onToggleActionQueue: () => void;
  districtLogo?: string;
  districtName?: string;
  activeHubTab?: 'pars' | 'payouts' | 'directory' | 'workflow';
  onSelectHubTab?: (tab: 'pars' | 'payouts' | 'directory' | 'workflow') => void;
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
  onResetData,
  pars,
  filterActionQueue,
  onToggleActionQueue,
  districtLogo,
  districtName,
  activeHubTab = 'pars',
  onSelectHubTab
}) => {
  const pendingForPersona = pars.filter(p => canPersonaActOnPar(currentPersona, p)).length;
  const isCpo = isChiefPeopleOfficer(currentPersona);
  const isHr = isRegionalHrCoordinator(currentPersona);
  const isPayroll = isPayrollCoordinator(currentPersona);

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between min-h-[84px] py-1.5">
          
          {/* Logo & School of Science and Technology Branding */}
          <div className="flex items-center space-x-3.5">
            <div 
              className="flex items-center py-1 cursor-pointer"
              onClick={() => onSelectHubTab && onSelectHubTab('pars')}
              title="SST Hub Home — Return to Personnel Action Requests"
            >
              <img 
                src={getNormalizedLogoUrl(districtLogo)} 
                alt={districtName || 'School of Science and Technology'} 
                className="h-14 sm:h-[68px] w-auto object-contain rounded drop-shadow-xs transition-transform hover:scale-105"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = SST_DEFAULT_LOGO;
                }}
              />
            </div>
            <div 
              className="border-l border-slate-200 pl-3.5 hidden sm:block cursor-pointer"
              onClick={() => onSelectHubTab && onSelectHubTab('pars')}
              title="SST Hub Home — Return to Personnel Action Requests"
            >
              <div className="flex items-center space-x-2">
                <span className="text-base font-black tracking-tight text-[#0f2352]">
                  People Operations & HR Hub
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-red-100 text-red-800 border border-red-200">
                  SST Official
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                {districtName || 'School of Science and Technology'} • Multi-Department Personnel & Payroll Hub
              </p>
            </div>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            
            {/* Persona Switcher Dropdown */}
            <div className="relative flex items-center bg-slate-100/90 rounded-2xl p-1.5 border border-slate-200 shadow-2xs">
              <div className="flex items-center px-2 py-1 space-x-2.5">
                <img 
                  src={currentPersona.avatar} 
                  alt={currentPersona.name} 
                  className="w-8 h-8 rounded-full object-cover border-2 border-white shadow-2xs"
                />
                <div className="text-left text-xs hidden md:block">
                  <div className="font-bold text-slate-900 leading-tight">{currentPersona.name}</div>
                  <div className="text-[11px] text-slate-500 font-medium">{currentPersona.role}</div>
                </div>
              </div>

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
                <optgroup label={isCpo ? "District Administration Controls" : "My Account & Directory"}>
                  {isCpo ? (
                    <>
                      <option value="__NEW_ACCOUNT__">+ Add Approver Role / Create Account...</option>
                      <option value="__MANAGE_ROLES__">⚙️ Manage & Remove Roles...</option>
                    </>
                  ) : (
                    <>
                      <option value="__MY_ESIGN__">✍️ Configure My E-Sign Profile...</option>
                      <option value="__VIEW_DIRECTORY__">👥 View Approvers Directory...</option>
                    </>
                  )}
                </optgroup>
              </select>

              <span className="text-xs font-semibold text-[#0f2352] bg-white shadow-2xs border border-slate-200 px-2.5 py-1 rounded-xl pointer-events-none hidden lg:inline-flex items-center space-x-1">
                <Users className="w-3.5 h-3.5 mr-1 text-[#b91c1c]" />
                <span>Simulate Role</span>
              </span>
            </div>

            {/* Manage Roles (CPO Only) or View Directory (All Roles) */}
            {(onSelectHubTab || onOpenRoleManagerModal) && (
              <button
                type="button"
                onClick={() => {
                  if (onSelectHubTab) {
                    onSelectHubTab('directory');
                  } else if (onOpenRoleManagerModal) {
                    onOpenRoleManagerModal();
                  }
                }}
                className={`inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-colors shadow-2xs border ${
                  activeHubTab === 'directory'
                    ? 'bg-[#0f2352] text-white border-[#0f2352] shadow-xs'
                    : isCpo 
                      ? 'bg-rose-50 hover:bg-rose-100 border-rose-200 text-rose-800' 
                      : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
                }`}
                title={isCpo ? "Manage, add, and remove roles from the SST directory (CPO Admin)" : "View SST Approver Directory"}
              >
                {isCpo ? (
                  <Trash2 className={`w-3.5 h-3.5 ${activeHubTab === 'directory' ? 'text-white' : 'text-rose-600'}`} />
                ) : (
                  <Users className={`w-3.5 h-3.5 ${activeHubTab === 'directory' ? 'text-white' : 'text-slate-600'}`} />
                )}
                <span className="hidden sm:inline">{isCpo ? 'Manage Roles' : 'Directory'}</span>
              </button>
            )}

            {/* Activate Role (CPO) or Configure My E-Sign (Other Personas) */}
            {onOpenAccountModal && (
              <button
                onClick={() => {
                  if (isCpo) {
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
                className={`inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-colors shadow-2xs border ${
                  isCpo
                    ? 'bg-emerald-50 hover:bg-emerald-100 border-emerald-300 text-emerald-900'
                    : 'bg-blue-50 hover:bg-blue-100 border-blue-200 text-[#0f2352]'
                }`}
                title={isCpo ? "Add or activate approver roles" : "Configure your personal digital signature and signing PIN"}
              >
                <UserCheck className={`w-3.5 h-3.5 ${isCpo ? 'text-emerald-600' : 'text-blue-600'}`} />
                <span className="hidden sm:inline">{isCpo ? 'Activate Role' : 'My E-Sign'}</span>
              </button>
            )}

            {/* CPO Payout Entry (HR) vs Payout Reviewer (Others) */}
            {(onSelectHubTab || onOpenPayoutModal) && (
              <button
                type="button"
                onClick={() => {
                  if (onSelectHubTab) {
                    onSelectHubTab('payouts');
                  } else if (onOpenPayoutModal) {
                    onOpenPayoutModal();
                  }
                }}
                className={`relative inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all shadow-2xs border ${
                  activeHubTab === 'payouts'
                    ? isHr
                      ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                      : 'bg-rose-600 text-white border-rose-600 shadow-xs'
                    : isCpo
                      ? 'bg-rose-50 hover:bg-rose-100 border-rose-300 text-rose-900'
                      : isHr
                        ? 'bg-emerald-50 hover:bg-emerald-100 border-emerald-300 text-emerald-900'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
                title={
                  isHr
                    ? 'Submit staff payout or deduction entries for upcoming payroll cut-off (HR Coordinator Entry)'
                    : isCpo
                      ? 'Review and digitally authorize staff payout and deduction requests (CPO Reviewer)'
                      : isPayroll
                        ? 'Review CPO-authorized payouts and record ADP batch numbers (Payroll Reviewer)'
                        : 'Review staff payout and deduction records (Reviewer Mode)'
                }
              >
                <DollarSign className={`w-4 h-4 ${
                  activeHubTab === 'payouts' ? 'text-white' : isHr ? 'text-emerald-600' : isCpo ? 'text-rose-600' : 'text-slate-600'
                }`} />
                <span className="hidden sm:inline">
                  {isHr ? 'Payout Entry' : isCpo ? 'CPO Reviewer' : isPayroll ? 'Payroll Reviewer' : 'Payout Reviewer'}
                </span>
                {pendingPayoutsCount > 0 && !isHr && (
                  <span className={`px-1.5 py-0.5 rounded-full text-[11px] font-black shadow-xs ${
                    activeHubTab === 'payouts' ? 'bg-white text-rose-700' : 'bg-rose-500 text-white'
                  }`}>
                    {pendingPayoutsCount}
                  </span>
                )}
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

            {/* Workflow Diagram button */}
            <button
              onClick={() => {
                if (onSelectHubTab) {
                  onSelectHubTab('workflow');
                } else if (onOpenWorkflowModal) {
                  onOpenWorkflowModal();
                }
              }}
              className={`inline-flex items-center space-x-1 px-3 py-2 rounded-xl text-xs font-medium transition-colors border ${
                activeHubTab === 'workflow'
                  ? 'bg-[#0f2352] text-white border-[#0f2352] shadow-xs'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
              title="View SST Routing Architecture"
            >
              <GitBranch className={`w-4 h-4 ${activeHubTab === 'workflow' ? 'text-white' : 'text-slate-500'}`} />
              <span className="hidden lg:inline">Routing Map</span>
            </button>

            {/* Admin Tool: Workflow & Approver Config Button — RESTRICTED TO CHIEF PEOPLE OFFICER ONLY */}
            {isCpo && (
              <button
                onClick={onOpenAdminModal}
                className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-[#0f2352]/5 hover:bg-[#0f2352]/10 border border-[#0f2352]/20 text-[#0f2352] transition-colors shadow-2xs"
                title="Open SST Workflow & Approver Admin Tool (Chief People Officer only)"
              >
                <Sliders className="w-3.5 h-3.5 text-[#b91c1c]" />
                <span className="hidden sm:inline">Workflow Admin</span>
              </button>
            )}

            {/* Reset mock data */}
            <button
              onClick={onResetData}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
              title="Reset Sample Records to Uploaded PAR Form"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            {/* Primary Action: New PAR Button */}
            <button
              onClick={onOpenNewParModal}
              className="inline-flex items-center space-x-1.5 px-4 py-2.5 bg-[#0f2352] hover:bg-[#1a3880] text-white text-xs font-bold rounded-xl shadow-md shadow-[#0f2352]/20 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Create New PAR</span>
            </button>

          </div>
        </div>
      </div>
    </header>
  );
};
