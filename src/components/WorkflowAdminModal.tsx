import React, { useState, useRef, useMemo } from 'react';
import { 
  WorkflowConfig, 
  ApproverRoleConfig, 
  WorkflowStageSetting, 
  WorkflowStage,
  SstRoutingRule,
  RuleRegionCondition,
  RuleVoluntaryCondition,
  ActionType,
  SchoolLocation,
  UserPersona
} from '../types/par';
import { DEFAULT_WORKFLOW_CONFIG, DEFAULT_SST_ROUTING_RULES, buildSstRouting } from '../data/mockData';
import { compressImageFile } from '../utils/imageCompressor';
import { isChiefPeopleOfficer } from '../utils/formatters';
import { 
  X, 
  Settings, 
  Users, 
  GitBranch, 
  RotateCcw, 
  Save, 
  Check, 
  Plus, 
  Trash2, 
  ShieldCheck, 
  Building, 
  Mail, 
  UserCheck, 
  Briefcase, 
  Camera, 
  Upload, 
  Sparkles, 
  Key, 
  Globe, 
  Search, 
  Image as ImageIcon,
  CheckSquare,
  Square,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  SlidersHorizontal,
  PlayCircle,
  AlertCircle
} from 'lucide-react';

interface WorkflowAdminModalProps {
  config: WorkflowConfig;
  currentPersona?: UserPersona;
  initialTab?: 'rules' | 'approvers' | 'stages' | 'branding' | 'backup';
  onSaveConfig: (newConfig: WorkflowConfig) => void;
  onResetConfig: () => void;
  onClose: () => void;
  onActivateApproverAccount?: (approver: ApproverRoleConfig) => void;
  onSendActivationEmail?: (approver: ApproverRoleConfig) => void;
}

