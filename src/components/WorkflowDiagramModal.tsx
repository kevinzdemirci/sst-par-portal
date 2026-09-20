import React from 'react';
import { X, ArrowRight, CheckCircle2, RotateCcw, AlertOctagon, ShieldCheck } from 'lucide-react';

interface WorkflowDiagramModalProps {
  onClose: () => void;
  onOpenAdminRules?: () => void;
}

export const WorkflowDiagramModal: React.FC<WorkflowDiagramModalProps> = ({ onClose, onOpenAdminRules }) => {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 md:p-6">
      <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/90 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img src="/sst-logo.jpg" alt="SST" className="h-10 w-auto object-contain" />
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                SST Multi-Department Approval Routing Engine
              </h2>
              <p className="text-xs text-slate-500">
                School of Science and Technology • Electronic Signature Architecture
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {onOpenAdminRules && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenAdminRules();
                }}
                className="px-3 py-1.5 bg-[#0f2352] hover:bg-[#1a3880] text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center space-x-1.5"
              >
                <span>⚙️ Edit Routing Rules</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-slate-700 leading-relaxed">
          
          {/* Overview Callout */}
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-[#0f2352]">
            <h4 className="font-bold text-sm mb-1">Electronic Signature & Department Routing Standard</h4>
            <p>
              Each time a Personnel Action Request (PAR) is submitted by a campus, the system logs a unique cryptographic 
              <strong> GTPUID</strong> transaction token and automatically queues the document for sequential review across 
              Campus Leadership, Central Administration, Human Resources, Benefits, and Payroll.
            </p>
          </div>

          {/* Workflow 1: Termination & Separation Routing */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-3">
            <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
              <span className="p-1.5 rounded-lg bg-rose-50 text-rose-700">🚪</span>
              <span>1. Separation / Termination PAR Routing Rules</span>
            </h3>
            <p className="text-slate-500 text-[11px]">
              SST implements automated branching based on termination classification (Involuntary vs. Voluntary) and geographic campus region:
            </p>

            {/* Branch A: Involuntary Terminations */}
            <div className="p-3 rounded-xl bg-purple-50/60 border border-purple-200 text-xs">
              <div className="font-bold text-purple-900 mb-1 flex items-center justify-between">
                <span>Branch A: Involuntary Terminations (Employee Terminated by SST)</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-purple-200/80 text-purple-900 font-black uppercase">
                  CPO Review
                </span>
              </div>
              <p className="text-[11px] text-purple-800 mb-2">
                All involuntary terminations across all Texas campuses must be approved by the Chief People Officer:
              </p>
              <div className="flex flex-col sm:flex-row items-center gap-1.5 text-xs">
                <div className="flex-1 text-center p-2 rounded-lg bg-white border border-purple-200 shadow-2xs">
                  <div className="font-bold text-slate-900">1. Supervisor</div>
                  <div className="text-[10px] text-blue-700">Vanessa Nguyen</div>
                  <div className="text-[9px] text-slate-400">Campus Endorsement</div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                <div className="flex-1 text-center p-2 rounded-lg bg-purple-600 text-white shadow-2xs">
                  <div className="font-bold">2. Chief People Officer</div>
                  <div className="text-[10px] text-purple-100">Dr. Kevin Demirci</div>
                  <div className="text-[9px] text-purple-200">kdemirci@ssttx.org</div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                <div className="flex-1 text-center p-2 rounded-lg bg-white border border-purple-200 shadow-2xs">
                  <div className="font-bold text-slate-900">3. Regional HR</div>
                  <div className="text-[10px] text-blue-700">K. Stewart / A. Johnson</div>
                  <div className="text-[9px] text-slate-400">Houston vs SA & CC</div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                <div className="flex-1 text-center p-2 rounded-lg bg-white border border-purple-200 shadow-2xs">
                  <div className="font-bold text-slate-900">4. Benefits</div>
                  <div className="text-[10px] text-teal-700">Ursula Villanueva</div>
                  <div className="text-[9px] text-slate-400">uvillanueva@ssttx.org</div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                <div className="flex-1 text-center p-2 rounded-lg bg-white border border-purple-200 shadow-2xs">
                  <div className="font-bold text-slate-900">5. Payroll</div>
                  <div className="text-[10px] text-indigo-700">Paola Comparini</div>
                  <div className="text-[9px] text-slate-400">pcomparini@ssttx.org</div>
                </div>
              </div>
            </div>

            {/* Branch B: Voluntary Terminations */}
            <div className="p-3 rounded-xl bg-orange-50/60 border border-orange-200 text-xs">
              <div className="font-bold text-orange-950 mb-1 flex items-center justify-between">
                <span>Branch B: Voluntary Terminations (Resignations)</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-orange-200/80 text-orange-950 font-black uppercase">
                  Regional Exec Review
                </span>
              </div>
              <p className="text-[11px] text-orange-800 mb-2">
                Voluntary resignations are routed directly to the Regional Executive Directors by geographic zone:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
                <div className="p-2 bg-white rounded-lg border border-orange-200">
                  <div className="font-bold text-slate-900 text-[11px]">Houston Area Campuses:</div>
                  <div className="text-blue-800 font-bold">Atnan Ekin</div>
                  <div className="text-[10px] text-slate-500 font-mono">aekin@ssttx.org</div>
                </div>
                <div className="p-2 bg-white rounded-lg border border-orange-200">
                  <div className="font-bold text-slate-900 text-[11px]">San Antonio & Corpus Christi Campuses:</div>
                  <div className="text-blue-800 font-bold">Serdar Bulut</div>
                  <div className="text-[10px] text-slate-500 font-mono">sbulut@ssttx.org</div>
                </div>
              </div>
            </div>

            {/* Branch C: Regional HR Coordination */}
            <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-200 text-xs">
              <div className="font-bold text-blue-950 mb-1 flex items-center justify-between">
                <span>Regional Human Resources Routing Rule</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-blue-200/80 text-blue-950 font-black uppercase">
                  Regional HR
                </span>
              </div>
              <p className="text-[11px] text-blue-800 mb-2">
                HR Policy, Rehire status, DPS SID#, and PTO audit are assigned by regional coordinator:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="p-2 bg-white rounded-lg border border-blue-200">
                  <div className="font-bold text-slate-900 text-[11px]">Houston Regional HR Coordinator:</div>
                  <div className="text-blue-800 font-bold">Kristy Stewart</div>
                  <div className="text-[10px] text-slate-500 font-mono">kstewart@ssttx.org</div>
                </div>
                <div className="p-2 bg-white rounded-lg border border-blue-200">
                  <div className="font-bold text-slate-900 text-[11px]">San Antonio & CC Regional HR Coordinator:</div>
                  <div className="text-blue-800 font-bold">Amber Johnson</div>
                  <div className="text-[10px] text-slate-500 font-mono">ajohnson@ssttx.org</div>
                </div>
              </div>
            </div>
          </div>

          {/* Workflow 2: Role Change, Transfer & Compensation */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
            <h3 className="font-bold text-slate-900 text-sm mb-1.5 flex items-center space-x-2">
              <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700">💰</span>
              <span>2. Campus Transfer, Role Modification & Stipend Adjustments</span>
            </h3>
            <p className="text-slate-500 mb-3 text-[11px]">
              Requires campus leadership sign-off, Chief People Officer headcount approval, and Regional HR contract & salary banding:
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-1.5 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
              <div className="flex-1 text-center p-2 rounded-lg bg-white border border-slate-200 shadow-2xs">
                <div className="font-bold text-slate-900">1. Initiating Principal</div>
                <div className="text-[10px] text-slate-500">Campus Endorsement</div>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              <div className="flex-1 text-center p-2 rounded-lg bg-purple-50 border border-purple-200 text-purple-900 shadow-2xs">
                <div className="font-bold">2. Chief People Officer</div>
                <div className="text-[10px] text-purple-700">Dr. Kevin Demirci</div>
                <div className="text-[9px] text-purple-500">kdemirci@ssttx.org</div>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              <div className="flex-1 text-center p-2 rounded-lg bg-blue-50 border border-blue-200 text-blue-900 shadow-2xs">
                <div className="font-bold">3. Regional HR</div>
                <div className="text-[10px] text-blue-700">K. Stewart / A. Johnson</div>
                <div className="text-[9px] text-blue-500">Contract & Salary Band</div>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              <div className="flex-1 text-center p-2 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-900 shadow-2xs">
                <div className="font-bold">4. Payroll</div>
                <div className="text-[10px] text-indigo-700">Paola Comparini</div>
                <div className="text-[9px] text-indigo-500">pcomparini@ssttx.org</div>
              </div>
            </div>
          </div>

          {/* Digital Signature Security */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
            <h4 className="font-bold text-slate-900 mb-2 text-xs uppercase tracking-wider flex items-center space-x-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Electronic Signature Compliance Record</span>
            </h4>
            <p className="text-[11px] text-slate-600 mb-3">
              Every endorsement records the reviewer’s verified Signer ID, IP Address, UTC timestamp, and email verification 
              conforming to Page 4 of the official SST Personnel Action Request document.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                <div className="font-bold text-emerald-800 flex items-center space-x-1 mb-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Approve & Sign</span>
                </div>
                <p className="text-[10px] text-slate-500">Stamps digital signature and forwards to next department.</p>
              </div>

              <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                <div className="font-bold text-orange-800 flex items-center space-x-1 mb-0.5">
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Return for Revision</span>
                </div>
                <p className="text-[10px] text-slate-500">Sends form back to campus initiator for corrections.</p>
              </div>

              <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                <div className="font-bold text-rose-800 flex items-center space-x-1 mb-0.5">
                  <AlertOctagon className="w-3.5 h-3.5" />
                  <span>Reject Request</span>
                </div>
                <p className="text-[10px] text-slate-500">Declines action permanently with required explanation.</p>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#0f2352] hover:bg-[#1a3880] text-white text-xs font-bold rounded-xl transition-colors"
          >
            Close Routing Guide
          </button>
        </div>

      </div>
    </div>
  );
};
