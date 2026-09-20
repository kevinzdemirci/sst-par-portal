import { useState, useEffect, useMemo } from 'react';
import { 
  PersonnelActionRequest, 
  UserPersona, 
  WorkflowStage, 
  ActionType, 
  SchoolLocation,
  Campus,
  WorkflowConfig,
  ApproverRoleConfig
} from './types/par';
import { USER_PERSONAS, INITIAL_PAR_DATA, DEFAULT_WORKFLOW_CONFIG, getNormalizedLogoUrl } from './data/mockData';
import { canPersonaActOnPar, isChiefPeopleOfficer } from './utils/formatters';
import { Navbar } from './components/Navbar';
import { DashboardStats } from './components/DashboardStats';
import { ParFilters } from './components/ParFilters';
import { ParTable } from './components/ParTable';
import { ParKanban } from './components/ParKanban';
import { ParDetailModal } from './components/ParDetailModal';
import { ParFormModal } from './components/ParFormModal';
import { WorkflowDiagramModal } from './components/WorkflowDiagramModal';
import { WorkflowAdminModal } from './components/WorkflowAdminModal';
import { AccountCreationModal } from './components/AccountCreationModal';
import { RoleManagerModal } from './components/RoleManagerModal';
import { ActivationEmailModal } from './components/ActivationEmailModal';
import { CpoPayoutModal } from './components/CpoPayoutModal';
import { CpoPayoutRequest } from './types/payout';
import { INITIAL_PAYOUT_REQUESTS } from './data/mockPayoutData';
import { isRegionalHrCoordinator } from './utils/formatters';
import { CheckCircle, AlertCircle, Info, Trash2, Users, DollarSign, FileText } from 'lucide-react';

const STORAGE_KEY = 'sst_par_requests_v2';
const PERSONA_KEY = 'sst_par_persona_v2';
const WORKFLOW_CONFIG_KEY = 'sst_workflow_config_v2';
const PERSONAS_CONFIG_KEY = 'sst_approver_personas_v2';
const PAYOUTS_KEY = 'sst_cpo_payouts_v1';
const HUB_TAB_KEY = 'sst_active_hub_tab_v1';