const PRESET_AVATARS = [
  { label: 'Executive Male 1 (Dark Suit)', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&auto=format&fit=crop&q=80' },
  { label: 'Executive Male 2 (Beard)', url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=160&auto=format&fit=crop&q=80' },
  { label: 'Executive Male 3 (Glasses)', url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=160&auto=format&fit=crop&q=80' },
  { label: 'Executive Male 4 (Modern)', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=160&auto=format&fit=crop&q=80' },
  { label: 'Executive Female 1 (Professional)', url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=160&auto=format&fit=crop&q=80' },
  { label: 'Executive Female 2 (Smiley)', url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=160&auto=format&fit=crop&q=80' },
  { label: 'Executive Female 3 (Blazer)', url: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=160&auto=format&fit=crop&q=80' },
  { label: 'Executive Female 4 (Leader)', url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=160&auto=format&fit=crop&q=80' },
  { label: 'Executive Female 5 (Formal)', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&auto=format&fit=crop&q=80' },
  { label: 'Executive Diverse 6', url: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=160&auto=format&fit=crop&q=80' },
  { label: 'Executive Diverse 7', url: 'https://images.unsplash.com/photo-1573497491765-dccce02b29df?w=160&auto=format&fit=crop&q=80' },
  { label: 'SST School Crest Logo', url: '/sst-logo.jpg' }
];

const STAGE_OPTIONS: { stage: WorkflowStage; label: string }[] = [
  { stage: 'supervisor_review', label: 'Principal / Supervisor Endorsement' },
  { stage: 'cpo_review', label: 'Chief People Officer Review' },
  { stage: 'regional_review', label: 'Regional Executive Director Review' },
  { stage: 'hr_review', label: 'Regional HR Coordinator Review' },
  { stage: 'benefits_review', label: 'Benefits & COBRA Review' },
  { stage: 'payroll_action', label: 'Payroll & ADP Closeout' }
];

export const WorkflowAdminModal: React.FC<WorkflowAdminModalProps> = ({
  config,
  currentPersona,
  initialTab = 'rules',
  onSaveConfig,
  onResetConfig,
  onClose,
  onActivateApproverAccount,
  onSendActivationEmail
}) => {
  const isCpo = isChiefPeopleOfficer(currentPersona);
  const [activeTab, setActiveTab] = useState<'rules' | 'approvers' | 'stages' | 'branding' | 'backup'>(initialTab);
  const [routingRules, setRoutingRules] = useState<SstRoutingRule[]>(config.routingRules || DEFAULT_SST_ROUTING_RULES);
  const [approvers, setApprovers] = useState<ApproverRoleConfig[]>(config.approvers);
  const [stages, setStages] = useState<WorkflowStageSetting[]>(config.stages);
  const [districtName, setDistrictName] = useState(config.districtName || 'School of Science and Technology (SST)');
  const [districtLogo, setDistrictLogo] = useState(config.districtLogo || '/sst-logo.jpg');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [rulesSearch, setRulesSearch] = useState('');
  const [rulesFilterAction, setRulesFilterAction] = useState<string>('all');
  const [editingPhotoForId, setEditingPhotoForId] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  // Live Simulator State
  const [simActionType, setSimActionType] = useState<ActionType>('termination');
  const [simIsVoluntary, setSimIsVoluntary] = useState<boolean>(false);
  const [simLocation, setSimLocation] = useState<SchoolLocation>('Houston');

  // Dynamic simulation of routing
  const simulatedSteps = useMemo(() => {
    const currentConfig: WorkflowConfig = {
      stages,
      approvers,
      routingRules,
      districtName,
      districtLogo
    };
    return buildSstRouting(
      simActionType,
      simActionType === 'termination' ? simIsVoluntary : undefined,
      simLocation,
      currentConfig
    );
  }, [simActionType, simIsVoluntary, simLocation, stages, approvers, routingRules, districtName, districtLogo]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [targetUploadId, setTargetUploadId] = useState<string | null>(null);

  // Approver field update
  const handleApproverChange = (id: string, field: keyof ApproverRoleConfig, value: any) => {
    setApprovers(prev =>
      prev.map(appr => appr.id === id ? { ...appr, [field]: value } : appr)
    );
    setIsSaved(false);
  };

  // Toggle stage authorization for an approver
  const handleToggleApproverStage = (approverId: string, stage: WorkflowStage) => {
    setApprovers(prev =>
      prev.map(appr => {
        if (appr.id !== approverId) return appr;
        const currentStages = appr.canReviewStages || [];
        const nextStages = currentStages.includes(stage)
          ? currentStages.filter(s => s !== stage)
          : [...currentStages, stage];
        return { ...appr, canReviewStages: nextStages };
      })
    );
    setIsSaved(false);
  };

  // File upload for picture with automatic compression
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !targetUploadId) return;

    try {
      // Compress to 256x256 JPEG (~15-25KB) so it permanently fits in localStorage without quota error
      const compressedDataUrl = await compressImageFile(file, 256, 256, 0.85);
      handleApproverChange(targetUploadId, 'avatar', compressedDataUrl);
      setEditingPhotoForId(null);
      setTargetUploadId(null);
    } catch (err) {
      console.error('Failed to compress avatar photo, falling back to direct reader:', err);
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        if (uploadEvent.target?.result) {
          handleApproverChange(targetUploadId, 'avatar', uploadEvent.target.result as string);
          setEditingPhotoForId(null);
          setTargetUploadId(null);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileUpload = (id: string) => {
    setTargetUploadId(id);
    fileInputRef.current?.click();
  };

  // Generate initials avatar
  const generateInitialsAvatar = (id: string, name: string) => {
    const safeName = name.trim() || 'Approver';
    const bgColors = ['0f2352', 'b91c1c', '1e3a8a', '047857', '7c3aed', 'b45309'];
    const randomBg = bgColors[Math.abs(safeName.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)) % bgColors.length];
    const generatedUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(safeName)}&background=${randomBg}&color=fff&size=160&bold=true`;
    handleApproverChange(id, 'avatar', generatedUrl);
    setEditingPhotoForId(null);
  };

  // Regenerate signer ID
  const handleRegenerateSignerId = (id: string) => {
    const newSignerId = `${crypto.randomUUID()}`;
    handleApproverChange(id, 'signerId', newSignerId);
  };

  // Workflow Stage toggles
  const handleToggleStage = (stageId: string) => {
    setStages(prev =>
      prev.map(stg => stg.id === stageId ? { ...stg, isEnabled: !stg.isEnabled } : stg)
    );
    setIsSaved(false);
  };

  const handleStageLabelChange = (stageId: string, label: string) => {
    setStages(prev =>
      prev.map(stg => stg.id === stageId ? { ...stg, label } : stg)
    );
    setIsSaved(false);
  };

  const handleStageDescriptionChange = (stageId: string, description: string) => {
    setStages(prev =>
      prev.map(stg => stg.id === stageId ? { ...stg, description } : stg)
    );
    setIsSaved(false);
  };

  // Add custom approver
  const handleAddCustomApprover = () => {
    const newId = `p-custom-${Date.now()}`;
    const newAppr: ApproverRoleConfig = {
      id: newId,
      roleKey: 'custom',
      title: 'District Special Approver',
      name: 'New Approver Name',
      email: 'new.approver@ssttx.org',
      department: 'Central Administration',
      region: 'All SST Campuses',
      signerId: crypto.randomUUID(),
      ipAddress: '208.184.164.228',
      avatar: 'https://ui-avatars.com/api/?name=New+Approver&background=0f2352&color=fff&size=160&bold=true',
      canReviewStages: ['cpo_review', 'regional_review', 'hr_review']
    };
    setApprovers([...approvers, newAppr]);
    setIsSaved(false);
    if (onSendActivationEmail) {
      onSendActivationEmail(newAppr);
    }
  };

  // Delete approver role with rule cleanup
  const handleDeleteApprover = (id: string) => {
    if (approvers.length <= 1) {
      alert('Cannot delete approver. At least 1 approver is required for workflow routing.');
      return;
    }
    const apprToDelete = approvers.find(a => a.id === id);
    const confirmed = confirm(
      `Remove role "${apprToDelete?.name || 'this role'}" (${apprToDelete?.title || 'Approver'}) from the workflow?\n\nAny routing rules currently pointing to this approver will automatically be reassigned to the primary approver.`
    );
    if (!confirmed) return;

    const remainingApprovers = approvers.filter(a => a.id !== id);
    setApprovers(remainingApprovers);

    // Reassign any rules pointing to this deleted approver to the first remaining approver
    const fallbackId = remainingApprovers[0].id;
    setRoutingRules(prev => prev.map(r => {
      if (r.assignedApproverId === id) {
        return { ...r, assignedApproverId: fallbackId };
      }
      return r;
    }));

    setIsSaved(false);
  };

  // Deactivate approver e-signature account
  const handleDeactivateApprover = (id: string) => {
    const apprToDeactivate = approvers.find(a => a.id === id);
    const confirmed = confirm(
      `Deactivate electronic signing profile for ${apprToDeactivate?.name || 'this approver'}?\n\nThe role will remain in the workflow, but the electronic signature and PIN will be reset.`
    );
    if (!confirmed) return;

    setApprovers(prev => prev.map(a => a.id === id ? {
      ...a,
      isAccountActivated: false,
      signingPin: undefined,
      signatureImage: undefined
    } : a));
    setIsSaved(false);
  };

  // Routing Rule Handlers
  const handleToggleRule = (id: string) => {
    setRoutingRules(prev => prev.map(r => r.id === id ? { ...r, isEnabled: !r.isEnabled } : r));
    setIsSaved(false);
  };

  const handleRuleChange = (id: string, field: keyof SstRoutingRule, value: any) => {
    setRoutingRules(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
    setIsSaved(false);
  };

  const handleToggleRuleActionType = (ruleId: string, at: ActionType) => {
    setRoutingRules(prev => prev.map(r => {
      if (r.id !== ruleId) return r;
      const exists = r.actionTypes.includes(at);
      const updated = exists ? r.actionTypes.filter(t => t !== at) : [...r.actionTypes, at];
      return { ...r, actionTypes: updated };
    }));
    setIsSaved(false);
  };

  const handleAddRoutingRule = () => {
    const newRule: SstRoutingRule = {
      id: `rule-custom-${Date.now()}`,
      name: 'Custom Approval Routing Branch',
      description: 'Custom approval checkpoint for specific action types or campuses',
      stage: 'cpo_review',
      stageLabel: 'Executive Leadership Review',
      actionTypes: ['termination'],
      voluntaryCondition: 'all',
      regionCondition: 'all',
      assignedApproverId: approvers[1]?.id || 'p-kevin',
      isEnabled: true,
      priorityOrder: routingRules.length + 1
    };
    setRoutingRules([...routingRules, newRule]);
    setIsSaved(false);
  };

  const handleDeleteRule = (id: string) => {
    if (routingRules.length <= 2) {
      alert('At least 2 core routing rules must be maintained for workflow integrity.');
      return;
    }
    if (window.confirm('Delete this routing rule from SST workflow?')) {
      setRoutingRules(routingRules.filter(r => r.id !== id));
      setIsSaved(false);
    }
  };

  const handleMoveRule = (id: string, direction: 'up' | 'down') => {
    const idx = routingRules.findIndex(r => r.id === id);
    if (idx === -1) return;
    if (direction === 'up' && idx === 0) return;
    if (direction === 'down' && idx === routingRules.length - 1) return;

    const newRules = [...routingRules];
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    const temp = newRules[idx];
    newRules[idx] = newRules[targetIdx];
    newRules[targetIdx] = temp;

    const reordered = newRules.map((r, i) => ({ ...r, priorityOrder: i + 1 }));
    setRoutingRules(reordered);
    setIsSaved(false);
  };

  const handleResetRulesOnly = () => {
    if (window.confirm('Restore all routing rules to the official SST charter baseline?')) {
      setRoutingRules(DEFAULT_SST_ROUTING_RULES);
      setIsSaved(false);
    }
  };

  // Save changes
  const handleSave = () => {
    if (!isCpo) {
      alert('Access Denied: Only the Chief People Officer (Dr. Kevin Demirci) has permission to edit and save workflow configurations.');
      return;
    }
    const updated: WorkflowConfig = {
      stages,
      approvers,
      routingRules,
      districtName,
      districtLogo
    };
    onSaveConfig(updated);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3500);
  };

  // Reset to factory defaults
  const handleReset = () => {
    if (!isCpo) {
      alert('Access Denied: Only the Chief People Officer can reset workflow configurations.');
      return;
    }
    if (window.confirm('Reset all workflow settings, routing rules, approver names, emails, and pictures back to official SST defaults?')) {
      onResetConfig();
      setApprovers(DEFAULT_WORKFLOW_CONFIG.approvers);
      setStages(DEFAULT_WORKFLOW_CONFIG.stages);
      setRoutingRules(DEFAULT_SST_ROUTING_RULES);
      setDistrictName(DEFAULT_WORKFLOW_CONFIG.districtName || 'School of Science and Technology (SST)');
      setDistrictLogo(DEFAULT_WORKFLOW_CONFIG.districtLogo || '/sst-logo.jpg');
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3500);
    }
  };

  // Filtered rules by search & action type
  const filteredRules = routingRules.filter(rule => {
    if (rulesFilterAction !== 'all') {
      if (!rule.actionTypes.includes(rulesFilterAction as ActionType)) return false;
    }
    if (!rulesSearch.trim()) return true;
    const q = rulesSearch.toLowerCase();
    return (
      rule.name.toLowerCase().includes(q) ||
      rule.description.toLowerCase().includes(q) ||
      rule.stageLabel.toLowerCase().includes(q) ||
      rule.regionCondition.toLowerCase().includes(q)
    );
  });

  // Filtered approvers by search
  const filteredApprovers = approvers.filter(appr => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      appr.name.toLowerCase().includes(q) ||
      appr.email.toLowerCase().includes(q) ||
      appr.title.toLowerCase().includes(q) ||
      appr.department.toLowerCase().includes(q) ||
      appr.region.toLowerCase().includes(q)
    );
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/65 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 md:p-6 animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full max-h-[94vh] flex flex-col overflow-hidden border border-slate-200">
        
        {/* Hidden File Input for Avatar Uploads */}
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileSelect} 
          accept="image/*" 
          className="hidden" 
        />

        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 via-blue-50/40 to-slate-50 flex items-center justify-between">
          <div className="flex items-center space-x-3.5">
            <img src={districtLogo} alt="SST" className="h-10 w-auto object-contain rounded" />
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-slate-900 tracking-tight">
                  SST Workflow & Approver Admin Studio
                </h2>
                <span className="text-[10px] uppercase font-black tracking-wider px-2.5 py-0.5 rounded-full bg-[#0f2352] text-white">
                  Live Admin Tool
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Edit pictures, names, titles, emails, credentials, and stage routing rules with immediate live preview
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
            title="Close Admin Tool"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scoped Role Notice for Non-CPO Approvers */}
        {!isCpo && (
          <div className="bg-amber-50 border-b border-amber-200 px-6 py-2.5 flex items-center justify-between text-xs text-amber-900 shrink-0">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Read-Only Scoped Mode:</strong> You are viewing workflow configurations as <strong>{currentPersona?.name || 'Staff'}</strong> ({currentPersona?.role || 'Approver'}). Routing rules, approver assignments, and district policies can only be modified by the <strong>Chief People Officer (Dr. Kevin Demirci)</strong>.
              </span>
            </div>
            <span className="text-[10px] font-bold bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full border border-amber-300 shrink-0 ml-2">
              Scoped Role Access
            </span>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="px-6 pt-3 bg-white border-b border-slate-200 flex flex-wrap gap-4 text-xs font-bold">
          <button
            onClick={() => setActiveTab('rules')}
            className={`pb-3 border-b-2 transition-colors flex items-center space-x-2 ${
              activeTab === 'rules'
                ? 'border-[#0f2352] text-[#0f2352]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <GitBranch className="w-4 h-4 text-[#0f2352]" />
            <span>SST Routing Rules ({routingRules.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('approvers')}
            className={`pb-3 border-b-2 transition-colors flex items-center space-x-2 ${
              activeTab === 'approvers'
                ? 'border-[#0f2352] text-[#0f2352]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="w-4 h-4 text-[#b91c1c]" />
            <span>Approver Directory & Pictures ({approvers.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('stages')}
            className={`pb-3 border-b-2 transition-colors flex items-center space-x-2 ${
              activeTab === 'stages'
                ? 'border-[#0f2352] text-[#0f2352]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <GitBranch className="w-4 h-4 text-[#0f2352]" />
            <span>Workflow Sequence & Stages ({stages.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('branding')}
            className={`pb-3 border-b-2 transition-colors flex items-center space-x-2 ${
              activeTab === 'branding'
                ? 'border-[#0f2352] text-[#0f2352]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Building className="w-4 h-4 text-blue-600" />
            <span>District Branding & Rules</span>
          </button>

          <button
            onClick={() => setActiveTab('backup')}
            className={`pb-3 border-b-2 transition-colors flex items-center space-x-2 ${
              activeTab === 'backup'
                ? 'border-[#0f2352] text-[#0f2352]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Settings className="w-4 h-4 text-slate-500" />
            <span>Factory Reset & Diagnostics</span>
          </button>
        </div>

        {/* Tab Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/70 text-xs">

          {/* ===================== TAB 0: SST ROUTING RULES ===================== */}
          {activeTab === 'rules' && (
            <div className="space-y-5">
              
              {/* Context Action Banner */}
              <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-2xl p-5 shadow-sm space-y-3">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <h4 className="font-bold text-sm mb-1 flex items-center space-x-2">
                      <SlidersHorizontal className="w-4 h-4 text-amber-400" />
                      <span>SST Multi-Branch Conditional Routing Rules Engine</span>
                    </h4>
                    <p className="text-xs text-blue-100 max-w-2xl leading-relaxed">
                      Configure which personnel and departments sign off on each Personnel Action Request based on Action Type (Termination, Salary, Transfer, Promotion), Classification (Involuntary vs Voluntary), and Regional Campus Scope (Houston vs SA & CC). Rules evaluate sequentially in the priority order below.
                    </p>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <button
                      onClick={handleAddRoutingRule}
                      className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all active:scale-95"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Routing Rule</span>
                    </button>

                    <button
                      onClick={handleResetRulesOnly}
                      className="inline-flex items-center space-x-1.5 px-3 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl transition-all border border-white/20"
                      title="Restore default SST charter routing rules"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reset Rules</span>
                    </button>
                  </div>
                </div>

                {/* Search & Filter Row */}
                <div className="pt-2 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center space-x-2">
                    <span className="text-blue-200 text-[11px] font-semibold">Filter Action:</span>
                    <select
                      value={rulesFilterAction}
                      onChange={(e) => setRulesFilterAction(e.target.value)}
                      className="bg-white/10 border border-white/20 rounded-lg px-2.5 py-1 text-white text-xs focus:outline-none"
                    >
                      <option value="all" className="text-slate-900">All Action Types</option>
                      <option value="termination" className="text-slate-900">Terminations & Separations</option>
                      <option value="salary_change" className="text-slate-900">Salary Adjustments</option>
                      <option value="promotion" className="text-slate-900">Promotions</option>
                      <option value="campus_transfer" className="text-slate-900">Campus Transfers</option>
                      <option value="role_change" className="text-slate-900">Role Changes</option>
                      <option value="leave_of_absence" className="text-slate-900">Leave of Absence</option>
                    </select>
                  </div>

                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-blue-200 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input 
                      type="text" 
                      placeholder="Search rules by name, stage, region..." 
                      value={rulesSearch}
                      onChange={(e) => setRulesSearch(e.target.value)}
                      className="pl-8 pr-3 py-1 bg-white/10 border border-white/20 rounded-lg text-xs text-white placeholder-blue-200 focus:outline-none focus:ring-1 focus:ring-amber-400 w-full sm:w-64"
                    />
                  </div>
                </div>
              </div>

              {/* LIVE SIMULATOR & TEST BENCH */}
              <div className="bg-indigo-50/70 border border-indigo-200 rounded-2xl p-4 space-y-3.5 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-indigo-200 pb-2.5">
                  <div className="flex items-center space-x-2">
                    <div className="p-1 rounded-lg bg-indigo-600 text-white">
                      <PlayCircle className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-indigo-950 text-xs">Live SST Routing Rule Simulator</span>
                      <p className="text-[11px] text-indigo-700">Test any scenario below to verify the approval chain generated in real-time by your active rules:</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-indigo-800 bg-indigo-200/80 px-2.5 py-0.5 rounded-full shrink-0">
                    {simulatedSteps.length} Steps Generated
                  </span>
                </div>

                {/* Scenario Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-indigo-900 uppercase mb-1">
                      1. Action Type:
                    </label>
                    <select
                      value={simActionType}
                      onChange={(e) => setSimActionType(e.target.value as ActionType)}
                      className="w-full bg-white border border-indigo-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    >
                      <option value="termination">Termination & Separation</option>
                      <option value="salary_change">Salary Adjustment</option>
                      <option value="promotion">Promotion / Grade Change</option>
                      <option value="campus_transfer">Campus Transfer</option>
                      <option value="role_change">Role Modification</option>
                      <option value="leave_of_absence">Leave of Absence</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-indigo-900 uppercase mb-1">
                      2. Termination Type:
                    </label>
                    <select
                      disabled={simActionType !== 'termination'}
                      value={simIsVoluntary ? 'voluntary' : 'involuntary'}
                      onChange={(e) => setSimIsVoluntary(e.target.value === 'voluntary')}
                      className={`w-full bg-white border border-indigo-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${simActionType !== 'termination' ? 'opacity-40 cursor-not-allowed' : ''}`}
                    >
                      <option value="involuntary">Involuntary (District Initiated)</option>
                      <option value="voluntary">Voluntary (Employee Resignation)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-indigo-900 uppercase mb-1">
                      3. School Region / Campus Location:
                    </label>
                    <select
                      value={simLocation}
                      onChange={(e) => setSimLocation(e.target.value as SchoolLocation)}
                      className="w-full bg-white border border-indigo-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    >
                      <option value="Houston">Houston Area Campuses</option>
                      <option value="San Antonio">San Antonio Campuses</option>
                      <option value="Corpus Christi">Corpus Christi Campuses</option>
                      <option value="Austin">Austin Campuses</option>
                      <option value="Central Administration">Central Administration</option>
                    </select>
                  </div>
                </div>

                {/* Resulting Simulated Chain */}
                <div className="bg-white rounded-xl p-3 border border-indigo-100 space-y-2">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Simulated Sequential Approval Path:
                  </div>

                  {simulatedSteps.length > 0 ? (
                    <div className="flex flex-wrap items-center gap-2">
                      {simulatedSteps.map((step, idx) => {
                        const matchedApprover = approvers.find(a => a.email === step.assignedEmail || a.title === step.assignedRole);
                        return (
                          <React.Fragment key={step.id || idx}>
                            <div className="flex items-center space-x-2 p-2 bg-slate-50 border border-slate-200 rounded-xl shadow-2xs">
                              <span className="w-5 h-5 rounded-full bg-[#0f2352] text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                                {idx + 1}
                              </span>
                              {matchedApprover && (
                                <img 
                                  src={matchedApprover.avatar} 
                                  alt={matchedApprover.name}
                                  className="w-7 h-7 rounded-full object-cover border border-slate-300 shrink-0" 
                                />
                              )}
                              <div className="leading-tight">
                                <div className="font-bold text-slate-900 text-[11px] truncate max-w-[150px]">
                                  {step.assignedRole}
                                </div>
                                <div className="text-[10px] text-blue-700 font-semibold truncate max-w-[150px]">
                                  {matchedApprover?.name || step.assignedEmail}
                                </div>
                              </div>
                            </div>
                            {idx < simulatedSteps.length - 1 && (
                              <ArrowRight className="w-4 h-4 text-indigo-400 shrink-0" />
                            )}
                          </React.Fragment>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-lg text-xs flex items-center space-x-2">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>No active routing rules matched this scenario. Consider enabling or adding a rule.</span>
                    </div>
                  )}
                </div>
              </div>

              {/* RULES LIST */}
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs text-slate-600 font-bold px-1">
                  <span>Active & Configured SST Routing Rules ({filteredRules.length})</span>
                  <span className="text-[11px] font-normal text-slate-500">Order determines signature sequence</span>
                </div>

                {filteredRules.map((rule, idx) => {
                  const matchedApprover = approvers.find(a => a.id === rule.assignedApproverId)
                    || approvers.find(a => a.roleKey === rule.assignedApproverId);

                  return (
                    <div
                      key={rule.id}
                      className={`p-4 rounded-2xl border transition-all space-y-3.5 ${
                        rule.isEnabled 
                          ? 'bg-white border-slate-200 shadow-2xs hover:border-slate-300' 
                          : 'bg-slate-50/80 border-slate-200 opacity-60'
                      }`}
                    >
                      {/* Top Bar */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-slate-100">
                        <div className="flex items-center space-x-2.5">
                          {/* Order buttons */}
                          <div className="flex flex-col space-y-0.5">
                            <button
                              type="button"
                              onClick={() => handleMoveRule(rule.id, 'up')}
                              disabled={idx === 0}
                              className={`p-0.5 rounded hover:bg-slate-100 text-slate-500 ${idx === 0 ? 'opacity-30 cursor-not-allowed' : ''}`}
                              title="Move Rule Earlier in Sequence"
                            >
                              <ArrowUp className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveRule(rule.id, 'down')}
                              disabled={idx === routingRules.length - 1}
                              className={`p-0.5 rounded hover:bg-slate-100 text-slate-500 ${idx === routingRules.length - 1 ? 'opacity-30 cursor-not-allowed' : ''}`}
                              title="Move Rule Later in Sequence"
                            >
                              <ArrowDown className="w-3 h-3" />
                            </button>
                          </div>

                          <span className="px-2 py-0.5 rounded-md bg-[#0f2352] text-white font-bold text-[10px]">
                            Rule #{rule.priorityOrder}
                          </span>

                          <input
                            type="text"
                            value={rule.name}
                            onChange={(e) => handleRuleChange(rule.id, 'name', e.target.value)}
                            className="font-bold text-slate-900 border border-slate-200 rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 w-64 sm:w-80"
                            placeholder="Rule Name"
                          />
                        </div>

                        <div className="flex items-center space-x-2 shrink-0">
                          {/* Active / Disabled Switch */}
                          <button
                            type="button"
                            onClick={() => handleToggleRule(rule.id)}
                            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
                              rule.isEnabled
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 hover:bg-emerald-200'
                                : 'bg-slate-200 text-slate-600 border border-slate-300 hover:bg-slate-300'
                            }`}
                          >
                            <span className={`w-2 h-2 rounded-full ${rule.isEnabled ? 'bg-emerald-600' : 'bg-slate-400'}`} />
                            <span>{rule.isEnabled ? 'Active' : 'Disabled'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteRule(rule.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition-colors"
                            title="Delete this rule"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Description */}
                      <div>
                        <input
                          type="text"
                          value={rule.description}
                          onChange={(e) => handleRuleChange(rule.id, 'description', e.target.value)}
                          placeholder="Rule description or audit requirement..."
                          className="w-full text-slate-600 border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>

                      {/* Rule Settings Matrix */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-slate-50/70 rounded-xl border border-slate-200">
                        {/* 1. Target Stage & Stage Label */}
                        <div className="space-y-2">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                              Workflow Stage:
                            </label>
                            <select
                              value={rule.stage}
                              onChange={(e) => handleRuleChange(rule.id, 'stage', e.target.value as WorkflowStage)}
                              className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs text-slate-800"
                            >
                              {STAGE_OPTIONS.map(opt => (
                                <option key={opt.stage} value={opt.stage}>{opt.label}</option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                              Stage Display Label:
                            </label>
                            <input
                              type="text"
                              value={rule.stageLabel}
                              onChange={(e) => handleRuleChange(rule.id, 'stageLabel', e.target.value)}
                              className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs text-slate-800 font-semibold"
                            />
                          </div>
                        </div>

                        {/* 2. Assigned Approver */}
                        <div className="space-y-2">
                          <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                            Assigned Approver:
                          </label>
                          <select
                            value={rule.assignedApproverId}
                            onChange={(e) => handleRuleChange(rule.id, 'assignedApproverId', e.target.value)}
                            className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs text-slate-800 font-semibold"
                          >
                            {approvers.map(a => (
                              <option key={a.id} value={a.id}>
                                {a.name} ({a.title})
                              </option>
                            ))}
                          </select>

                          {/* Approver Preview Chip */}
                          {matchedApprover && (
                            <div className="flex items-center space-x-2 p-1.5 bg-white border border-slate-200 rounded-lg">
                              <img 
                                src={matchedApprover.avatar} 
                                alt={matchedApprover.name}
                                className="w-6 h-6 rounded-full object-cover shrink-0" 
                              />
                              <div className="truncate leading-tight text-[11px]">
                                <span className="font-bold text-slate-900 block truncate">{matchedApprover.name}</span>
                                <span className="text-slate-500 text-[10px] font-mono truncate">{matchedApprover.email}</span>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* 3. Conditional Scopes */}
                        <div className="space-y-2">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                              Campus Region Scope:
                            </label>
                            <select
                              value={rule.regionCondition}
                              onChange={(e) => handleRuleChange(rule.id, 'regionCondition', e.target.value as RuleRegionCondition)}
                              className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs text-slate-800"
                            >
                              <option value="all">All SST Campuses & Regions</option>
                              <option value="Houston">Houston Area Campuses Only</option>
                              <option value="San Antonio & Corpus Christi">San Antonio & Corpus Christi Only</option>
                              <option value="San Antonio">San Antonio Campuses Only</option>
                              <option value="Corpus Christi">Corpus Christi Campuses Only</option>
                              <option value="Austin">Austin Area Campuses</option>
                              <option value="Central Administration">Central Administration Only</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                              Termination Classification:
                            </label>
                            <select
                              value={rule.voluntaryCondition}
                              onChange={(e) => handleRuleChange(rule.id, 'voluntaryCondition', e.target.value as RuleVoluntaryCondition)}
                              className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs text-slate-800"
                            >
                              <option value="all">Any Classification (Voluntary & Involuntary)</option>
                              <option value="involuntary_only">Involuntary Only (Dr. Kevin Demirci - CPO)</option>
                              <option value="voluntary_only">Voluntary Only (Regional Exec Directors)</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Action Types Filter Badges */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <span className="text-[10px] font-bold text-slate-500 uppercase mr-1">Applies to:</span>
                        {[
                          { type: 'termination' as ActionType, label: 'Terminations' },
                          { type: 'salary_change' as ActionType, label: 'Salary Change' },
                          { type: 'promotion' as ActionType, label: 'Promotion' },
                          { type: 'campus_transfer' as ActionType, label: 'Campus Transfer' },
                          { type: 'role_change' as ActionType, label: 'Role Change' },
                          { type: 'leave_of_absence' as ActionType, label: 'Leave' }
                        ].map(({ type, label }) => {
                          const isChecked = rule.actionTypes.includes(type);
                          return (
                            <button
                              type="button"
                              key={type}
                              onClick={() => handleToggleRuleActionType(rule.id, type)}
                              className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition-all border ${
                                isChecked
                                  ? 'bg-[#0f2352] text-white border-[#0f2352]'
                                  : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                              }`}
                            >
                              {isChecked ? '✓ ' : ''}{label}
                            </button>
                          );
                        })}
                      </div>

                    </div>
                  );
                })}
              </div>

            </div>
          )}

          {/* ===================== TAB 1: APPROVERS DIRECTORY ===================== */}
          {activeTab === 'approvers' && (
            <div className="space-y-4">
              
              {/* Context Action Banner */}
              <div className="bg-blue-50/90 border border-blue-200 rounded-2xl p-4 text-[#0f2352] flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs">
                <div>
                  <h4 className="font-bold text-sm mb-0.5 flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>Complete Approver Customization (Pictures, Names & Credentials)</span>
                  </h4>
                  <p className="text-[11px] text-blue-900 leading-relaxed">
                    Click any approver's photo to upload a local picture, pick from professional executive presets, or generate an initials badge.
                    Updates instantly sync to the top persona switcher, digital signatures, and audit logs.
                  </p>
                </div>

                <div className="flex items-center space-x-2.5 shrink-0">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input 
                      type="text" 
                      placeholder="Search approvers..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8 pr-3 py-1.5 bg-white border border-blue-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0f2352]/20"
                    />
                  </div>

                  <button
                    onClick={handleAddCustomApprover}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-[#0f2352] hover:bg-[#1a3880] text-white text-xs font-bold rounded-xl shadow-xs transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Approver</span>
                  </button>
                </div>
              </div>

              {/* Approver Cards List */}
              <div className="space-y-4">
                {filteredApprovers.map((appr) => {
                  const isEditingPhoto = editingPhotoForId === appr.id;

                  return (
                    <div 
                      key={appr.id} 
                      className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs hover:border-slate-300 transition-all space-y-4"
                    >
                      {/* Approver Top Bar */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                        <div className="flex items-center space-x-3.5">
                          
                          {/* Avatar Circle with Hover Overlay */}
                          <div className="relative group shrink-0">
                            <img 
                              src={appr.avatar} 
                              alt={appr.name} 
                              className="w-14 h-14 rounded-full object-cover border-2 border-slate-200 shadow-sm group-hover:opacity-90 transition-all" 
                            />
                            <button
                              onClick={() => setEditingPhotoForId(isEditingPhoto ? null : appr.id)}
                              className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white"
                              title="Change Photo"
                            >
                              <Camera className="w-4 h-4" />
                            </button>
                          </div>

                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-black text-slate-900 text-sm">{appr.name}</span>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-[#0f2352] border border-blue-200">
                                {appr.roleKey.toUpperCase()}
                              </span>
                            </div>
                            <div className="text-xs text-slate-500 font-medium">{appr.title} • <span className="text-slate-400">{appr.department}</span></div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          {onSendActivationEmail && (
                            <button
                              type="button"
                              onClick={() => onSendActivationEmail(appr)}
                              className="px-2.5 py-1.5 rounded-xl font-bold text-xs flex items-center space-x-1.5 transition-colors border bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200 shadow-2xs"
                              title={`Send activation email invitation with direct link to ${appr.email}`}
                            >
                              <Mail className="w-3.5 h-3.5 text-blue-600" />
                              <span className="hidden sm:inline">Send Invite</span>
                            </button>
                          )}

                          {onActivateApproverAccount && (
                            <button
                              type="button"
                              onClick={() => onActivateApproverAccount(appr)}
                              className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center space-x-1.5 transition-colors border shadow-2xs ${
                                appr.isAccountActivated
                                  ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300'
                                  : 'bg-blue-50 hover:bg-blue-100 text-[#0f2352] border-blue-300'
                              }`}
                              title={`Claim & complete electronic signature onboarding for ${appr.name}`}
                            >
                              <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                              <span>{appr.isAccountActivated ? 'Active Profile' : 'Claim & Activate'}</span>
                            </button>
                          )}

                          <button
                            onClick={() => setEditingPhotoForId(isEditingPhoto ? null : appr.id)}
                            className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center space-x-1.5 transition-colors border ${
                              isEditingPhoto 
                                ? 'bg-amber-100 text-amber-900 border-amber-300' 
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                            }`}
                          >
                            <Camera className="w-3.5 h-3.5 text-slate-600" />
                            <span>{isEditingPhoto ? 'Done Editing Photo' : 'Change Photo'}</span>
                          </button>

                          {appr.isAccountActivated && (
                            <button
                              type="button"
                              onClick={() => handleDeactivateApprover(appr.id)}
                              className="px-2.5 py-1.5 text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-xl transition-colors flex items-center space-x-1"
                              title="Reset electronic signature and PIN for this approver"
                            >
                              <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                              <span className="hidden sm:inline">Deactivate</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleDeleteApprover(appr.id)}
                            className="px-3 py-1.5 rounded-xl font-bold text-xs flex items-center space-x-1.5 transition-all border bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-300 shadow-2xs hover:scale-105 active:scale-95"
                            title={`Permanently remove role ${appr.name} (${appr.title}) from workflow`}
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                            <span>Remove Role</span>
                          </button>
                        </div>
                      </div>

                      {/* PHOTO EDITING PANEL (Expands when clicking "Change Photo") */}
                      {isEditingPhoto && (
                        <div className="p-4 bg-slate-50 rounded-2xl border-2 border-dashed border-blue-300 space-y-3.5 animate-fadeIn">
                          <div className="flex items-center justify-between">
                            <div className="font-bold text-slate-900 text-xs flex items-center space-x-1.5">
                              <ImageIcon className="w-4 h-4 text-blue-600" />
                              <span>Edit Picture for {appr.name}</span>
                            </div>
                            <span className="text-[11px] text-slate-500">Upload a local file, paste a link, or pick an executive headshot</span>
                          </div>

                          {/* 3 Upload Options */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            
                            {/* Option 1: Local File Upload */}
                            <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2 text-center">
                              <div className="text-[11px] font-bold text-slate-700">Option 1: Upload from Computer</div>
                              <p className="text-[10px] text-slate-400">Select any JPG, PNG, or WebP photo from your hard drive</p>
                              <button
                                type="button"
                                onClick={() => triggerFileUpload(appr.id)}
                                className="w-full py-2 px-3 bg-[#0f2352] hover:bg-[#1a3880] text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-1.5 transition-colors"
                              >
                                <Upload className="w-3.5 h-3.5" />
                                <span>Browse & Upload File</span>
                              </button>
                            </div>

                            {/* Option 2: Image URL Direct Input */}
                            <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2">
                              <div className="text-[11px] font-bold text-slate-700">Option 2: Direct Image URL</div>
                              <input 
                                type="text"
                                value={appr.avatar}
                                onChange={(e) => handleApproverChange(appr.id, 'avatar', e.target.value)}
                                placeholder="https://example.com/photo.jpg"
                                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-800 font-mono focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0f2352]"
                              />
                              <div className="text-[10px] text-slate-400 truncate">Paste any public image address</div>
                            </div>

                            {/* Option 3: Generate Initials Badge */}
                            <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2 text-center">
                              <div className="text-[11px] font-bold text-slate-700">Option 3: Initials Badge</div>
                              <p className="text-[10px] text-slate-400">Auto-generate a clean charter initials avatar</p>
                              <button
                                type="button"
                                onClick={() => generateInitialsAvatar(appr.id, appr.name)}
                                className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs flex items-center justify-center space-x-1.5 transition-colors border border-slate-200"
                              >
                                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                                <span>Generate Initials Avatar</span>
                              </button>
                            </div>
                          </div>

                          {/* Quick Preset Headshot Gallery */}
                          <div className="pt-2 border-t border-slate-200">
                            <div className="text-[11px] font-bold text-slate-700 mb-2">Or Choose from Executive Presets:</div>
                            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-12 gap-2">
                              {PRESET_AVATARS.map((preset, pIdx) => (
                                <button
                                  key={pIdx}
                                  type="button"
                                  onClick={() => {
                                    handleApproverChange(appr.id, 'avatar', preset.url);
                                    setEditingPhotoForId(null);
                                  }}
                                  className={`relative group rounded-xl overflow-hidden border-2 transition-all p-0.5 ${
                                    appr.avatar === preset.url ? 'border-emerald-500 ring-2 ring-emerald-200' : 'border-slate-200 hover:border-[#0f2352]'
                                  }`}
                                  title={preset.label}
                                >
                                  <img 
                                    src={preset.url} 
                                    alt={preset.label} 
                                    className="w-full h-10 rounded-lg object-cover" 
                                  />
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Main Fields Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                        
                        {/* 1. Name */}
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                            Approver Full Name:
                          </label>
                          <div className="relative">
                            <UserCheck className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                            <input
                              type="text"
                              value={appr.name}
                              onChange={(e) => handleApproverChange(appr.id, 'name', e.target.value)}
                              className="w-full pl-8 pr-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0f2352]/20 focus:border-[#0f2352] text-slate-900 font-bold"
                            />
                          </div>
                        </div>

                        {/* 2. Email */}
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                            Official SST Email:
                          </label>
                          <div className="relative">
                            <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                            <input
                              type="text"
                              value={appr.email}
                              onChange={(e) => handleApproverChange(appr.id, 'email', e.target.value)}
                              className="w-full pl-8 pr-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0f2352]/20 focus:border-[#0f2352] text-blue-700 font-mono text-[11px]"
                            />
                          </div>
                        </div>

                        {/* 3. Job Title */}
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                            Designated Job Title:
                          </label>
                          <div className="relative">
                            <Briefcase className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                            <input
                              type="text"
                              value={appr.title}
                              onChange={(e) => handleApproverChange(appr.id, 'title', e.target.value)}
                              className="w-full pl-8 pr-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0f2352]/20 focus:border-[#0f2352] text-slate-800"
                            />
                          </div>
                        </div>

                        {/* 4. Region */}
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                            Assigned Region / Scope:
                          </label>
                          <div className="relative">
                            <Building className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                            <input
                              type="text"
                              value={appr.region}
                              onChange={(e) => handleApproverChange(appr.id, 'region', e.target.value)}
                              className="w-full pl-8 pr-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0f2352]/20 focus:border-[#0f2352] text-slate-800"
                            />
                          </div>
                        </div>

                        {/* 5. Department */}
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                            Department:
                          </label>
                          <input
                            type="text"
                            value={appr.department}
                            onChange={(e) => handleApproverChange(appr.id, 'department', e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0f2352]/20 focus:border-[#0f2352] text-slate-800 text-[11px]"
                          />
                        </div>

                        {/* 6. Signer ID Token */}
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 flex items-center justify-between">
                            <span>Digital Signer Token:</span>
                            <button
                              type="button"
                              onClick={() => handleRegenerateSignerId(appr.id)}
                              className="text-[9px] font-bold text-blue-600 hover:text-blue-800 underline"
                            >
                              New UUID
                            </button>
                          </label>
                          <div className="relative">
                            <Key className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                            <input
                              type="text"
                              value={appr.signerId}
                              onChange={(e) => handleApproverChange(appr.id, 'signerId', e.target.value)}
                              className="w-full pl-8 pr-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0f2352]/20 focus:border-[#0f2352] text-slate-600 font-mono text-[10px]"
                            />
                          </div>
                        </div>

                        {/* 7. Verified Signer IP */}
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 flex items-center justify-between">
                            <span>Verified Signer IP:</span>
                            <button
                              type="button"
                              onClick={() => handleApproverChange(appr.id, 'ipAddress', '208.184.164.228')}
                              className="text-[9px] font-bold text-blue-600 hover:text-blue-800 underline"
                            >
                              SST Gateway
                            </button>
                          </label>
                          <div className="relative">
                            <Globe className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                            <input
                              type="text"
                              value={appr.ipAddress}
                              onChange={(e) => handleApproverChange(appr.id, 'ipAddress', e.target.value)}
                              className="w-full pl-8 pr-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0f2352]/20 focus:border-[#0f2352] text-slate-700 font-mono text-[11px]"
                            />
                          </div>
                        </div>

                        {/* 8. Role Identifier */}
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                            System Role Key:
                          </label>
                          <select
                            value={appr.roleKey}
                            onChange={(e) => handleApproverChange(appr.id, 'roleKey', e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0f2352]/20 focus:border-[#0f2352] text-slate-800 text-[11px] font-bold"
                          >
                            <option value="supervisor">Supervisor / Principal</option>
                            <option value="cpo">Chief People Officer (CPO)</option>
                            <option value="regional_houston">Regional Exec (Houston)</option>
                            <option value="regional_sacc">Regional Exec (SA & CC)</option>
                            <option value="hr_houston">Regional HR (Houston)</option>
                            <option value="hr_sacc">Regional HR (SA & CC)</option>
                            <option value="benefits">Benefits & Leave</option>
                            <option value="payroll">Payroll Coordinator</option>
                            <option value="custom">Custom / Special Approver</option>
                          </select>
                        </div>

                      </div>

                      {/* Authorized Review Checkpoints */}
                      <div className="pt-2 border-t border-slate-100">
                        <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">
                          Authorized Approval Stages for this Persona:
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {STAGE_OPTIONS.map((opt) => {
                            const isChecked = appr.canReviewStages?.includes(opt.stage);
                            return (
                              <button
                                key={opt.stage}
                                type="button"
                                onClick={() => handleToggleApproverStage(appr.id, opt.stage)}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium flex items-center space-x-1.5 border transition-all ${
                                  isChecked 
                                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-bold shadow-2xs' 
                                    : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                                }`}
                              >
                                {isChecked ? <CheckSquare className="w-3.5 h-3.5 text-emerald-600" /> : <Square className="w-3.5 h-3.5 text-slate-400" />}
                                <span>{opt.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>

            </div>
          )}

          {/* ===================== TAB 2: WORKFLOW STAGES ===================== */}
          {activeTab === 'stages' && (
            <div className="space-y-4">
              <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4 text-purple-950 shadow-2xs">
                <h4 className="font-bold text-sm mb-0.5">Sequential Department Flow Configuration</h4>
                <p className="text-[11px] text-purple-800">
                  Enable or bypass individual review checkpoints, or customize stage labels and descriptions displayed across badges and routing previews.
                </p>
              </div>

              <div className="space-y-3">
                {stages.map((stg, idx) => (
                  <div 
                    key={stg.id} 
                    className={`p-4 rounded-2xl border transition-all space-y-3 ${
                      stg.isEnabled 
                        ? 'bg-white border-slate-200 shadow-2xs' 
                        : 'bg-slate-100/60 border-slate-200 opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="w-6 h-6 rounded-full bg-[#0f2352] text-white flex items-center justify-center font-bold text-xs">
                          {idx + 1}
                        </span>
                        <div>
                          <span className="font-bold text-slate-900 text-xs">{stg.label}</span>
                          <span className="text-[10px] text-slate-500 ml-2 font-mono">Stage: {stg.stage}</span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={stg.isEnabled} 
                            onChange={() => handleToggleStage(stg.id)}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                        </label>
                        <span className={`text-[10px] font-bold uppercase ${stg.isEnabled ? 'text-emerald-700' : 'text-slate-400'}`}>
                          {stg.isEnabled ? 'Active' : 'Bypassed'}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                          Custom Stage Display Label:
                        </label>
                        <input
                          type="text"
                          value={stg.label}
                          onChange={(e) => handleStageLabelChange(stg.id, e.target.value)}
                          className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0f2352]/20 focus:border-[#0f2352] text-slate-800 font-semibold"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                          Stage Purpose / Action Description:
                        </label>
                        <input
                          type="text"
                          value={stg.description}
                          onChange={(e) => handleStageDescriptionChange(stg.id, e.target.value)}
                          className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0f2352]/20 focus:border-[#0f2352] text-slate-800"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ===================== TAB 3: DISTRICT BRANDING & RULES ===================== */}
          {activeTab === 'branding' && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-4">
                <h4 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                  <Building className="w-4 h-4 text-blue-600" />
                  <span>Charter District Identity & Custom Branding</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                      District Organization Name:
                    </label>
                    <input 
                      type="text"
                      value={districtName}
                      onChange={(e) => {
                        setDistrictName(e.target.value);
                        setIsSaved(false);
                      }}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0f2352]/20"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                      District Logo Path / URL:
                    </label>
                    <div className="flex items-center space-x-2">
                      <img src={districtLogo} alt="Logo" className="w-8 h-8 object-contain rounded border border-slate-200" />
                      <input 
                        type="text"
                        value={districtLogo}
                        onChange={(e) => {
                          setDistrictLogo(e.target.value);
                          setIsSaved(false);
                        }}
                        className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-[11px] text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0f2352]/20"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-3">
                <h4 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>SST Automated Conditional Routing Rules</span>
                </h4>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5 text-[11px] text-slate-700 leading-relaxed">
                  <div>• <strong>Campus Supervisor Review:</strong> Always initiated or approved by the employee's campus principal.</div>
                  <div>• <strong>Involuntary Separations:</strong> Bypasses regional execs &rarr; routes straight to <strong>Dr. Kevin Demirci (Chief People Officer)</strong>.</div>
                  <div>• <strong>Voluntary Resignations:</strong> Branches by territory &rarr; <strong>Atnan Ekin</strong> (Houston Campuses) or <strong>Serdar Bulut</strong> (San Antonio & Corpus Christi Campuses).</div>
                  <div>• <strong>Regional HR Coordination:</strong> Branches by territory &rarr; <strong>Kristy Stewart</strong> (Houston Campuses) or <strong>Amber Johnson</strong> (San Antonio & Corpus Christi Campuses).</div>
                  <div>• <strong>Benefits Verification:</strong> Conducted by <strong>Ursula Villanueva</strong> for all terminations and leaves of absence.</div>
                  <div>• <strong>Final Payroll Action:</strong> Executed in ADP by <strong>Paola Comparini</strong>.</div>
                </div>
              </div>
            </div>
          )}

          {/* ===================== TAB 4: BACKUP & FACTORY RESET ===================== */}
          {activeTab === 'backup' && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-3">
                <h4 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                  <RotateCcw className="w-4 h-4 text-rose-600" />
                  <span>Factory Reset to SST Official Baseline</span>
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  If you have experimented with custom pictures, approver names, or disabled stages and wish to restore the clean baseline:
                </p>
                
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 space-y-2">
                  <div className="font-bold text-xs">Resetting restores:</div>
                  <ul className="list-disc list-inside text-[11px] space-y-1 text-rose-800">
                    <li>Dr. Kevin Demirci (Chief People Officer)</li>
                    <li>Atnan Ekin (Regional Exec Director - Houston)</li>
                    <li>Serdar Bulut (Regional Exec Director - SA & CC)</li>
                    <li>Kristy Stewart (Regional HR Coordinator - Houston)</li>
                    <li>Amber Johnson (Regional HR Coordinator - SA & CC)</li>
                    <li>Ursula Villanueva (Benefits & Leave Coordinator)</li>
                    <li>Paola Comparini (Payroll Coordinator)</li>
                    <li>Vanessa Nguyen (Principal / Supervisor)</li>
                    <li>Original high-resolution professional headshots and official `@ssttx.org` emails.</li>
                  </ul>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={handleReset}
                    className="inline-flex items-center space-x-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset Everything to Factory Defaults</span>
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer Bar */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {isSaved && (
              <span className="text-xs font-bold text-emerald-800 bg-emerald-100 border border-emerald-200 px-3 py-1 rounded-xl flex items-center space-x-1.5 animate-fadeIn">
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>All pictures, approver names, and workflow changes saved!</span>
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2.5">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-bold rounded-xl transition-colors"
            >
              Close
            </button>

            {isCpo ? (
              <button
                onClick={handleSave}
                className="inline-flex items-center space-x-1.5 px-5 py-2 bg-[#0f2352] hover:bg-[#1a3880] text-white text-xs font-bold rounded-xl shadow-md shadow-[#0f2352]/20 transition-all active:scale-95"
              >
                <Save className="w-4 h-4" />
                <span>Save & Apply Configuration</span>
              </button>
            ) : (
              <div className="text-xs text-slate-500 italic px-3.5 py-2 bg-slate-100 rounded-xl border border-slate-200">
                🔒 Saving restricted to Chief People Officer
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
