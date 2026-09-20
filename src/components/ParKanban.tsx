import React from 'react';
import { PersonnelActionRequest, UserPersona, WorkflowStage } from '../types/par';
import { 
  getActionTypeInfo, 
  getPriorityBadge, 
  formatDate, 
  formatCurrency, 
  canPersonaActOnPar 
} from '../utils/formatters';
import { 
  GraduationCap, 
  Award, 
  Users, 
  ShieldCheck, 
  HeartHandshake, 
  CheckCircle2, 
  ChevronRight, 
  AlertCircle,
  Trash2 
} from 'lucide-react';

interface ParKanbanProps {
  pars: PersonnelActionRequest[];
  currentPersona: UserPersona;
  onSelectPar: (par: PersonnelActionRequest) => void;
  onDeletePar?: (parId: string) => void;
}

export const ParKanban: React.FC<ParKanbanProps> = ({
  pars,
  currentPersona,
  onSelectPar,
  onDeletePar
}) => {
  const columns: {
    stage: WorkflowStage;
    title: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    accentColor: string;
    bgHeader: string;
  }[] = [
    {
      stage: 'supervisor_review',
      title: 'Supervisor / Principal',
      description: 'Campus Endorsement',
      icon: GraduationCap,
      accentColor: 'border-amber-400 text-amber-700',
      bgHeader: 'bg-amber-50/75'
    },
    {
      stage: 'regional_review',
      title: 'Regional Execs',
      description: 'A. Ekin & S. Bulut (Voluntary)',
      icon: Users,
      accentColor: 'border-orange-400 text-orange-700',
      bgHeader: 'bg-orange-50/75'
    },
    {
      stage: 'cpo_review',
      title: 'Chief People Officer',
      description: 'Dr. Kevin Demirci (Involuntary)',
      icon: Award,
      accentColor: 'border-purple-400 text-purple-700',
      bgHeader: 'bg-purple-50/75'
    },
    {
      stage: 'hr_review',
      title: 'HR Policy & PTO',
      description: 'Kristy Stewart (Director)',
      icon: ShieldCheck,
      accentColor: 'border-blue-400 text-blue-700',
      bgHeader: 'bg-blue-50/75'
    },
    {
      stage: 'benefits_review',
      title: 'Benefits & Leave',
      description: 'Ursula Villanueva',
      icon: HeartHandshake,
      accentColor: 'border-teal-400 text-teal-700',
      bgHeader: 'bg-teal-50/75'
    },
    {
      stage: 'payroll_action',
      title: 'Payroll ADP Action',
      description: 'Rachel Ortiz (ADP Closeout)',
      icon: CheckCircle2,
      accentColor: 'border-indigo-400 text-indigo-700',
      bgHeader: 'bg-indigo-50/75'
    }
  ];

  const flaggedPars = pars.filter(p => p.currentStage === 'revision_requested' || p.currentStage === 'rejected');

  const renderCardDetails = (par: PersonnelActionRequest) => {
    if (par.actionType === 'termination') {
      return (
        <div className="bg-rose-50/60 rounded-lg p-2 text-xs border border-rose-100 mb-2.5">
          <div className="font-bold text-rose-900">
            {par.isVoluntary ? 'Voluntary Resignation' : 'Involuntary Termination'}
          </div>
          <div className="text-[11px] text-rose-700">
            {par.terminationCode || 'Reason'}: Last Day {formatDate(par.lastDayWorked)}
          </div>
        </div>
      );
    }

    if (par.actionType === 'campus_transfer') {
      return (
        <div className="bg-amber-50/60 rounded-lg p-2 text-xs border border-amber-100 mb-2.5">
          <div className="font-bold text-amber-900">
            {par.campus} → {par.proposedCampus}
          </div>
          <div className="text-[11px] text-amber-700 truncate">
            {par.proposedTitle || par.title}
          </div>
        </div>
      );
    }

    if (par.actionType === 'salary_change') {
      return (
        <div className="bg-emerald-50/60 rounded-lg p-2 text-xs border border-emerald-100 mb-2.5">
          <div className="font-semibold text-emerald-900 flex justify-between">
            <span>New: {formatCurrency(par.proposedSalary)}</span>
            <span className="font-bold">+{par.percentIncrease?.toFixed(1)}%</span>
          </div>
          <div className="text-[11px] text-emerald-700">{par.salaryChangeReason}</div>
        </div>
      );
    }

    if (par.actionType === 'promotion') {
      return (
        <div className="bg-purple-50/60 rounded-lg p-2 text-xs border border-purple-100 mb-2.5">
          <div className="font-semibold text-purple-900 truncate">
            {par.proposedTitle}
          </div>
          <div className="text-[11px] text-purple-700">
            {formatCurrency(par.proposedSalary)} (+{par.percentIncrease?.toFixed(1)}%)
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="space-y-6">
      
      {/* Flagged / Revision Banner if any exist */}
      {flaggedPars.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center space-x-2 text-orange-900 font-bold text-xs uppercase tracking-wider mb-2">
            <AlertCircle className="w-4 h-4 text-orange-600" />
            <span>Requests Requiring Campus Revision or Attention ({flaggedPars.length})</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {flaggedPars.map((par) => {
              const priorityInfo = getPriorityBadge(par.priority);
              const typeInfo = getActionTypeInfo(par.actionType);

              return (
                <div
                  key={par.id}
                  onClick={() => onSelectPar(par)}
                  className="bg-white p-3.5 rounded-xl border border-orange-200 hover:border-orange-400 hover:shadow-sm cursor-pointer transition-all"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-mono font-bold text-xs text-slate-800">{par.trackingNumber}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold border ${priorityInfo.className}`}>
                      {priorityInfo.label}
                    </span>
                  </div>
                  <div className="font-bold text-slate-900 text-xs">{par.firstName} {par.lastName}</div>
                  <div className="text-[11px] text-slate-500 mb-2">{typeInfo.label} • {par.campus}</div>
                  <div className="text-[11px] text-orange-800 bg-orange-100/60 p-2 rounded-lg font-medium">
                    Returned for campus corrections
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main 6-Department SST Approval Routing Kanban */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {columns.map((col) => {
          const colPars = pars.filter(p => p.currentStage === col.stage);
          const ColIcon = col.icon;

          return (
            <div 
              key={col.stage}
              className="bg-slate-100/80 rounded-2xl p-3 border border-slate-200/80 flex flex-col min-h-[500px]"
            >
              {/* Column Header */}
              <div className={`p-3 rounded-xl border-b-2 ${col.accentColor} ${col.bgHeader} mb-3 shadow-2xs`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <ColIcon className="w-4 h-4" />
                    <h4 className="font-bold text-xs text-slate-900 tracking-tight">{col.title}</h4>
                  </div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white text-slate-700 shadow-2xs">
                    {colPars.length}
                  </span>
                </div>
                <div className="text-[10px] text-slate-500 mt-1 truncate font-medium">
                  {col.description}
                </div>
              </div>

              {/* Cards List */}
              <div className="flex-1 space-y-3 overflow-y-auto">
                {colPars.length === 0 ? (
                  <div className="h-32 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center text-center p-3 text-slate-400 text-xs">
                    No requests pending at this department stage
                  </div>
                ) : (
                  colPars.map((par) => {
                    const typeInfo = getActionTypeInfo(par.actionType);
                    const priorityInfo = getPriorityBadge(par.priority);
                    const isActionable = canPersonaActOnPar(currentPersona, par);

                    return (
                      <div
                        key={par.id}
                        onClick={() => onSelectPar(par)}
                        className={`bg-white rounded-xl p-3.5 border transition-all cursor-pointer shadow-2xs hover:shadow-md group ${
                          isActionable 
                            ? 'border-amber-400 ring-2 ring-amber-400/20' 
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {/* Header: Tracking # & Priority */}
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-mono text-[11px] font-bold text-slate-800">
                            {par.trackingNumber}
                          </span>
                          <div className="flex items-center space-x-1">
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold border ${priorityInfo.className}`}>
                              {priorityInfo.label}
                            </span>
                            {onDeletePar && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (window.confirm(`Delete test request ${par.trackingNumber} for ${par.firstName} ${par.lastName}?`)) {
                                    onDeletePar(par.id);
                                  }
                                }}
                                className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-400 hover:text-rose-600 transition-opacity"
                                title="Delete test request"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Employee Name & Position */}
                        <div className="mb-2">
                          <div className="font-bold text-slate-900 text-xs group-hover:text-[#0f2352] transition-colors">
                            {par.firstName} {par.lastName}
                          </div>
                          <div className="text-[11px] text-slate-500 truncate">
                            {par.title} • {par.campus}
                          </div>
                        </div>

                        {/* Action Type Badge */}
                        <div className="mb-2.5">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${typeInfo.badgeClass}`}>
                            {typeInfo.label}
                          </span>
                        </div>

                        {/* Dynamic Delta Card */}
                        {renderCardDetails(par)}

                        {/* Footer: Date & Submitter */}
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                          <span>Eff: {formatDate(par.effectiveDate)}</span>
                          {isActionable ? (
                            <span className="font-bold text-amber-700 flex items-center space-x-0.5 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                              <span>Sign</span>
                              <ChevronRight className="w-3 h-3" />
                            </span>
                          ) : (
                            <span className="truncate max-w-[100px] text-slate-400 font-medium">
                              ADP: {par.employeeId}
                            </span>
                          )}
                        </div>

                      </div>
                    );
                  })
                )}
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
};
