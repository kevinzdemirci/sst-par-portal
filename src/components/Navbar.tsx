import React from 'react';
import { UserPersona, PersonnelActionRequest } from '../types/par';
import { USER_PERSONAS } from '../data/mockData';
import { canPersonaActOnPar } from '../utils/formatters';
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
                  } else if (e.target.value === '__MANAGE_ROLES__') {
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
                <optgroup label="Account Setup & Directory">
                  <option value="__NEW_ACCOUNT__">+ Activate Role / Create Approver Account...</option>
                  <option value="__MANAGE_ROLES__">⚙️ Manage / Remove Roles...</option>
                </optgroup>
              </select>

              <span className="text-xs font-semibold text-[#0f2352] bg-white shadow-2xs border border-slate-200 px-2.5 py-1 rounded-xl pointer-events-none hidden lg:inline-flex items-center space-x-1">
                <Users className="w-3.5 h-3.5 mr-1 text-[#b91c1c]" />
                <span>Simulate Role</span>
              </span>
            </div>

            {/* Manage / Remove Roles Button */}
            {onOpenRoleManagerModal && (
              <button
                type="button"
                onClick={onOpenRoleManagerModal}
                className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-800 transition-colors shadow-2xs"
                title="Manage and remove roles from the SST directory"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                <span className="hidden sm:inline">Manage Roles</span>
              </button>
            )}

            {/* Account Creation / Role Activation Button */}
            {onOpenAccountModal && (
              <button
                onClick={() => onOpenAccountModal()}
                className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-900 transition-colors shadow-2xs"
                title="Create account or activate your role"
              >
                <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden sm:inline">Activate Role</span>
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

            {/* Admin Tool: Workflow & Approver Config Button */}
            <button
              onClick={onOpenAdminModal}
              className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-[#0f2352]/5 hover:bg-[#0f2352]/10 border border-[#0f2352]/20 text-[#0f2352] transition-colors shadow-2xs"
              title="Open SST Workflow & Approver Admin Tool"
            >
              <Sliders className="w-3.5 h-3.5 text-[#b91c1c]" />
              <span className="hidden sm:inline">Workflow Admin</span>
            </button>

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
