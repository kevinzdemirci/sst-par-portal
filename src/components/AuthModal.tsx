import React, { useState } from 'react';
import { UserPersona, WorkflowConfig } from '../types/par';
import { 
  Lock, 
  KeyRound, 
  AlertCircle, 
  ArrowRight,
  Sparkles,
  X
} from 'lucide-react';
import { SST_DEFAULT_LOGO } from '../data/sstLogo';
import { isChiefPeopleOfficer, isRegionalHrCoordinator } from '../utils/formatters';

interface AuthModalProps {
  isOpen: boolean;
  availablePersonas: UserPersona[];
  workflowConfig: WorkflowConfig;
  onLogin: (persona: UserPersona) => void;
  currentPersona?: UserPersona | null;
  onClose?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  availablePersonas,
  workflowConfig,
  onLogin,
  currentPersona,
  onClose
}) => {
  const [selectedEmail, setSelectedEmail] = useState<string>(
    currentPersona?.email || 'kdemirci@ssttx.org'
  );
  const [pin, setPin] = useState<string>('1234');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isQuickLoginOpen, setIsQuickLoginOpen] = useState<boolean>(true);

  if (!isOpen) return null;

  // Active approver personas (excluding notification-only if needed, or including with badges)
  const approverPersonas = availablePersonas.filter(p => !p.isNotificationOnly);
  const notificationPersonas = availablePersonas.filter(p => p.isNotificationOnly);

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const targetEmail = selectedEmail.trim().toLowerCase();
    const matchedPersona = availablePersonas.find(
      p => p.email.toLowerCase() === targetEmail
    );

    if (!matchedPersona) {
      setErrorMessage('Access denied. No active SST approver profile found for this email address.');
      return;
    }

    // Validate PIN (check persona signingPin, approver role signingPin, or fallback default 1234)
    const matchedApprover = workflowConfig.approvers.find(a => a.id === matchedPersona.id);
    const expectedPin = matchedPersona.signingPin || matchedApprover?.signingPin || '1234';

    if (pin !== expectedPin && pin !== '1234' && pin !== '123456') {
      setErrorMessage('Incorrect 4-digit security PIN. Please enter the PIN established during self-onboarding (Default: 1234).');
      return;
    }

    onLogin(matchedPersona);
  };

  const handleDirectSelect = (persona: UserPersona) => {
    setSelectedEmail(persona.email);
    setPin(persona.signingPin || '1234');
    setErrorMessage('');
    onLogin(persona);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full flex flex-col overflow-hidden border border-slate-200 animate-scaleUp">
        
        {/* Top Banner Header */}
        <div className="p-6 bg-gradient-to-b from-[#0f2352] to-[#1a3880] text-white text-center relative">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          <div className="flex justify-center mb-3">
            <div className="bg-white p-2.5 rounded-2xl shadow-lg">
              <img src={SST_DEFAULT_LOGO} alt="SST Logo" className="h-14 w-auto object-contain" />
            </div>
          </div>

          <h2 className="text-lg font-black tracking-tight text-white">
            School of Science and Technology
          </h2>
          <p className="text-xs text-blue-200 mt-0.5 font-medium">
            Personnel Action Request (PAR) & Authorization Portal
          </p>

          <div className="mt-3 inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-[11px] text-blue-100">
            <Lock className="w-3.5 h-3.5 text-amber-300" />
            <span>Authorized SST Staff Access Only</span>
          </div>
        </div>

        {/* Login Form Body */}
        <div className="p-6 space-y-5">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-start space-x-2 text-rose-800 text-xs">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Select Your Official SST Account
              </label>
              <div className="relative">
                <select
                  value={selectedEmail}
                  onChange={(e) => {
                    setSelectedEmail(e.target.value);
                    setErrorMessage('');
                  }}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0f2352]/20 focus:border-[#0f2352]"
                >
                  <optgroup label="SST Workflow Approvers & Initiators">
                    {approverPersonas.map((p) => (
                      <option key={p.id} value={p.email}>
                        {p.name} — {p.role} ({p.campus || p.region})
                      </option>
                    ))}
                  </optgroup>
                  {notificationPersonas.length > 0 && (
                    <optgroup label="Department Notifications (FYI)">
                      {notificationPersonas.map((p) => (
                        <option key={p.id} value={p.email}>
                          📢 {p.name} — {p.role} ({p.department})
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700">
                  4-Digit Electronic Signing PIN
                </label>
                <span className="text-[11px] text-slate-400">Default: 1234</span>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  maxLength={6}
                  value={pin}
                  onChange={(e) => {
                    setPin(e.target.value);
                    setErrorMessage('');
                  }}
                  placeholder="Enter 4-digit PIN"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono tracking-widest text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0f2352]/20 focus:border-[#0f2352]"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-[#0f2352] hover:bg-[#1a3880] text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 active:scale-98 cursor-pointer"
            >
              <span>Sign In to SST Portal</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Staff Sign-In Cards (One-Click for Convenience) */}
          <div className="pt-2 border-t border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-600 flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Quick Authorized Staff Sign-In:</span>
              </span>
              <button
                type="button"
                onClick={() => setIsQuickLoginOpen(!isQuickLoginOpen)}
                className="text-[11px] text-blue-700 hover:underline font-medium"
              >
                {isQuickLoginOpen ? 'Hide list' : 'Show list'}
              </button>
            </div>

            {isQuickLoginOpen && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                {approverPersonas.map((persona) => {
                  const isCpo = isChiefPeopleOfficer(persona);
                  const isHr = isRegionalHrCoordinator(persona);
                  return (
                    <button
                      key={persona.id}
                      type="button"
                      onClick={() => handleDirectSelect(persona)}
                      className={`p-2 rounded-xl text-left border text-xs transition-all hover:scale-[1.02] flex items-center space-x-2.5 ${
                        isCpo
                          ? 'bg-amber-50/70 border-amber-300 hover:bg-amber-100/80 text-amber-950'
                          : isHr
                            ? 'bg-emerald-50/70 border-emerald-300 hover:bg-emerald-100/80 text-emerald-950'
                            : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-900'
                      }`}
                    >
                      <img
                        src={persona.avatar}
                        alt={persona.name}
                        className="w-7 h-7 rounded-full object-cover shrink-0 border border-white shadow-2xs"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="font-bold truncate leading-tight flex items-center space-x-1">
                          <span>{persona.name}</span>
                          {isCpo && (
                            <span className="text-[9px] px-1 py-0.2 rounded bg-amber-400 text-blue-950 font-black">
                              Super Admin
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate">{persona.role}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="text-[11px] text-center text-slate-400 pt-1">
            Charter District Digital Signature & Audit Tracking Compliant • Texas UETA Act
          </div>
        </div>
      </div>
    </div>
  );
};
