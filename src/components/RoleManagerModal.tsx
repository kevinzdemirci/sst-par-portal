import React, { useState, useMemo } from 'react';
import { UserPersona, ApproverRoleConfig, WorkflowConfig } from '../types/par';
import { 
  X, 
  Trash2, 
  UserCheck, 
  RotateCcw, 
  Plus, 
  Search, 
  ShieldCheck, 
  AlertTriangle,
  CheckCircle2,
  Mail
} from 'lucide-react';

interface RoleManagerModalProps {
  availablePersonas: UserPersona[];
  workflowConfig: WorkflowConfig;
  currentPersona: UserPersona;
  onSelectPersona: (persona: UserPersona) => void;
  onDeleteRole: (roleId: string) => void;
  onDeactivateAccount: (roleId: string) => void;
  onOpenAccountModal: (role?: ApproverRoleConfig) => void;
  onSendActivationEmail?: (role: ApproverRoleConfig | UserPersona) => void;
  onClose: () => void;
}

export const RoleManagerModal: React.FC<RoleManagerModalProps> = ({
  availablePersonas,
  workflowConfig,
  currentPersona,
  onSelectPersona,
  onDeleteRole,
  onDeactivateAccount,
  onOpenAccountModal,
  onSendActivationEmail,
  onClose
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Unify all roles from both availablePersonas and workflowConfig.approvers
  const allRoles = useMemo(() => {
    const roleMap = new Map<string, {
      id: string;
      name: string;
      role: string;
      email: string;
      department: string;
      campus?: string;
      region?: string;
      avatar: string;
      isAccountActivated?: boolean;
      approverConfig?: ApproverRoleConfig;
      persona?: UserPersona;
    }>();

    // Add all approvers from workflowConfig
    workflowConfig.approvers.forEach((appr) => {
      roleMap.set(appr.id, {
        id: appr.id,
        name: appr.name,
        role: appr.title,
        email: appr.email,
        department: appr.department,
        campus: appr.campus,
        region: appr.region,
        avatar: appr.avatar,
        isAccountActivated: appr.isAccountActivated,
        approverConfig: appr
      });
    });

    // Add all availablePersonas (if any are missing from workflowConfig)
    availablePersonas.forEach((p) => {
      const existing = roleMap.get(p.id);
      if (existing) {
        roleMap.set(p.id, {
          ...existing,
          persona: p,
          isAccountActivated: existing.isAccountActivated ?? p.isAccountActivated
        });
      } else {
        roleMap.set(p.id, {
          id: p.id,
          name: p.name,
          role: p.role,
          email: p.email,
          department: p.department,
          campus: p.campus,
          region: p.region,
          avatar: p.avatar,
          isAccountActivated: p.isAccountActivated,
          persona: p
        });
      }
    });

    return Array.from(roleMap.values());
  }, [availablePersonas, workflowConfig.approvers]);

  // Filter roles based on search
  const filteredRoles = useMemo(() => {
    if (!searchQuery.trim()) return allRoles;
    const q = searchQuery.toLowerCase();
    return allRoles.filter(r => 
      r.name.toLowerCase().includes(q) ||
      r.role.toLowerCase().includes(q) ||
      r.email.toLowerCase().includes(q) ||
      r.department.toLowerCase().includes(q) ||
      (r.region && r.region.toLowerCase().includes(q))
    );
  }, [allRoles, searchQuery]);

  const handleDeleteClick = (role: typeof allRoles[0]) => {
    if (allRoles.length <= 1) {
      alert('Cannot delete the last remaining role. At least one user/approver must exist in the system.');
      return;
    }

    const confirmMsg = `Are you sure you want to permanently remove this role?\n\n` +
      `Name: ${role.name}\n` +
      `Title: ${role.role}\n` +
      `Email: ${role.email}\n\n` +
      `This will remove the role from the top persona switcher, the workflow approval directory, and reassign any active routing rules to the primary administrator.`;

    if (window.confirm(confirmMsg)) {
      onDeleteRole(role.id);
    }
  };

  const handleDeactivateClick = (role: typeof allRoles[0]) => {
    if (window.confirm(`Deactivate digital signature profile for ${role.name}? The role will remain in the workflow, but the electronic signature and PIN will be cleared.`)) {
      onDeactivateAccount(role.id);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200 animate-scaleUp">
        
        {/* Modal Header */}
        <div className="p-6 bg-gradient-to-r from-[#0f2352] to-[#1a3880] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-white/10 rounded-2xl border border-white/20">
              <ShieldCheck className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-black tracking-tight">SST Role & Approver Directory Manager</h3>
                <span className="text-[11px] font-bold bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-400/30">
                  {allRoles.length} Total Roles
                </span>
              </div>
              <p className="text-xs text-blue-200 mt-0.5">
                Remove any listed role, claim or activate electronic signatures, or configure custom approvers.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                onClose();
                onOpenAccountModal();
              }}
              className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-xs flex items-center space-x-1.5 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add / Claim Role</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-blue-200 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search & Notice Toolbar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, role, email, region..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0f2352]/20"
            />
          </div>

          <div className="text-[11px] text-slate-500 flex items-center space-x-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span>Removing a role automatically preserves and reassigns any assigned routing rules.</span>
          </div>
        </div>

        {/* Roles List */}
        <div className="p-6 overflow-y-auto space-y-3 flex-1">
          {filteredRoles.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              No roles found matching "{searchQuery}".
            </div>
          ) : (
            filteredRoles.map((role) => {
              const isCurrent = currentPersona.id === role.id;

              return (
                <div
                  key={role.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    isCurrent 
                      ? 'bg-blue-50/60 border-blue-300 shadow-xs' 
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {/* Left: Persona Details */}
                  <div className="flex items-start sm:items-center space-x-3.5">
                    <img
                      src={role.avatar}
                      alt={role.name}
                      className="w-12 h-12 rounded-full object-cover border-2 border-slate-200 shadow-2xs shrink-0"
                    />
                    <div>
                      <div className="flex items-center space-x-2 flex-wrap">
                        <span className="font-bold text-slate-900 text-sm">{role.name}</span>
                        {isCurrent && (
                          <span className="text-[10px] font-black bg-[#0f2352] text-white px-2 py-0.5 rounded-full">
                            Active Persona
                          </span>
                        )}
                        {role.isAccountActivated ? (
                          <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-full flex items-center space-x-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>E-Sign Active</span>
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.5 rounded-full">
                            Standard Role
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-slate-600 font-medium mt-0.5">
                        <strong className="text-slate-800">{role.role}</strong> • {role.department}
                      </div>

                      <div className="flex items-center space-x-3 text-[11px] text-slate-400 mt-1 flex-wrap">
                        <span className="font-mono text-slate-600">{role.email}</span>
                        {role.region && <span>• {role.region}</span>}
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center space-x-2 shrink-0 self-end md:self-auto">
                    {/* Switch to this role button */}
                    {!isCurrent && (
                      <button
                        type="button"
                        onClick={() => {
                          const personaObj = role.persona || {
                            id: role.id,
                            name: role.name,
                            role: role.role,
                            department: role.department,
                            campus: role.campus || 'Central Office',
                            region: role.region || 'All SST Schools',
                            email: role.email,
                            avatar: role.avatar,
                            canReviewStages: ['draft', 'supervisor_review', 'cpo_review', 'regional_review', 'hr_review'],
                            signerId: role.approverConfig?.signerId || `SST-${Date.now()}`,
                            ipAddress: role.approverConfig?.ipAddress || '208.184.164.228'
                          };
                          onSelectPersona(personaObj);
                        }}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
                        title="Simulate this persona"
                      >
                        Simulate Role
                      </button>
                    )}

                    {/* Send Activation Email */}
                    {onSendActivationEmail && (
                      <button
                        type="button"
                        onClick={() => {
                          const targetRole = role.approverConfig || role.persona || {
                            id: role.id,
                            name: role.name,
                            role: role.role,
                            department: role.department,
                            campus: role.campus || 'Central Office',
                            region: role.region || 'All SST Schools',
                            email: role.email,
                            avatar: role.avatar,
                            canReviewStages: ['draft', 'supervisor_review', 'cpo_review', 'regional_review', 'hr_review'],
                            signerId: `SST-${Date.now()}`,
                            ipAddress: '208.184.164.228'
                          };
                          onSendActivationEmail(targetRole);
                        }}
                        className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-bold text-xs rounded-xl transition-colors flex items-center space-x-1"
                        title={`Send activation email invitation to ${role.email}`}
                      >
                        <Mail className="w-3.5 h-3.5 text-blue-600" />
                        <span className="hidden sm:inline">Send Invite</span>
                      </button>
                    )}

                    {/* Configure / Activate E-Sign */}
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenAccountModal(role.approverConfig);
                      }}
                      className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-[#0f2352] border border-blue-200 font-bold text-xs rounded-xl transition-colors flex items-center space-x-1"
                      title="Edit role credentials or digital signature"
                    >
                      <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                      <span>{role.isAccountActivated ? 'Edit E-Sign' : 'Activate'}</span>
                    </button>

                    {/* Deactivate button if activated */}
                    {role.isAccountActivated && (
                      <button
                        type="button"
                        onClick={() => handleDeactivateClick(role)}
                        className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 font-semibold text-xs rounded-xl transition-colors flex items-center space-x-1"
                        title="Reset digital signature and PIN"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                        <span className="hidden sm:inline">Deactivate</span>
                      </button>
                    )}

                    {/* Prominent Red Remove Role Button */}
                    <button
                      type="button"
                      onClick={() => handleDeleteClick(role)}
                      className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 font-bold text-xs rounded-xl transition-all shadow-2xs hover:scale-105 active:scale-95 flex items-center space-x-1.5"
                      title={`Permanently remove ${role.name} (${role.role})`}
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                      <span>Remove Role</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <div>
            Showing <strong className="text-slate-800">{filteredRoles.length}</strong> of <strong className="text-slate-800">{allRoles.length}</strong> roles.
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-bold rounded-xl transition-colors"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
