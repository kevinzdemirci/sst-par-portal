import React, { useState, useRef, useEffect } from 'react';
import { 
  WorkflowConfig, 
  ApproverRoleConfig, 
  UserPersona, 
  WorkflowStage 
} from '../types/par';
import { 
  X, 
  UserCheck, 
  PenTool, 
  RotateCcw, 
  Upload, 
  Check, 
  Lock, 
  CheckCircle2,
  Trash2
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface AccountCreationModalProps {
  workflowConfig: WorkflowConfig;
  initialRole?: ApproverRoleConfig | null;
  onClose: () => void;
  onAccountCreated: (newPersona: UserPersona, updatedApprover: ApproverRoleConfig) => void;
  onDeleteRole?: (roleId: string) => void;
  onDeactivateAccount?: (roleId: string) => void;
}

const PRESET_AVATARS = [
  { label: 'Executive 1 (Suit)', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&auto=format&fit=crop&q=80' },
  { label: 'Executive 2 (Blazer)', url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=160&auto=format&fit=crop&q=80' },
  { label: 'Executive 3 (Leader)', url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=160&auto=format&fit=crop&q=80' },
  { label: 'Executive 4 (Professional)', url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=160&auto=format&fit=crop&q=80' },
  { label: 'Executive 5 (Modern)', url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=160&auto=format&fit=crop&q=80' },
  { label: 'Executive 6 (Formal)', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&auto=format&fit=crop&q=80' },
  { label: 'SST Seal Monogram', url: '/sst-logo.jpg' }
];

export const AccountCreationModal: React.FC<AccountCreationModalProps> = ({
  workflowConfig,
  initialRole,
  onClose,
  onAccountCreated,
  onDeleteRole,
  onDeactivateAccount
}) => {
  // Determine initial role
  const defaultRole = initialRole || workflowConfig.approvers[0];
  const [selectedRoleId, setSelectedRoleId] = useState<string>(defaultRole?.id || 'new-custom');
  const activeSelectedApprover = workflowConfig.approvers.find(a => a.id === selectedRoleId);

  // Profile Information
  const [name, setName] = useState<string>(defaultRole?.name || '');
  const [email, setEmail] = useState<string>(defaultRole?.email || '');
  const [title, setTitle] = useState<string>(defaultRole?.title || '');
  const [department, setDepartment] = useState<string>(defaultRole?.department || 'Central Administration');
  const [campus, setCampus] = useState<string>(defaultRole?.campus || 'Central Office');
  const [region, setRegion] = useState<string>(defaultRole?.region || 'All SST Schools');
  const [avatar, setAvatar] = useState<string>(defaultRole?.avatar || PRESET_AVATARS[0].url);

  // Security & Signature
  const [securityPin, setSecurityPin] = useState<string>('123456');
  const [signatureMode, setSignatureMode] = useState<'typed' | 'drawn'>('typed');
  const [signatureStyle, setSignatureStyle] = useState<'classic' | 'modern' | 'formal'>('classic');
  const [drawnSignatureData, setDrawnSignatureData] = useState<string | null>(null);
  const [agreedToEsign, setAgreedToEsign] = useState<boolean>(true);

  // Canvas drawing state
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // When selected role changes, populate default suggestions
  const handleRoleSelect = (roleId: string) => {
    setSelectedRoleId(roleId);
    if (roleId === 'new-custom') {
      setTitle('');
      setDepartment('Central Administration');
      setRegion('All SST Campuses');
    } else {
      const role = workflowConfig.approvers.find(a => a.id === roleId);
      if (role) {
        setName(role.name);
        setEmail(role.email);
        setTitle(role.title);
        setDepartment(role.department);
        setCampus(role.campus || 'District Central Office');
        setRegion(role.region);
        setAvatar(role.avatar);
      }
    }
  };

  // Canvas drawing logic
  useEffect(() => {
    if (signatureMode === 'drawn' && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = '#0f2352';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
    }
  }, [signatureMode]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (canvasRef.current) {
      setDrawnSignatureData(canvasRef.current.toDataURL());
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setDrawnSignatureData(null);
  };

  // Avatar upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert('Selected image file is larger than 2MB. Please select a smaller photo.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      if (uploadEvent.target?.result) {
        setAvatar(uploadEvent.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const generateInitialsAvatar = () => {
    const safeName = name.trim() || 'Approver';
    const bgColors = ['0f2352', 'b91c1c', '1e3a8a', '047857', '7c3aed'];
    const randomBg = bgColors[Math.abs(safeName.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)) % bgColors.length];
    setAvatar(`https://ui-avatars.com/api/?name=${encodeURIComponent(safeName)}&background=${randomBg}&color=fff&size=160&bold=true`);
  };

  // Submit / Activate
  const handleActivateAccount = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      alert('Please enter your full name.');
      return;
    }
    if (!email.trim()) {
      alert('Please enter your official SST email.');
      return;
    }
    if (!agreedToEsign) {
      alert('Please agree to the Texas Uniform Electronic Transactions Act compliance disclosure.');
      return;
    }

    const matchedApprover = workflowConfig.approvers.find(a => a.id === selectedRoleId);
    const personaId = matchedApprover ? matchedApprover.id : `p-${Date.now().toString(36)}`;
    const signerId = matchedApprover?.signerId || crypto.randomUUID();
    const canReviewStages: WorkflowStage[] = matchedApprover?.canReviewStages || [
      'cpo_review', 
      'regional_review', 
      'hr_review', 
      'benefits_review', 
      'payroll_action'
    ];

    const newPersona: UserPersona = {
      id: personaId,
      name: name.trim(),
      role: title.trim() || 'Designated Approver',
      department: department.trim() || 'Administration',
      email: email.trim().toLowerCase(),
      campus: campus.trim() || 'Central Office',
      region: region.trim() || 'All SST Schools',
      avatar,
      canReviewStages,
      ipAddress: matchedApprover?.ipAddress || '208.184.164.228',
      signerId,
      signingPin: securityPin,
      signatureStyle,
      signatureImage: signatureMode === 'drawn' ? drawnSignatureData || undefined : undefined,
      isAccountActivated: true
    };

    const updatedApprover: ApproverRoleConfig = {
      id: personaId,
      roleKey: matchedApprover?.roleKey || 'custom',
      title: newPersona.role,
      name: newPersona.name,
      email: newPersona.email,
      department: newPersona.department,
      campus: newPersona.campus,
      region: newPersona.region || 'All SST Schools',
      signerId,
      ipAddress: newPersona.ipAddress,
      avatar,
      canReviewStages,
      signingPin: securityPin,
      signatureImage: newPersona.signatureImage,
      isAccountActivated: true
    };

    try {
      confetti({
        particleCount: 100,
        spread: 75,
        origin: { y: 0.6 }
      });
    } catch {
      // ignore
    }

    onAccountCreated(newPersona, updatedApprover);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/65 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 md:p-6 animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[94vh] flex flex-col overflow-hidden border border-slate-200">
        
        {/* Hidden File Input */}
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileUpload} 
          accept="image/*" 
          className="hidden" 
        />

        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-blue-900 via-[#0f2352] to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3.5">
            <div className="p-2 rounded-2xl bg-white/10 border border-white/20">
              <UserCheck className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold tracking-tight">
                  SST Approver Account Creation & Role Activation
                </h2>
                <span className="text-[10px] uppercase font-black tracking-wider px-2 py-0.5 rounded-full bg-amber-400 text-blue-950">
                  Self-Onboarding
                </span>
              </div>
              <p className="text-xs text-blue-100">
                Claim your assigned workflow role, configure your digital signature, and activate your approval account
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-blue-200 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleActivateAccount} className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-slate-700 bg-slate-50/60">
          
          {/* STEP 1: SELECT WORKFLOW ROLE */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-3">
            <div className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2 border-b border-slate-100 pb-2">
              <span className="w-5 h-5 rounded-full bg-[#0f2352] text-white flex items-center justify-center text-[10px]">1</span>
              <span>Select the Workflow Role You Are Claiming</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                  Designated Workflow Role:
                </label>
                <select
                  value={selectedRoleId}
                  onChange={(e) => handleRoleSelect(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-[#0f2352]/20"
                >
                  <optgroup label="Configured SST Workflow Roles">
                    {workflowConfig.approvers.map(a => (
                      <option key={a.id} value={a.id}>
                        {a.title} ({a.name}) — {a.region}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Other Options">
                    <option value="new-custom">+ Register a New Custom Workflow Role</option>
                  </optgroup>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                  Official Title:
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Chief People Officer / Regional Exec Director"
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-[#0f2352]/20"
                />
              </div>
            </div>
          </div>

          {/* STEP 2: PERSONAL IDENTITY & CONTACT */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-4">
            <div className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2 border-b border-slate-100 pb-2">
              <span className="w-5 h-5 rounded-full bg-[#0f2352] text-white flex items-center justify-center text-[10px]">2</span>
              <span>Approver Identity & Contact Details</span>
            </div>

            <div className="flex flex-col sm:flex-row gap-5 items-start">
              {/* Photo selector */}
              <div className="flex flex-col items-center space-y-2 shrink-0">
                <img 
                  src={avatar} 
                  alt={name} 
                  className="w-20 h-20 rounded-full object-cover border-2 border-slate-300 shadow-sm"
                />
                <div className="flex flex-col space-y-1 w-full text-center">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-2.5 py-1 text-[10px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center justify-center space-x-1"
                  >
                    <Upload className="w-3 h-3" />
                    <span>Upload Photo</span>
                  </button>
                  <button
                    type="button"
                    onClick={generateInitialsAvatar}
                    className="px-2.5 py-1 text-[10px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                  >
                    Initials Monogram
                  </button>
                </div>
              </div>

              {/* Input fields */}
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                    Your Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Dr. Kevin Demirci"
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-[#0f2352]/20"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                    Official SST Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="yourname@ssttx.org"
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-blue-800 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-[#0f2352]/20"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                    Department:
                  </label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="Central Administration"
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                    Assigned Region / Campus:
                  </label>
                  <input
                    type="text"
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    placeholder="Houston Area Campuses"
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800"
                  />
                </div>
              </div>
            </div>

            {/* Quick Presets for Avatars */}
            <div>
              <span className="text-[10px] text-slate-500 font-bold uppercase block mb-1.5">
                Or select an executive preset headshot:
              </span>
              <div className="flex flex-wrap gap-2">
                {PRESET_AVATARS.map((preset, i) => (
                  <button
                    type="button"
                    key={i}
                    onClick={() => setAvatar(preset.url)}
                    className={`p-1 rounded-full border-2 transition-all ${
                      avatar === preset.url ? 'border-[#0f2352] ring-2 ring-[#0f2352]/20 scale-105' : 'border-slate-200 hover:border-slate-300'
                    }`}
                    title={preset.label}
                  >
                    <img src={preset.url} alt={preset.label} className="w-8 h-8 rounded-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* STEP 3: SECURITY PIN & DIGITAL SIGNATURE */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-4">
            <div className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2 border-b border-slate-100 pb-2">
              <span className="w-5 h-5 rounded-full bg-[#0f2352] text-white flex items-center justify-center text-[10px]">3</span>
              <span>Digital Signature & Security PIN Setup</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1 flex items-center space-x-1">
                  <Lock className="w-3 h-3 text-amber-600" />
                  <span>Signing Passcode / PIN (4 - 6 digits) *</span>
                </label>
                <input
                  type="password"
                  required
                  maxLength={6}
                  value={securityPin}
                  onChange={(e) => setSecurityPin(e.target.value)}
                  placeholder="e.g. 123456"
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 font-mono tracking-widest font-bold focus:outline-none focus:ring-2 focus:ring-[#0f2352]/20"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Used to verify your identity when clicking "Sign & Endorse" on PARs.
                </p>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1 flex items-center space-x-1">
                  <PenTool className="w-3 h-3 text-blue-600" />
                  <span>Signature Mode:</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSignatureMode('typed')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                      signatureMode === 'typed'
                        ? 'bg-[#0f2352] text-white border-[#0f2352]'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    Script Font
                  </button>
                  <button
                    type="button"
                    onClick={() => setSignatureMode('drawn')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                      signatureMode === 'drawn'
                        ? 'bg-[#0f2352] text-white border-[#0f2352]'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    Draw Signature
                  </button>
                </div>
              </div>
            </div>

            {/* Signature Preview / Canvas */}
            {signatureMode === 'typed' ? (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">
                  Select Handwritten Cursive Style:
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setSignatureStyle('classic')}
                    className={`p-3 bg-white rounded-xl border text-center transition-all ${
                      signatureStyle === 'classic' ? 'border-blue-600 ring-2 ring-blue-500/20 shadow-xs' : 'border-slate-200'
                    }`}
                  >
                    <span className="font-serif italic text-base text-blue-900 block truncate">
                      {name || 'Your Signature'}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-1">Classic Executive</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSignatureStyle('modern')}
                    className={`p-3 bg-white rounded-xl border text-center transition-all ${
                      signatureStyle === 'modern' ? 'border-blue-600 ring-2 ring-blue-500/20 shadow-xs' : 'border-slate-200'
                    }`}
                  >
                    <span className="font-mono italic text-sm text-slate-800 font-bold block truncate">
                      /{name || 'Your Signature'}/
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-1">Digital Formal</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSignatureStyle('formal')}
                    className={`p-3 bg-white rounded-xl border text-center transition-all ${
                      signatureStyle === 'formal' ? 'border-blue-600 ring-2 ring-blue-500/20 shadow-xs' : 'border-slate-200'
                    }`}
                  >
                    <span className="font-sans font-bold uppercase tracking-wider text-xs text-[#0f2352] block truncate">
                      {name || 'Your Signature'}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-1">Charter Seal</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">
                    Draw your signature below using your mouse or trackpad:
                  </span>
                  <button
                    type="button"
                    onClick={clearCanvas}
                    className="text-[11px] font-bold text-rose-600 hover:underline flex items-center space-x-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Clear Pad</span>
                  </button>
                </div>
                <div className="bg-white border border-slate-300 rounded-xl overflow-hidden shadow-inner flex items-center justify-center">
                  <canvas
                    ref={canvasRef}
                    width={520}
                    height={100}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    className="w-full h-[100px] cursor-crosshair touch-none"
                  />
                </div>
              </div>
            )}

            {/* Legal compliance checkbox */}
            <div className="pt-2">
              <label className="flex items-start space-x-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  required
                  checked={agreedToEsign}
                  onChange={(e) => setAgreedToEsign(e.target.checked)}
                  className="mt-0.5 rounded text-[#0f2352] focus:ring-[#0f2352]"
                />
                <span className="text-[11px] text-slate-600 leading-relaxed">
                  I understand that by activating this role, my electronic signature carries the full legal authority of a handwritten signature in accordance with the <strong>Texas Uniform Electronic Transactions Act (Tex. Bus. & Com. Code § 322)</strong> and School of Science and Technology charter district policies.
                </span>
              </label>
            </div>
          </div>

          {/* PREVIEW CARD */}
          <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-4 flex items-center space-x-4">
            <img 
              src={avatar} 
              alt={name} 
              className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm shrink-0" 
            />
            <div className="flex-1 truncate">
              <div className="text-[10px] font-bold text-blue-900 uppercase">Account Preview</div>
              <div className="font-bold text-sm text-slate-900">{name || 'Your Full Name'}</div>
              <div className="text-xs text-blue-700 font-semibold">{title || 'Designated Role'} • {department}</div>
              <div className="text-[11px] text-slate-500 font-mono">{email || 'email@ssttx.org'}</div>
            </div>
            <div className="text-right shrink-0">
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2.5 py-1 rounded-full flex items-center space-x-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span>Ready to Activate</span>
              </span>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200">
            
            {/* Left-side role removal & e-sign deactivation options */}
            <div className="flex items-center space-x-2 self-start sm:self-auto">
              {activeSelectedApprover && onDeleteRole && (
                <button
                  type="button"
                  onClick={() => {
                    if (confirm(`Remove role "${activeSelectedApprover.name}" (${activeSelectedApprover.title}) from the workflow? Any routing rules assigned to this role will fallback to the primary approver.`)) {
                      onDeleteRole(activeSelectedApprover.id);
                      onClose();
                    }
                  }}
                  className="inline-flex items-center space-x-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs rounded-xl transition-colors"
                  title="Permanently remove this role from the workflow"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                  <span>Remove Role</span>
                </button>
              )}

              {activeSelectedApprover?.isAccountActivated && onDeactivateAccount && (
                <button
                  type="button"
                  onClick={() => {
                    if (confirm(`Deactivate digital signature profile for ${activeSelectedApprover.name}? The role remains in the workflow, but the electronic signature and PIN will be cleared.`)) {
                      onDeactivateAccount(activeSelectedApprover.id);
                      onClose();
                    }
                  }}
                  className="inline-flex items-center space-x-1.5 px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-bold text-xs rounded-xl transition-colors"
                  title="Reset electronic signature and PIN"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                  <span>Deactivate E-Signature</span>
                </button>
              )}
            </div>

            {/* Right-side Cancel & Submit buttons */}
            <div className="flex items-center space-x-3 self-end sm:self-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-bold text-xs rounded-xl transition-colors"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="inline-flex items-center space-x-2 px-6 py-2.5 bg-[#0f2352] hover:bg-[#1a3880] text-white font-black text-xs rounded-xl shadow-md shadow-[#0f2352]/20 transition-all active:scale-95"
              >
                <Check className="w-4 h-4" />
                <span>Complete Setup & Activate Role</span>
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
};