export function App() {
  const [pars, setPars] = useState<PersonnelActionRequest[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return INITIAL_PAR_DATA;
  });

  const [availablePersonas, setAvailablePersonas] = useState<UserPersona[]>(() => {
    try {
      const saved = localStorage.getItem(PERSONAS_CONFIG_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return USER_PERSONAS;
  });

  const [workflowConfig, setWorkflowConfig] = useState<WorkflowConfig>(() => {
    try {
      const saved = localStorage.getItem(WORKFLOW_CONFIG_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (!parsed.routingRules || !Array.isArray(parsed.routingRules) || parsed.routingRules.length === 0) {
          parsed.routingRules = DEFAULT_WORKFLOW_CONFIG.routingRules;
        }
        // Ensure all standard SST approvers exist so no roles are hidden from removal
        if (!Array.isArray(parsed.approvers)) {
          parsed.approvers = DEFAULT_WORKFLOW_CONFIG.approvers;
        } else {
          const currentIds = new Set(parsed.approvers.map((a: any) => a.id));
          DEFAULT_WORKFLOW_CONFIG.approvers.forEach((defAppr) => {
            if (!currentIds.has(defAppr.id)) {
              parsed.approvers.push(defAppr);
            }
          });
        }
        parsed.districtLogo = getNormalizedLogoUrl(parsed.districtLogo);
        return parsed;
      }
    } catch {
      // ignore
    }
    return DEFAULT_WORKFLOW_CONFIG;
  });

  const [currentPersona, setCurrentPersona] = useState<UserPersona>(() => {
    try {
      const saved = localStorage.getItem(PERSONA_KEY);
      if (saved) {
        // Look in saved available personas first (to preserve custom avatars & names)
        const savedPersonasStr = localStorage.getItem(PERSONAS_CONFIG_KEY);
        if (savedPersonasStr) {
          const list: UserPersona[] = JSON.parse(savedPersonasStr);
          const foundInList = list.find((p) => p.id === saved);
          if (foundInList) return foundInList;
        }

        // Fallback to saved workflowConfig approvers
        const savedWorkflowStr = localStorage.getItem(WORKFLOW_CONFIG_KEY);
        if (savedWorkflowStr) {
          const wf = JSON.parse(savedWorkflowStr);
          const appr = wf.approvers?.find((a: any) => a.id === saved);
          if (appr) {
            return {
              id: appr.id,
              name: appr.name,
              email: appr.email,
              role: appr.title || appr.role,
              campus: appr.campus || 'Central Office',
              region: appr.region,
              department: appr.department || 'Administration',
              avatar: appr.avatar,
              signerId: appr.signerId,
              ipAddress: appr.ipAddress,
              canReviewStages: appr.canReviewStages || ['cpo_review', 'regional_review', 'hr_review'],
              isAccountActivated: appr.isAccountActivated,
              signingPin: appr.signingPin,
              signatureImage: appr.signatureImage
            };
          }
        }

        const found = USER_PERSONAS.find(p => p.id === saved);
        if (found) return found;
      }
    } catch {
      // ignore
    }
    const cpoPersona = USER_PERSONAS.find((p) => p.email.toLowerCase() === 'kdemirci@ssttx.org') || USER_PERSONAS[0];
    return cpoPersona; // Default to Dr. Kevin Demirci (Chief People Officer / Super Admin)
  });

  // UI state
  const [selectedPar, setSelectedPar] = useState<PersonnelActionRequest | null>(null);
  const [isNewParModalOpen, setIsNewParModalOpen] = useState(false);
  const [isWorkflowModalOpen, setIsWorkflowModalOpen] = useState(false);
  const [isWorkflowAdminOpen, setIsWorkflowAdminOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isRoleManagerOpen, setIsRoleManagerOpen] = useState(false);
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
  const [targetAccountRole, setTargetAccountRole] = useState<ApproverRoleConfig | null>(null);
  const [activationEmailTarget, setActivationEmailTarget] = useState<ApproverRoleConfig | UserPersona | null>(null);
  const [isActivationFlow, setIsActivationFlow] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');
  const [activeHubTab, setActiveHubTab] = useState<'pars' | 'payouts' | 'directory' | 'workflow'>(() => {
    try {
      const saved = localStorage.getItem(HUB_TAB_KEY);
      if (saved && ['pars', 'payouts', 'directory', 'workflow'].includes(saved)) {
        return saved as any;
      }
    } catch {
      // ignore
    }
    return 'pars';
  });

  // CPO Payout & Deduction Approval System State
  const [payouts, setPayouts] = useState<CpoPayoutRequest[]>(() => {
    try {
      const saved = localStorage.getItem(PAYOUTS_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return INITIAL_PAYOUT_REQUESTS;
  });
  
  // Notification Toast
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'warning' | 'info'; text: string } | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedActionType, setSelectedActionType] = useState<ActionType | 'all'>('all');
  const [selectedLocation, setSelectedLocation] = useState<SchoolLocation | 'all'>('all');
  const [selectedCampus, setSelectedCampus] = useState<Campus | 'all'>('all');
  const [selectedStageFilter, setSelectedStageFilter] = useState<WorkflowStage | 'all'>('all');
  const [filterActionQueue, setFilterActionQueue] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(pars));
    } catch {
      // ignore
    }
  }, [pars]);

  useEffect(() => {
    try {
      localStorage.setItem(PERSONA_KEY, currentPersona.id);
    } catch {
      // ignore
    }
  }, [currentPersona]);

  useEffect(() => {
    try {
      localStorage.setItem(WORKFLOW_CONFIG_KEY, JSON.stringify(workflowConfig));
    } catch {
      // ignore
    }
  }, [workflowConfig]);

  useEffect(() => {
    try {
      localStorage.setItem(PERSONAS_CONFIG_KEY, JSON.stringify(availablePersonas));
    } catch {
      // ignore
    }
  }, [availablePersonas]);

  useEffect(() => {
    try {
      localStorage.setItem(PAYOUTS_KEY, JSON.stringify(payouts));
    } catch {
      // ignore
    }
  }, [payouts]);

  useEffect(() => {
    try {
      localStorage.setItem(HUB_TAB_KEY, activeHubTab);
    } catch {
      // ignore
    }
  }, [activeHubTab]);

  const pendingPayoutsCount = useMemo(() => {
    return payouts.filter(p => p.status === 'pending_cpo').length;
  }, [payouts]);

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Handle URL activation link (e.g., from an email invitation: ?activate=<roleId>)
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const activateId = params.get('activate');
      if (activateId) {
        const matchedAppr = workflowConfig.approvers.find((a) => a.id === activateId);
        if (matchedAppr) {
          setTargetAccountRole(matchedAppr);
          setIsActivationFlow(true);
          setIsAccountModalOpen(true);
        } else {
          const matchedPersona = availablePersonas.find((p) => p.id === activateId);
          if (matchedPersona) {
            setTargetAccountRole({
              id: matchedPersona.id,
              name: matchedPersona.name,
              title: matchedPersona.role,
              roleKey: 'custom',
              email: matchedPersona.email,
              department: matchedPersona.department,
              campus: matchedPersona.campus,
              region: matchedPersona.region || 'All SST Campuses',
              avatar: matchedPersona.avatar,
              signerId: matchedPersona.signerId,
              ipAddress: matchedPersona.ipAddress,
              isAccountActivated: matchedPersona.isAccountActivated,
              signingPin: matchedPersona.signingPin,
              signatureImage: matchedPersona.signatureImage
            });
            setIsActivationFlow(true);
            setIsAccountModalOpen(true);
          }
        }
      }
    } catch {
      // ignore
    }
  }, [workflowConfig.approvers, availablePersonas]);

  const showToast = (text: string, type: 'success' | 'warning' | 'info' = 'success') => {
    setToastMessage({ text, type });
  };

  // Handle saving workflow configuration from the Admin Tool (Chief People Officer Only)
  const handleSaveWorkflowConfig = (newConfig: WorkflowConfig) => {
    if (!isChiefPeopleOfficer(currentPersona)) {
      showToast('Unauthorized: Only the Chief People Officer (Dr. Kevin Demirci) can edit workflow configurations.', 'warning');
      return;
    }
    setWorkflowConfig(newConfig);

    // Identify current approver IDs and emails in the saved config
    const approverIds = new Set(newConfig.approvers.map((a) => a.id));
    const approverEmails = new Set(newConfig.approvers.map((a) => a.email.toLowerCase()));

    // Filter out removed approvers (while always preserving the primary submitter/Principal)
    const filteredPersonas = availablePersonas.filter((persona) => {
      if (persona.id === 'p-vanessa' || persona.role.includes('Principal')) return true;
      return approverIds.has(persona.id) || approverEmails.has(persona.email.toLowerCase());
    });

    // Synchronize available personas with edited approver names and details
    const updatedPersonas = filteredPersonas.map((persona) => {
      const matchedRole = newConfig.approvers.find(
        (r) => r.id === persona.id || r.email.toLowerCase() === persona.email.toLowerCase()
      );
      if (matchedRole) {
        return {
          ...persona,
          name: matchedRole.name,
          email: matchedRole.email,
          role: matchedRole.title,
          department: matchedRole.department,
          avatar: matchedRole.avatar,
          region: matchedRole.region,
          signerId: matchedRole.signerId,
          ipAddress: matchedRole.ipAddress,
          canReviewStages: matchedRole.canReviewStages || persona.canReviewStages,
          isAccountActivated: matchedRole.isAccountActivated,
          signingPin: matchedRole.signingPin,
          signatureImage: matchedRole.signatureImage
        };
      }
      return persona;
    });

    // Add any custom/new approver roles created in the admin tool
    newConfig.approvers.forEach((roleConfig) => {
      if (!updatedPersonas.some((p) => p.id === roleConfig.id || p.email.toLowerCase() === roleConfig.email.toLowerCase())) {
        updatedPersonas.push({
          id: roleConfig.id,
          name: roleConfig.name,
          role: roleConfig.title,
          email: roleConfig.email,
          department: roleConfig.department,
          region: roleConfig.region,
          avatar: roleConfig.avatar,
          canReviewStages: roleConfig.canReviewStages || ['cpo_review', 'regional_review', 'hr_review'],
          signerId: roleConfig.signerId || `SST-CUSTOM-${Date.now().toString(36).toUpperCase()}`,
          ipAddress: roleConfig.ipAddress || '10.200.1.55',
          isAccountActivated: roleConfig.isAccountActivated,
          signingPin: roleConfig.signingPin,
          signatureImage: roleConfig.signatureImage
        });
      }
    });

    setAvailablePersonas(updatedPersonas);

    // Update active persona or fallback if the currently selected persona was removed
    const activeUpdated = updatedPersonas.find((p) => p.id === currentPersona.id);
    if (activeUpdated) {
      setCurrentPersona(activeUpdated);
    } else if (updatedPersonas.length > 0) {
      setCurrentPersona(updatedPersonas[0]);
    }

    showToast('Workflow approval routing and personnel directory successfully updated!', 'success');
  };

  // Reset workflow configuration to factory defaults
  const handleResetWorkflowConfig = () => {
    setWorkflowConfig(DEFAULT_WORKFLOW_CONFIG);
    setAvailablePersonas(USER_PERSONAS);
    localStorage.removeItem(WORKFLOW_CONFIG_KEY);
    localStorage.removeItem(PERSONAS_CONFIG_KEY);
    showToast('Workflow configuration reset to SST charter defaults.', 'info');
  };

  // Approval Engine Action
  const handleApprovePar = (parId: string, comments: string, persona: UserPersona) => {
    setPars((prev) =>
      prev.map((par) => {
        if (par.id !== parId) return par;

        const currentStepIndex = par.routingSteps.findIndex(
          (s) => s.stage === par.currentStage && s.status === 'pending'
        );

        if (currentStepIndex === -1) return par;

        const updatedSteps = [...par.routingSteps];
        updatedSteps[currentStepIndex] = {
          ...updatedSteps[currentStepIndex],
          status: 'approved',
          reviewerName: persona.name,
          decisionDate: new Date().toISOString(),
          comments: comments || 'Approved & electronically signed.',
          signerId: persona.signerId,
          ipAddress: persona.ipAddress
        };

        // Update electronic signatures audit log
        const updatedSignatures = par.electronicSignatures.map((sig) => {
          if (sig.status === 'pending' && (
            (persona.canReviewStages.includes('supervisor_review') && sig.signingParty === 'Supervisor') ||
            (persona.canReviewStages.includes('cpo_review') && (sig.signingParty === 'Chief People Officer' || sig.signingParty === 'COO')) ||
            (persona.canReviewStages.includes('regional_review') && (sig.signingParty.includes('Regional Executive Director') || sig.signingParty === 'Regional Exec Director')) ||
            (persona.canReviewStages.includes('hr_review') && (sig.signingParty === 'HR' || sig.signingParty.includes('Regional HR') || sig.signingParty.includes('HR Coordinator'))) ||
            (persona.canReviewStages.includes('benefits_review') && sig.signingParty === 'Benefits') ||
            (persona.canReviewStages.includes('payroll_action') && (sig.signingParty === 'Payroll' || sig.signingParty.includes('Payroll Coordinator') || sig.signingParty.includes('Payroll')))
          )) {
            return {
              ...sig,
              status: 'signed' as const,
              signerName: persona.name,
              signerEmail: persona.email,
              signerId: persona.signerId,
              ipAddress: persona.ipAddress,
              timestamp: `${new Date().toLocaleDateString('en-US')} ${new Date().toLocaleTimeString('en-US')} (${new Date().toISOString()})`
            };
          }
          return sig;
        });

        // Determine next stage
        const nextPendingStep = updatedSteps.find((s) => s.status === 'pending');
        const nextStage = nextPendingStep ? nextPendingStep.stage : 'completed';

        const updatedComments = [
          ...par.comments,
          {
            id: `comm-${Date.now()}`,
            authorName: persona.name,
            authorRole: persona.role,
            authorDepartment: persona.department,
            timestamp: new Date().toISOString(),
            message: `[Digitally Signed by ${persona.name} (${persona.role})]: ${comments || 'Approved.'}`
          }
        ];

        const updatedPar: PersonnelActionRequest = {
          ...par,
          currentStage: nextStage,
          routingSteps: updatedSteps,
          electronicSignatures: updatedSignatures,
          comments: updatedComments,
          updatedAt: new Date().toISOString()
        };

        if (selectedPar?.id === parId) {
          setSelectedPar(updatedPar);
        }

        if (nextStage === 'completed') {
          showToast(`🎉 ${par.trackingNumber} fully endorsed across all SST departments and executed in ADP!`, 'success');
        } else {
          showToast(
            `✅ ${par.trackingNumber} signed and forwarded to ${nextPendingStep?.stageLabel} (${nextPendingStep?.assignedRole})!`,
            'success'
          );
        }

        return updatedPar;
      })
    );
  };

  // Rejection Engine Action
  const handleRejectPar = (parId: string, comments: string, persona: UserPersona) => {
    setPars((prev) =>
      prev.map((par) => {
        if (par.id !== parId) return par;

        const currentStepIndex = par.routingSteps.findIndex(
          (s) => s.stage === par.currentStage && s.status === 'pending'
        );

        const updatedSteps = [...par.routingSteps];
        if (currentStepIndex !== -1) {
          updatedSteps[currentStepIndex] = {
            ...updatedSteps[currentStepIndex],
            status: 'rejected',
            reviewerName: persona.name,
            decisionDate: new Date().toISOString(),
            comments
          };
        }

        const updatedComments = [
          ...par.comments,
          {
            id: `comm-${Date.now()}`,
            authorName: persona.name,
            authorRole: persona.role,
            authorDepartment: persona.department,
            timestamp: new Date().toISOString(),
            message: `[REJECTED by ${persona.role}]: ${comments}`
          }
        ];

        const updatedPar: PersonnelActionRequest = {
          ...par,
          currentStage: 'rejected',
          routingSteps: updatedSteps,
          comments: updatedComments,
          updatedAt: new Date().toISOString()
        };

        if (selectedPar?.id === parId) {
          setSelectedPar(updatedPar);
        }

        showToast(`❌ ${par.trackingNumber} has been declined.`, 'warning');
        return updatedPar;
      })
    );
  };

  // Request Revision Engine Action
  const handleRequestRevisionPar = (parId: string, comments: string, persona: UserPersona) => {
    setPars((prev) =>
      prev.map((par) => {
        if (par.id !== parId) return par;

        const currentStepIndex = par.routingSteps.findIndex(
          (s) => s.stage === par.currentStage && s.status === 'pending'
        );

        const updatedSteps = [...par.routingSteps];
        if (currentStepIndex !== -1) {
          updatedSteps[currentStepIndex] = {
            ...updatedSteps[currentStepIndex],
            status: 'returned',
            reviewerName: persona.name,
            decisionDate: new Date().toISOString(),
            comments
          };
        }

        const updatedComments = [
          ...par.comments,
          {
            id: `comm-${Date.now()}`,
            authorName: persona.name,
            authorRole: persona.role,
            authorDepartment: persona.department,
            timestamp: new Date().toISOString(),
            message: `[Returned for Revision by ${persona.role}]: ${comments}`
          }
        ];

        const updatedPar: PersonnelActionRequest = {
          ...par,
          currentStage: 'revision_requested',
          routingSteps: updatedSteps,
          comments: updatedComments,
          updatedAt: new Date().toISOString()
        };

        if (selectedPar?.id === parId) {
          setSelectedPar(updatedPar);
        }

        showToast(`⚠️ ${par.trackingNumber} returned to campus initiator for revisions.`, 'warning');
        return updatedPar;
      })
    );
  };

  // Add Comment Action
  const handleAddComment = (parId: string, message: string, persona: UserPersona) => {
    setPars((prev) =>
      prev.map((par) => {
        if (par.id !== parId) return par;

        const updatedComments = [
          ...par.comments,
          {
            id: `comm-${Date.now()}`,
            authorName: persona.name,
            authorRole: persona.role,
            authorDepartment: persona.department,
            timestamp: new Date().toISOString(),
            message
          }
        ];

        const updatedPar = {
          ...par,
          comments: updatedComments,
          updatedAt: new Date().toISOString()
        };

        if (selectedPar?.id === parId) {
          setSelectedPar(updatedPar);
        }

        showToast('Comment recorded to request log.', 'info');
        return updatedPar;
      })
    );
  };

  // Submit New PAR Action
  const handleSubmitNewPar = (newPar: PersonnelActionRequest) => {
    setPars([newPar, ...pars]);
    setIsNewParModalOpen(false);
    showToast(`🎉 New request ${newPar.trackingNumber} submitted for ${newPar.firstName} ${newPar.lastName}! Forwarded to Principal/Supervisor endorsement.`, 'success');
  };

  // Delete PAR Action (for test submissions or removals)
  const handleDeletePar = (parId: string) => {
    setPars((prev) => prev.filter((p) => p.id !== parId));
    if (selectedPar?.id === parId) {
      setSelectedPar(null);
    }
    showToast('Personnel Action Request deleted from records.', 'info');
  };

  // Update PAR Action (for editing employee name, ID, etc.)
  const handleUpdatePar = (updatedPar: PersonnelActionRequest) => {
    setPars((prev) => prev.map((p) => (p.id === updatedPar.id ? updatedPar : p)));
    if (selectedPar?.id === updatedPar.id) {
      setSelectedPar(updatedPar);
    }
    showToast(`Employee details updated for ${updatedPar.firstName} ${updatedPar.lastName} (ADP: ${updatedPar.employeeId}).`, 'success');
  };

  // Reset Demo Data
  const handleResetData = () => {
    if (confirm('Reset records back to the uploaded School of Science and Technology PAR sample?')) {
      setPars(INITIAL_PAR_DATA);
      setSelectedPar(null);
      localStorage.removeItem(STORAGE_KEY);
      showToast('SST records reset to uploaded sample data.', 'info');
    }
  };

  // Open Account Creation / Role Activation Modal
  const handleOpenAccountCreation = (approver?: ApproverRoleConfig) => {
    setTargetAccountRole(approver || null);
    setIsAccountModalOpen(true);
  };

  // Handle Account Created / Role Claimed
  const handleAccountCreated = (newPersona: UserPersona, updatedApprover: ApproverRoleConfig) => {
    // 1. Update available personas list
    setAvailablePersonas((prev) => {
      const exists = prev.some((p) => p.id === newPersona.id || p.email.toLowerCase() === newPersona.email.toLowerCase());
      if (exists) {
        return prev.map((p) =>
          (p.id === newPersona.id || p.email.toLowerCase() === newPersona.email.toLowerCase()) ? newPersona : p
        );
      }
      return [...prev, newPersona];
    });

    // 2. Update workflow config approvers directory
    setWorkflowConfig((prev) => {
      const exists = prev.approvers.some((a) => a.id === updatedApprover.id);
      let updatedApprovers: ApproverRoleConfig[];
      if (exists) {
        updatedApprovers = prev.approvers.map((a) => (a.id === updatedApprover.id ? updatedApprover : a));
      } else {
        updatedApprovers = [...prev.approvers, updatedApprover];
      }
      return {
        ...prev,
        approvers: updatedApprovers
      };
    });

    // 3. Switch active persona if editing own account, or if user is not Super Admin, or if activating from invite
    if (!isChiefPeopleOfficer(currentPersona) || newPersona.id === currentPersona.id || isActivationFlow) {
      setCurrentPersona(newPersona);
      setFilterActionQueue(true);
      showToast(`🎉 Welcome to SST, ${newPersona.name}! Digital signature and PIN activated for ${newPersona.role}.`, 'success');
      setIsActivationFlow(false);
    } else {
      showToast(`🎉 Profile details and picture updated for ${newPersona.name} (${newPersona.role})!`, 'success');
    }
  };

  // Directly update photo/picture for any role in the district
  const handleUpdateRolePhoto = (roleId: string, newPhoto: string) => {
    // 1. Update in workflowConfig.approvers
    setWorkflowConfig((prev) => ({
      ...prev,
      approvers: prev.approvers.map((a) => (a.id === roleId ? { ...a, avatar: newPhoto } : a))
    }));

    // 2. Update in availablePersonas
    setAvailablePersonas((prev) => prev.map((p) => (p.id === roleId ? { ...p, avatar: newPhoto } : p)));

    // 3. Update current persona if it matches
    if (currentPersona.id === roleId) {
      setCurrentPersona((prev) => ({ ...prev, avatar: newPhoto }));
    }

    showToast('📸 Profile picture updated successfully!', 'success');
  };

  // Delete / Remove Approver Role entirely (Chief People Officer Only)
  const handleDeleteRole = (roleId: string) => {
    if (!isChiefPeopleOfficer(currentPersona)) {
      showToast('Unauthorized: Only the Chief People Officer (Dr. Kevin Demirci) can remove roles from the workflow.', 'warning');
      return;
    }

    const roleToDelete = workflowConfig.approvers.find((a) => a.id === roleId);
    if (!roleToDelete) return;

    if (workflowConfig.approvers.length <= 1) {
      showToast('Cannot remove the last remaining approver role.', 'warning');
      return;
    }

    // 1. Update workflowConfig approvers
    const remainingApprovers = workflowConfig.approvers.filter((a) => a.id !== roleId);
    const fallbackId = remainingApprovers[0].id;

    // 2. Reassign routing rules that pointed to this role to the primary approver
    const updatedRules = workflowConfig.routingRules.map((r) => 
      r.assignedApproverId === roleId ? { ...r, assignedApproverId: fallbackId } : r
    );

    const updatedConfig: WorkflowConfig = {
      ...workflowConfig,
      approvers: remainingApprovers,
      routingRules: updatedRules
    };
    setWorkflowConfig(updatedConfig);

    // 3. Remove from available personas
    const updatedPersonas = availablePersonas.filter(
      (p) => p.id !== roleId && p.email.toLowerCase() !== roleToDelete.email.toLowerCase()
    );
    setAvailablePersonas(updatedPersonas);

    // 4. Fallback current persona if the active persona was deleted
    if (currentPersona.id === roleId && updatedPersonas.length > 0) {
      setCurrentPersona(updatedPersonas[0]);
    }

    showToast(`🗑️ Role "${roleToDelete.name}" (${roleToDelete.title}) was removed from the workflow.`, 'info');
  };

  // Deactivate Approver Account (resets signature and PIN while keeping role definition)
  const handleDeactivateRoleAccount = (roleId: string) => {
    if (!isChiefPeopleOfficer(currentPersona) && currentPersona.id !== roleId) {
      showToast('Unauthorized: You can only deactivate your own digital signature profile.', 'warning');
      return;
    }

    setWorkflowConfig((prev) => ({
      ...prev,
      approvers: prev.approvers.map((a) => a.id === roleId ? {
        ...a,
        isAccountActivated: false,
        signingPin: undefined,
        signatureImage: undefined
      } : a)
    }));

    setAvailablePersonas((prev) => prev.map((p) => p.id === roleId ? {
      ...p,
      isAccountActivated: false,
      signingPin: undefined,
      signatureImage: undefined
    } : p));

    if (currentPersona.id === roleId) {
      setCurrentPersona((prev) => ({
        ...prev,
        isAccountActivated: false,
        signingPin: undefined,
        signatureImage: undefined
      }));
    }

    showToast('Account electronic signing profile deactivated.', 'info');
  };

  // Filtered PARs calculation
  const filteredPars = useMemo(() => {
    return pars.filter((par) => {
      // Search text filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesFirst = par.firstName.toLowerCase().includes(q);
        const matchesLast = par.lastName.toLowerCase().includes(q);
        const matchesId = par.employeeId.toLowerCase().includes(q);
        const matchesTrack = par.trackingNumber.toLowerCase().includes(q);
        const matchesTitle = par.title.toLowerCase().includes(q);
        const matchesCampus = par.campus.toLowerCase().includes(q);
        if (!matchesFirst && !matchesLast && !matchesId && !matchesTrack && !matchesTitle && !matchesCampus) {
          return false;
        }
      }

      // Action type filter
      if (selectedActionType !== 'all' && par.actionType !== selectedActionType) {
        return false;
      }

      // Location filter
      if (selectedLocation !== 'all' && par.location !== selectedLocation) {
        return false;
      }

      // Campus filter
      if (selectedCampus !== 'all' && par.campus !== selectedCampus) {
        return false;
      }

      // Stage filter (from KPI cards)
      if (selectedStageFilter !== 'all' && par.currentStage !== selectedStageFilter) {
        return false;
      }

      // Action queue filter
      if (filterActionQueue) {
        if (currentPersona.isNotificationOnly) {
          const isHouston = (currentPersona.region || '').includes('Houston') || currentPersona.role.includes('Houston');
          if (isHouston && par.location !== 'Houston') return false;
          if (!isHouston && par.location === 'Houston') return false;
        } else if (!canPersonaActOnPar(currentPersona, par)) {
          return false;
        }
      }

      return true;
    });
  }, [pars, searchQuery, selectedActionType, selectedLocation, selectedStageFilter, filterActionQueue, currentPersona]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-['Inter',sans-serif]">
      
      {/* Top Navbar with Persona Switcher */}
      <Navbar
        currentPersona={currentPersona}
        onSelectPersona={setCurrentPersona}
        onOpenNewParModal={() => setIsNewParModalOpen(true)}
        onOpenWorkflowModal={() => setIsWorkflowModalOpen(true)}
        onOpenAdminModal={() => setIsWorkflowAdminOpen(true)}
        availablePersonas={availablePersonas}
        onResetData={handleResetData}
        pars={pars}
        filterActionQueue={filterActionQueue}
        onToggleActionQueue={() => setFilterActionQueue(!filterActionQueue)}
        districtLogo={getNormalizedLogoUrl(workflowConfig.districtLogo)}
        districtName={workflowConfig.districtName}
        onOpenAccountModal={() => handleOpenAccountCreation()}
        onOpenRoleManagerModal={() => setIsRoleManagerOpen(true)}
        onOpenPayoutModal={() => setIsPayoutModalOpen(true)}
        pendingPayoutsCount={pendingPayoutsCount}
        activeHubTab={activeHubTab}
        onSelectHubTab={setActiveHubTab}
      />

      {/* Floating Notification Toast */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 animate-bounce no-print">
          <div className={`flex items-center space-x-2 px-4 py-3 rounded-2xl shadow-xl text-xs font-bold text-white ${
            toastMessage.type === 'success' ? 'bg-emerald-600 shadow-emerald-600/30' :
            toastMessage.type === 'warning' ? 'bg-amber-600 shadow-amber-600/30' :
            'bg-[#0f2352] shadow-[#0f2352]/30'
          }`}>
            {toastMessage.type === 'success' && <CheckCircle className="w-4 h-4" />}
            {toastMessage.type === 'warning' && <AlertCircle className="w-4 h-4" />}
            {toastMessage.type === 'info' && <Info className="w-4 h-4" />}
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Persona Context Banner */}
        <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-[#0f2352] to-[#1e3a8a] text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 no-print">
          <div className="flex items-center space-x-3.5">
            <img 
              src={currentPersona.avatar} 
              alt={currentPersona.name} 
              className="w-12 h-12 rounded-full object-cover border-2 border-amber-300 shadow-md shrink-0 ring-2 ring-white/20" 
            />
            <div>
              <div className="flex items-center space-x-2 flex-wrap">
                <span className="text-xs uppercase font-bold tracking-wider text-blue-200">Active SST Persona:</span>
                {isChiefPeopleOfficer(currentPersona) ? (
                  <span className="text-xs font-black bg-amber-400/20 text-amber-300 px-2.5 py-0.5 rounded-lg border border-amber-400/40 flex items-center space-x-1.5 shadow-xs">
                    <span>👑 Super Admin:</span>
                    <strong className="text-white">{currentPersona.name}</strong>
                    <span>•</span>
                    <span>{currentPersona.role}</span>
                  </span>
                ) : currentPersona.isNotificationOnly ? (
                  <span className="text-xs font-black bg-purple-500/30 px-2.5 py-0.5 rounded-lg text-purple-200 border border-purple-400/40 flex items-center space-x-1.5">
                    <span>📢 Notification Only (FYI):</span>
                    <span>{currentPersona.name}</span>
                    <span>•</span>
                    <span>{currentPersona.role}</span>
                  </span>
                ) : (
                  <span className="text-xs font-black bg-blue-500/30 px-2.5 py-0.5 rounded-lg text-white border border-blue-400/30 flex items-center space-x-1.5">
                    <span>🔒 Scoped Approver:</span>
                    <span>{currentPersona.name}</span>
                    <span>•</span>
                    <span>{currentPersona.role}</span>
                  </span>
                )}
                <span className="text-[10px] text-blue-300 hidden md:inline">({currentPersona.email})</span>
              </div>
              <p className="text-xs text-slate-200 mt-0.5">
                School of Science and Technology • Simulating <strong className="text-white">{currentPersona.department}</strong>. 
                {isChiefPeopleOfficer(currentPersona) 
                  ? ' Full administrative privileges: adding/removing roles, workflow routing, and executive approval.'
                  : currentPersona.isNotificationOnly
                    ? ' Department notification recipient (No action or signature required). Reviewing district notifications & asset/vacancy tracking.'
                    : ' Permissions scoped strictly to your designated department and workflow stage sign-offs.'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {isChiefPeopleOfficer(currentPersona) ? (
              <>
                <button
                  onClick={() => setActiveHubTab('payouts')}
                  className={`text-xs font-black px-3.5 py-2 rounded-xl transition-all border flex items-center space-x-1.5 ${
                    activeHubTab === 'payouts'
                      ? 'bg-rose-600 text-white border-rose-500 shadow-md'
                      : 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border-rose-400/40'
                  }`}
                  title="Open CPO Payout & Deduction Approval Studio"
                >
                  <DollarSign className="w-3.5 h-3.5 text-rose-300" />
                  <span>CPO Payouts</span>
                  {pendingPayoutsCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white">
                      {pendingPayoutsCount}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setActiveHubTab('directory')}
                  className={`text-xs font-bold px-3.5 py-2 rounded-xl transition-all border flex items-center space-x-1.5 ${
                    activeHubTab === 'directory'
                      ? 'bg-blue-600 text-white border-blue-500 shadow-md'
                      : 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 border-blue-400/30'
                  }`}
                  title="Manage and remove roles from the SST directory (CPO Admin)"
                >
                  <Trash2 className="w-3.5 h-3.5 text-blue-200" />
                  <span>Manage / Remove Roles</span>
                </button>
                <button
                  onClick={() => setIsWorkflowAdminOpen(true)}
                  className="text-xs font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 px-3.5 py-2 rounded-xl transition-colors border border-amber-400/30 flex items-center space-x-1.5"
                >
                  <span>⚙️ Workflow Admin</span>
                </button>
              </>
            ) : isRegionalHrCoordinator(currentPersona) ? (
              <>
                <button
                  onClick={() => setActiveHubTab('payouts')}
                  className={`text-xs font-bold px-3.5 py-2 rounded-xl transition-all border flex items-center space-x-1.5 ${
                    activeHubTab === 'payouts'
                      ? 'bg-emerald-600 text-white border-emerald-500 shadow-md'
                      : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border-emerald-400/40'
                  }`}
                  title="Request staff payment or payroll deduction for upcoming cut-off"
                >
                  <DollarSign className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Request Staff Payout / Deduction</span>
                </button>
                <button
                  onClick={() => setActiveHubTab('directory')}
                  className={`text-xs font-medium px-3.5 py-2 rounded-xl transition-all border flex items-center space-x-1.5 ${
                    activeHubTab === 'directory'
                      ? 'bg-white text-[#0f2352] font-bold border-white'
                      : 'bg-white/10 hover:bg-white/20 text-white border-white/20'
                  }`}
                  title="View the SST approver directory"
                >
                  <Users className="w-3.5 h-3.5 text-blue-200" />
                  <span>SST Directory</span>
                </button>
              </>
            ) : (
              <button
                onClick={() => setActiveHubTab('directory')}
                className={`text-xs font-medium px-3.5 py-2 rounded-xl transition-all border flex items-center space-x-1.5 ${
                  activeHubTab === 'directory'
                    ? 'bg-white text-[#0f2352] font-bold border-white'
                    : 'bg-white/10 hover:bg-white/20 text-white border-white/20'
                }`}
                title="View the SST approver directory"
              >
                <Users className="w-3.5 h-3.5 text-blue-200" />
                <span>SST Directory</span>
              </button>
            )}
            <button
              onClick={() => setActiveHubTab('workflow')}
              className={`text-xs font-bold px-3.5 py-2 rounded-xl transition-all border ${
                activeHubTab === 'workflow'
                  ? 'bg-white text-[#0f2352] border-white shadow-md'
                  : 'bg-white/10 hover:bg-white/20 text-white border-white/20'
              }`}
            >
              SST Routing Rules
            </button>
          </div>
        </div>

        {/* Unified Hub Primary Tab Navigation */}
        <div className="mb-6 bg-white p-2 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between gap-2 overflow-x-auto no-print">
          <div className="flex items-center space-x-2 shrink-0">
            {/* Tab 1: Personnel Action Requests */}
            <button
              onClick={() => setActiveHubTab('pars')}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeHubTab === 'pars'
                  ? 'bg-[#0f2352] text-white shadow-md shadow-[#0f2352]/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Personnel Action Requests (PAR Tracker)</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                activeHubTab === 'pars' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {pars.length}
              </span>
            </button>

            {/* Tab 2: CPO Payout & Deduction Approvals */}
            <button
              onClick={() => setActiveHubTab('payouts')}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all relative ${
                activeHubTab === 'payouts'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <DollarSign className="w-4 h-4" />
              <span>CPO Payout & Deduction Approvals</span>
              {pendingPayoutsCount > 0 ? (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black animate-pulse ${
                  activeHubTab === 'payouts' ? 'bg-white text-rose-700' : 'bg-rose-500 text-white'
                }`}>
                  {pendingPayoutsCount} Pending CPO
                </span>
              ) : (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                  activeHubTab === 'payouts' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  {payouts.length}
                </span>
              )}
            </button>

            {/* Tab 3: District Approvers Directory */}
            <button
              onClick={() => setActiveHubTab('directory')}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeHubTab === 'directory'
                  ? 'bg-[#0f2352] text-white shadow-md shadow-[#0f2352]/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>District Approver Directory</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                activeHubTab === 'directory' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {availablePersonas.length}
              </span>
            </button>

            {/* Tab 4: Approval Routing Rules Engine */}
            <button
              onClick={() => setActiveHubTab('workflow')}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeHubTab === 'workflow'
                  ? 'bg-[#0f2352] text-white shadow-md shadow-[#0f2352]/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <span>⚙️ Routing Rules Engine</span>
            </button>
          </div>

          <div className="hidden lg:flex items-center space-x-2 text-xs text-slate-500 pr-2 shrink-0">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
            <span className="font-semibold text-slate-700">Unified Hub Portal</span>
          </div>
        </div>

        {/* View Component: Filtered by Active Hub Tab */}
        {activeHubTab === 'pars' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Real-time KPI Stats Cards */}
            <DashboardStats
              pars={pars}
              selectedStageFilter={selectedStageFilter}
              onSelectStageFilter={setSelectedStageFilter}
            />

            {/* Search & Location Filters */}
            <ParFilters
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              selectedActionType={selectedActionType}
              onActionTypeChange={setSelectedActionType}
              selectedLocation={selectedLocation}
              onLocationChange={setSelectedLocation}
              selectedCampus={selectedCampus}
              onCampusChange={setSelectedCampus}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              totalFilteredCount={filteredPars.length}
              totalCount={pars.length}
              onResetFilters={() => {
                setSearchQuery('');
                setSelectedActionType('all');
                setSelectedLocation('all');
                setSelectedCampus('all');
                setSelectedStageFilter('all');
                setFilterActionQueue(false);
              }}
            />

            {/* View Component: Table or Kanban Pipeline */}
            {viewMode === 'table' ? (
              <ParTable
                pars={filteredPars}
                currentPersona={currentPersona}
                onSelectPar={(par) => setSelectedPar(par)}
                onOpenNewParModal={() => setIsNewParModalOpen(true)}
                onDeletePar={handleDeletePar}
              />
            ) : (
              <ParKanban
                pars={filteredPars}
                currentPersona={currentPersona}
                onSelectPar={(par) => setSelectedPar(par)}
                onDeletePar={handleDeletePar}
              />
            )}
          </div>
        )}

        {activeHubTab === 'payouts' && (
          <div className="animate-fadeIn">
            <CpoPayoutModal
              embedded={true}
              currentPersona={currentPersona}
              payouts={payouts}
              onSavePayouts={setPayouts}
              onToast={showToast}
              districtLogo={workflowConfig.districtLogo}
              districtName={workflowConfig.districtName}
            />
          </div>
        )}

        {activeHubTab === 'directory' && (
          <div className="animate-fadeIn">
            <RoleManagerModal
              embedded={true}
              availablePersonas={availablePersonas}
              workflowConfig={workflowConfig}
              currentPersona={currentPersona}
              onSelectPersona={setCurrentPersona}
              onDeleteRole={handleDeleteRole}
              onDeactivateAccount={handleDeactivateRoleAccount}
              onOpenAccountModal={handleOpenAccountCreation}
              onSendActivationEmail={(role) => setActivationEmailTarget(role)}
              onUpdateRolePhoto={handleUpdateRolePhoto}
            />
          </div>
        )}

        {activeHubTab === 'workflow' && (
          <div className="animate-fadeIn">
            <WorkflowDiagramModal
              embedded={true}
              onOpenAdminRules={() => setIsWorkflowAdminOpen(true)}
            />
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-400 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-700">School of Science and Technology</span>
            <span>• People Operations & HR Hub (PARs • CPO Payouts • Directory • Workflow)</span>
          </div>
          <div className="text-[11px] text-slate-400">Charter District Electronic Signature Compliant</div>
        </div>
      </footer>

      {/* Detail Modal (Exact Form View) */}
      {selectedPar && (
        <ParDetailModal
          par={selectedPar}
          currentPersona={currentPersona}
          onClose={() => setSelectedPar(null)}
          onApprovePar={handleApprovePar}
          onRejectPar={handleRejectPar}
          onRequestRevisionPar={handleRequestRevisionPar}
          onAddComment={handleAddComment}
          onDeletePar={handleDeletePar}
          onUpdatePar={handleUpdatePar}
          onSwitchPersona={setCurrentPersona}
          availablePersonas={availablePersonas}
        />
      )}

      {/* New Request Modal */}
      {isNewParModalOpen && (
        <ParFormModal
          currentPersona={currentPersona}
          onClose={() => setIsNewParModalOpen(false)}
          onSubmitPar={handleSubmitNewPar}
          workflowConfig={workflowConfig}
        />
      )}

      {/* Routing Diagram Guide Modal */}
      {isWorkflowModalOpen && (
        <WorkflowDiagramModal
          onClose={() => setIsWorkflowModalOpen(false)}
          onOpenAdminRules={() => setIsWorkflowAdminOpen(true)}
        />
      )}

      {/* Workflow Admin Tool Modal */}
      {isWorkflowAdminOpen && (
        <WorkflowAdminModal
          config={workflowConfig}
          currentPersona={currentPersona}
          onClose={() => setIsWorkflowAdminOpen(false)}
          onSaveConfig={handleSaveWorkflowConfig}
          onResetConfig={handleResetWorkflowConfig}
          onActivateApproverAccount={handleOpenAccountCreation}
          onSendActivationEmail={(appr) => setActivationEmailTarget(appr)}
        />
      )}

      {/* Approver Account Creation / Self-Onboarding Modal */}
      {isAccountModalOpen && (
        <AccountCreationModal
          workflowConfig={workflowConfig}
          currentPersona={currentPersona}
          initialRole={targetAccountRole || undefined}
          isActivationFlow={isActivationFlow}
          onClose={() => {
            setIsAccountModalOpen(false);
            setTargetAccountRole(null);
            setIsActivationFlow(false);
          }}
          onAccountCreated={handleAccountCreated}
          onDeleteRole={handleDeleteRole}
          onDeactivateAccount={handleDeactivateRoleAccount}
          onSendActivationEmail={(appr) => {
            setIsAccountModalOpen(false);
            setTargetAccountRole(null);
            setIsActivationFlow(false);
            setActivationEmailTarget(appr);
          }}
        />
      )}

      {/* Role Directory & Removal Manager Modal */}
      {isRoleManagerOpen && (
        <RoleManagerModal
          availablePersonas={availablePersonas}
          workflowConfig={workflowConfig}
          currentPersona={currentPersona}
          onSelectPersona={setCurrentPersona}
          onDeleteRole={handleDeleteRole}
          onDeactivateAccount={handleDeactivateRoleAccount}
          onUpdateRolePhoto={handleUpdateRolePhoto}
          onSendActivationEmail={(role) => setActivationEmailTarget(role)}
          onOpenAccountModal={(role) => {
            setIsRoleManagerOpen(false);
            handleOpenAccountCreation(role);
          }}
          onClose={() => setIsRoleManagerOpen(false)}
        />
      )}

      {/* Activation Email Invitation Modal */}
      {activationEmailTarget && (
        <ActivationEmailModal
          role={activationEmailTarget}
          hrNotificationEmail={workflowConfig.hrNotificationEmail}
          emailWebhookUrl={workflowConfig.emailWebhookUrl}
          onClose={() => setActivationEmailTarget(null)}
          onOpenActivationPortal={(role) => {
            setActivationEmailTarget(null);
            if ('title' in role) {
              setTargetAccountRole(role as ApproverRoleConfig);
            } else {
              const matched = workflowConfig.approvers.find((a) => a.id === role.id);
              if (matched) {
                setTargetAccountRole(matched);
              } else {
                setTargetAccountRole({
                  id: role.id,
                  name: role.name,
                  title: role.role,
                  roleKey: 'custom',
                  email: role.email,
                  department: role.department,
                  campus: role.campus,
                  region: role.region || 'All SST Campuses',
                  avatar: role.avatar,
                  signerId: role.signerId,
                  ipAddress: role.ipAddress,
                  isAccountActivated: role.isAccountActivated,
                  signingPin: role.signingPin,
                  signatureImage: role.signatureImage
                });
              }
            }
            setIsActivationFlow(true);
            setIsAccountModalOpen(true);
          }}
        />
      )}

      {/* CPO Payout & Deduction Approval Modal */}
      <CpoPayoutModal
        isOpen={isPayoutModalOpen}
        onClose={() => setIsPayoutModalOpen(false)}
        currentPersona={currentPersona}
        payouts={payouts}
        onSavePayouts={(updated) => setPayouts(updated)}
        onToast={showToast}
        districtLogo={getNormalizedLogoUrl(workflowConfig.districtLogo)}
        districtName={workflowConfig.districtName}
      />

    </div>
  );
}
export default App;
