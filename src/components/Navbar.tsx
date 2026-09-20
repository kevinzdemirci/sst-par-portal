import React from 'react';
import { UserPersona, PersonnelActionRequest } from '../types/par';
import { USER_PERSONAS } from '../data/mockData';
import { canPersonaActOnPar, isChiefPeopleOfficer } from '../utils/formatters';
import { Plus, Users, GitBranch, RefreshCw, ShieldAlert, Sliders, UserCheck, Trash2 } from 'lucide-react';
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
  onResetData: () => void;
  pars: PersonnelActionRequest[];
  filterActionQueue: boolean;
  onToggleActionQueue: () => void;
  districtLogo?: string;
  districtName?: string;
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
  onResetData,
  pars,
  filterActionQueue,
  onToggleActionQueue,
  districtLogo,
  districtName
}) => {
  const pendingForPersona = pars.filter(p => canPersonaActOnPar(currentPersona, p)).length;
  const isCpo = isChiefPeopleOfficer(currentPersona);

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo & School of Science and Technology Branding */}
          <div className="flex items-center space-x-3.5">
            <div className="h-14 flex items-center">
              <img 
                src={districtLogo || '/sst-logo.jpg'} 
                alt={districtName || 'School of Science and Technology'} 
                className="h-12 w-auto object-contain rounded"
              />
            </div>
            <div className="border-l border-slate-200 pl-3.5 hidden sm:block">
              <div className="flex items-center space-x-2">
                <span className="text-base font-black tracking-tight text-[#0f2352]">
                  Personnel Action Request (PAR) Portal
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-red-100 text-red-800 border border-red-200">
                  SST Official
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                {districtName || 'School of Science and Technology'} • Multi-Department Workflow
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
                    if (onOpenRoleManagerModal) onOpenRoleManagerModal();
                  } else {
                    const found = availablePersonas.find(p => p.id === e.target.value);
                    if (found) onSelectPersona(found);
                  }
                }}
                className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                title="Switch Viewing Persona"
              >
                <optgroup label="Active Approver Accounts">
                  {availablePersonas.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} — {p.role} ({p.department})
                    </option>
                  ))}
                </optgroup>
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
            {onOpenRoleManagerModal && (
              <button
                type="button"
                onClick={onOpenRoleManagerModal}
                className={`inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-colors shadow-2xs border ${
                  isCpo 
                    ? 'bg-rose-50 hover:bg-rose-100 border-rose-200 text-rose-800' 
                    : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
                }`}
                title={isCpo ? "Manage, add, and remove roles from the SST directory (CPO Admin)" : "View SST Approver Directory"}
              >
                {isCpo ? <Trash2 className="w-3.5 h-3.5 text-rose-600" /> : <Users className="w-3.5 h-3.5 text-slate-600" />}
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

            {/* Workflow Diagram modal button */}
            <button
              onClick={onOpenWorkflowModal}
              className="inline-flex items-center space-x-1 px-3 py-2 rounded-xl text-xs font-medium bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
              title="View SST Routing Architecture"
            >
              <GitBranch className="w-4 h-4 text-slate-500" />
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
