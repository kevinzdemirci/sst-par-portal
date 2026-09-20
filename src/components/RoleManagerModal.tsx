import React, { useState, useMemo, useRef } from 'react';
import { UserPersona, ApproverRoleConfig, WorkflowConfig } from '../types/par';
import { 
  X, 
  Trash2, 
  RotateCcw, 
  Plus, 
  Search, 
  ShieldCheck, 
  AlertTriangle,
  CheckCircle2,
  Mail,
  Info,
  Camera,
  Pencil,
  Upload,
  Sparkles,
  Image as ImageIcon,
  Bell
} from 'lucide-react';
import { isChiefPeopleOfficer, getInitialsAvatarUrl } from '../utils/formatters';
import { compressImageFile } from '../utils/imageCompressor';
import { SST_DEFAULT_LOGO } from '../data/sstLogo';

interface RoleManagerModalProps {
  availablePersonas: UserPersona[];
  workflowConfig: WorkflowConfig;
  currentPersona: UserPersona;
  onSelectPersona: (persona: UserPersona) => void;
  onDeleteRole: (roleId: string) => void;
  onDeactivateAccount: (roleId: string) => void;
  onOpenAccountModal: (role?: ApproverRoleConfig) => void;
  onSendActivationEmail?: (role: ApproverRoleConfig | UserPersona) => void;
  onUpdateRolePhoto?: (roleId: string, newPhoto: string) => void;
  onClose?: () => void;
  embedded?: boolean;
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
  onUpdateRolePhoto,
  onClose,
  embedded = false
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [changingPhotoForId, setChangingPhotoForId] = useState<string | null>(null);
  const [targetPhotoRoleId, setTargetPhotoRoleId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isCpo = isChiefPeopleOfficer(currentPersona);

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
    if (role.id === 'p-kevin' || role.email.toLowerCase() === 'kdemirci@ssttx.org' || role.role.toLowerCase().includes('chief people officer')) {
      alert('The Chief People Officer (Dr. Kevin Demirci) is the root Super Admin of the district and cannot be removed.');
      return;
    }

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

  const triggerFileUpload = (roleId: string) => {
    setTargetPhotoRoleId(roleId);
    fileInputRef.current?.click();
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !targetPhotoRoleId || !onUpdateRolePhoto) return;
    try {
      const compressed = await compressImageFile(file, 256, 256, 0.85);
      onUpdateRolePhoto(targetPhotoRoleId, compressed);
      setChangingPhotoForId(null);
      setTargetPhotoRoleId(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      alert('Could not compress image. Please try a different photo file.');
    }
  };

  const generateInitialsAvatar = (roleId: string, roleName: string) => {
    const avatarUrl = getInitialsAvatarUrl(roleName);
    if (onUpdateRolePhoto) {
      onUpdateRolePhoto(roleId, avatarUrl);
    }
    setChangingPhotoForId(null);
  };

  const innerContent = (
    <div className={`bg-white rounded-3xl border border-slate-200 flex flex-col overflow-hidden ${
      embedded ? 'shadow-md w-full' : 'shadow-2xl max-w-4xl w-full max-h-[90vh] animate-scaleUp'
    }`}>
      
      {/* Modal Header */}
      <div className="p-6 bg-gradient-to-r from-[#0f2352] to-[#1a3880] text-white flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-3.5">
          <img src={SST_DEFAULT_LOGO} alt="SST Logo" className="h-12 w-auto object-contain bg-white/10 p-1 rounded-xl border border-white/20" />
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-lg font-black tracking-tight">
                {isCpo ? 'SST Role & Approver Directory Manager' : 'SST Approver Directory'}
              </h3>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                isCpo 
                  ? 'bg-amber-400/20 text-amber-300 border-amber-400/30' 
                  : 'bg-blue-400/20 text-blue-200 border-blue-400/30'
              }`}>
                {isCpo ? 'Super Admin' : 'Read-Only View'}
              </span>
              <span className="text-[11px] font-bold bg-white/10 text-white px-2 py-0.5 rounded-full border border-white/20">
                {allRoles.length} Roles
              </span>
            </div>
            <p className="text-xs text-blue-200 mt-0.5">
              {isCpo 
                ? 'Add or remove approver roles, invite team members, and manage digital signature credentials.' 
                : 'SST executive & campus approver directory. Role creation, deletion, and routing are managed by the Chief People Officer.'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {isCpo && (
            <button
              onClick={() => {
                if (onClose && !embedded) onClose();
                onOpenAccountModal();
              }}
              className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-xs flex items-center space-x-1.5 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Approver Role</span>
            </button>
          )}
          {onClose && !embedded && (
            <button
              onClick={onClose}
              className="p-2 text-blue-200 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
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

          <div className="text-[11px] flex items-center space-x-1.5">
            {isCpo ? (
              <>
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span className="text-slate-600">Removing a role automatically preserves and reassigns any assigned routing rules.</span>
              </>
            ) : (
              <>
                <Info className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span className="text-slate-600">
                  Viewing directory as <strong>{currentPersona.name}</strong> ({currentPersona.role}). Role addition/removal restricted to CPO.
                </span>
              </>
            )}
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
              const fullRoleConfig: ApproverRoleConfig = role.approverConfig || {
                id: role.id,
                name: role.name,
                title: role.role,
                roleKey: 'custom',
                email: role.email,
                department: role.department,
                campus: role.campus || 'Central Office',
                region: role.region || 'All SST Schools',
                avatar: role.avatar,
                signerId: role.persona?.signerId || `SST-${Date.now()}`,
                ipAddress: role.persona?.ipAddress || '208.184.164.228',
                isAccountActivated: role.isAccountActivated,
                signingPin: role.persona?.signingPin,
                signatureImage: role.persona?.signatureImage,
                canReviewStages: role.persona?.canReviewStages || ['draft', 'supervisor_review', 'cpo_review', 'regional_review', 'hr_review']
              };

              return (
                <div
                  key={role.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col ${
                    isCurrent 
                      ? 'bg-blue-50/60 border-blue-300 shadow-xs' 
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Left: Persona Details & Interactive Avatar */}
                    <div className="flex items-start sm:items-center space-x-3.5">
                      <div className="relative group shrink-0">
                        <img
                          src={role.avatar}
                          alt={role.name}
                          className="w-14 h-14 rounded-full object-cover border-2 border-slate-200 shadow-2xs group-hover:opacity-90 transition-all"
                        />
                        {(isCpo || isCurrent) && (
                          <button
                            type="button"
                            onClick={() => setChangingPhotoForId(changingPhotoForId === role.id ? null : role.id)}
                            className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white shadow-xs"
                            title={`Change picture for ${role.name}`}
                          >
                            <Camera className="w-5 h-5" />
                          </button>
                        )}
                      </div>

                      <div>
                        <div className="flex items-center space-x-2 flex-wrap">
                          <span className="font-bold text-slate-900 text-sm">{role.name}</span>
                          {isCurrent && (
                            <span className="text-[10px] font-black bg-[#0f2352] text-white px-2 py-0.5 rounded-full">
                              Active Persona
                            </span>
                          )}
                          {role.approverConfig?.isNotificationOnly || role.persona?.isNotificationOnly ? (
                            <span className="text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-300 px-2 py-0.5 rounded-full flex items-center space-x-1">
                              <Bell className="w-3 h-3 text-purple-600" />
                              <span>Notification Only (No Action Required)</span>
                            </span>
                          ) : role.isAccountActivated ? (
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
                    <div className="flex items-center space-x-2 shrink-0 self-end md:self-auto flex-wrap gap-y-2">
                      {/* Switch to this role button */}
                      {!isCurrent && (
                        <button
                          type="button"
                          onClick={() => {
                            const isNotif = Boolean(role.approverConfig?.isNotificationOnly || role.persona?.isNotificationOnly);
                            const personaObj: UserPersona = role.persona || {
                              id: role.id,
                              name: role.name,
                              role: role.role,
                              department: role.department,
                              campus: role.campus || 'Central Office',
                              region: role.region || 'All SST Schools',
                              email: role.email,
                              avatar: role.avatar,
                              canReviewStages: isNotif ? [] : ['draft', 'supervisor_review', 'cpo_review', 'regional_review', 'hr_review'],
                              signerId: role.approverConfig?.signerId || `SST-${Date.now()}`,
                              ipAddress: role.approverConfig?.ipAddress || '208.184.164.228',
                              isNotificationOnly: isNotif,
                              notificationRoleType: role.approverConfig?.notificationRoleType || (role.persona as UserPersona | undefined)?.notificationRoleType
                            };
                            onSelectPersona(personaObj);
                          }}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
                          title="Simulate this persona"
                        >
                          Simulate Role
                        </button>
                      )}

                      {/* Direct Change Photo button */}
                      {(isCpo || isCurrent) && (
                        <button
                          type="button"
                          onClick={() => setChangingPhotoForId(changingPhotoForId === role.id ? null : role.id)}
                          className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center space-x-1.5 transition-colors border shadow-2xs ${
                            changingPhotoForId === role.id 
                              ? 'bg-amber-100 text-amber-900 border-amber-300' 
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                          }`}
                          title={`Change profile headshot for ${role.name}`}
                        >
                          <Camera className="w-3.5 h-3.5 text-slate-600" />
                          <span>{changingPhotoForId === role.id ? 'Close Photo' : 'Change Photo'}</span>
                        </button>
                      )}

                      {/* Explicit Edit Role button (CPO for all, non-CPO for self) */}
                      {(isCpo || isCurrent) && (
                        <button
                          type="button"
                          onClick={() => {
                            if (onClose && !embedded) onClose();
                            onOpenAccountModal(fullRoleConfig);
                          }}
                          className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-[#0f2352] border border-blue-200 font-bold text-xs rounded-xl transition-colors flex items-center space-x-1.5 shadow-2xs"
                          title={isCpo ? `Edit name, title, email, department, or e-sign for ${role.name}` : 'Edit your profile'}
                        >
                          <Pencil className="w-3.5 h-3.5 text-blue-600" />
                          <span>{isCpo ? 'Edit Role' : 'My Profile'}</span>
                        </button>
                      )}

                      {/* Send Activation Email (Chief People Officer Only) */}
                      {isCpo && onSendActivationEmail && (
                        <button
                          type="button"
                          onClick={() => onSendActivationEmail(fullRoleConfig)}
                          className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-bold text-xs rounded-xl transition-colors flex items-center space-x-1"
                          title={`Send activation email invitation to ${role.email}`}
                        >
                          <Mail className="w-3.5 h-3.5 text-blue-600" />
                          <span className="hidden sm:inline">Send Invite</span>
                        </button>
                      )}

                      {/* Deactivate button: CPO for anyone, non-CPO for self only */}
                      {role.isAccountActivated && (isCpo || isCurrent) && (
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

                      {/* Chief People Officer is the permanent root Super Admin and CANNOT be removed */}
                      {role.id === 'p-kevin' || role.email.toLowerCase() === 'kdemirci@ssttx.org' || role.role.toLowerCase().includes('chief people officer') ? (
                        <span className="px-2.5 py-1.5 bg-amber-50 text-amber-900 border border-amber-300 font-bold text-xs rounded-xl flex items-center space-x-1 shadow-2xs" title="Chief People Officer is the permanent root Super Admin and cannot be removed">
                          <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                          <span>Super Admin</span>
                        </span>
                      ) : isCpo && (
                        <button
                          type="button"
                          onClick={() => handleDeleteClick(role)}
                          className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 font-bold text-xs rounded-xl transition-all shadow-2xs hover:scale-105 active:scale-95 flex items-center space-x-1.5"
                          title={`Permanently remove ${role.name} (${role.role})`}
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                          <span>Remove Role</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Inline Photo Editor Panel for this role */}
                  {changingPhotoForId === role.id && (
                    <div className="w-full mt-3 p-4 bg-slate-50 rounded-2xl border-2 border-dashed border-blue-300 space-y-3 animate-fadeIn">
                      <div className="flex items-center justify-between">
                        <div className="font-bold text-slate-900 text-xs flex items-center space-x-1.5">
                          <ImageIcon className="w-4 h-4 text-blue-600" />
                          <span>Change Photo for <strong className="text-[#0f2352]">{role.name}</strong> ({role.role})</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setChangingPhotoForId(null)}
                          className="text-[11px] text-slate-400 hover:text-slate-600 font-bold"
                        >
                          ✕ Close
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => triggerFileUpload(role.id)}
                          className="py-2.5 px-3 bg-[#0f2352] hover:bg-[#1a3880] text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-1.5 transition-colors shadow-xs"
                        >
                          <Upload className="w-4 h-4" />
                          <span>Upload from Computer (Auto-Compressed)</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => generateInitialsAvatar(role.id, role.name)}
                          className="py-2.5 px-3 bg-white hover:bg-slate-100 text-slate-700 font-bold rounded-xl text-xs flex items-center justify-center space-x-1.5 transition-colors border border-slate-300 shadow-2xs"
                        >
                          <Sparkles className="w-4 h-4 text-amber-500" />
                          <span>Generate Initials Monogram Badge</span>
                        </button>
                      </div>
                    </div>
                  )}
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
          {onClose && !embedded && (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-bold rounded-xl transition-colors"
            >
              Done
            </button>
          )}
        </div>

      </div>
    );

    if (embedded) {
      return (
        <div className="w-full animate-fadeIn relative">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handlePhotoUpload} 
            accept="image/*" 
            className="hidden" 
          />
          {innerContent}
        </div>
      );
    }

    return (
      <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handlePhotoUpload} 
          accept="image/*" 
          className="hidden" 
        />
        {innerContent}
      </div>
    );
  };
