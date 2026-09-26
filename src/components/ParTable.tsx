import React from 'react';
import { PersonnelActionRequest, UserPersona } from '../types/par';
import { 
  formatCurrency, 
  formatDate, 
  getActionTypeInfo, 
  getStageInfo, 
  getPriorityBadge,
  canPersonaActOnPar 
} from '../utils/formatters';
import { 
  ChevronRight, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ArrowUpRight,
  TrendingUp,
  UserCheck,
  UserMinus,
  ArrowRightLeft,
  CalendarClock,
  FileText,
  BadgeDollarSign,
  Trash2
} from 'lucide-react';

interface ParTableProps {
  pars: PersonnelActionRequest[];
  currentPersona: UserPersona;
  onSelectPar: (par: PersonnelActionRequest) => void;
  onOpenNewParModal: () => void;
  onDeletePar?: (parId: string) => void;
}

export const ParTable: React.FC<ParTableProps> = ({
  pars,
  currentPersona,
  onSelectPar,
  onOpenNewParModal,
  onDeletePar
}) => {
  const renderActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'termination': return <UserMinus className="w-3.5 h-3.5" />;
      case 'salary_change': return <BadgeDollarSign className="w-3.5 h-3.5" />;
      case 'role_change': return <UserCheck className="w-3.5 h-3.5" />;
      case 'promotion': return <TrendingUp className="w-3.5 h-3.5" />;
      case 'campus_transfer': return <ArrowRightLeft className="w-3.5 h-3.5" />;
      case 'leave_of_absence': return <CalendarClock className="w-3.5 h-3.5" />;
      default: return <FileText className="w-3.5 h-3.5" />;
    }
  };

  const renderDeltaSummary = (par: PersonnelActionRequest) => {
    if (par.actionType === 'termination') {
      return (
        <div className="text-xs">
          <div className="font-bold text-rose-800">
            {par.isVoluntary ? 'Voluntary Resignation' : 'Involuntary Termination'}
          </div>
          <div className="text-[11px] text-slate-500">
            {par.terminationCode || 'Reason'}: Last Day {formatDate(par.lastDayWorked)}
          </div>
        </div>
      );
    }

    if (par.actionType === 'campus_transfer') {
      return (
        <div className="text-xs">
          <div className="font-semibold text-amber-900">
            {par.campus} <span className="text-slate-400">→</span> {par.proposedCampus}
          </div>
          <div className="text-[11px] text-slate-600 truncate">
            {par.proposedTitle || par.title}
          </div>
        </div>
      );
    }

    if (par.actionType === 'salary_change') {
      return (
        <div className="text-xs">
          <div className="font-semibold text-slate-900 flex items-center space-x-1">
            <span>{formatCurrency(par.currentSalary)}</span>
            <span className="text-slate-400">→</span>
            <span className="text-emerald-700 font-bold">{formatCurrency(par.proposedSalary)}</span>
          </div>
          <div className="text-[11px] text-emerald-600 font-medium">
            +{par.percentIncrease?.toFixed(1)}% ({par.salaryChangeReason})
          </div>
        </div>
      );
    }

    if (par.actionType === 'promotion') {
      return (
        <div className="text-xs">
          <div className="font-bold text-purple-900 truncate">
            {par.proposedTitle}
          </div>
          <div className="text-[11px] text-purple-700">
            {formatCurrency(par.proposedSalary)} (+{par.percentIncrease?.toFixed(1)}%)
          </div>
        </div>
      );
    }

    if (par.actionType === 'role_change') {
      return (
        <div className="text-xs">
          <div className="font-bold text-blue-900 truncate">
            {par.proposedTitle}
          </div>
          <div className="text-[11px] text-slate-500">
            {par.proposedCampus || par.campus}
          </div>
        </div>
      );
    }

    return <span className="text-xs text-slate-500">—</span>;
  };

  if (pars.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-2xs">
        <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-blue-50 text-[#0f2352] flex items-center justify-center">
          <FileText className="w-7 h-7" />
        </div>
        <h3 className="text-base font-bold text-slate-800">No SST Personnel Action Requests Found</h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-5">
          There are no requests matching your active filter criteria.
        </p>
        <button
          onClick={onOpenNewParModal}
          className="inline-flex items-center space-x-2 px-4 py-2 bg-[#0f2352] hover:bg-[#1a3880] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
        >
          <span>Initiate SST PAR</span>
          <ArrowUpRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <th className="py-3 px-4">Tracking # & Priority</th>
              <th className="py-3 px-4">Employee (Position ID)</th>
              <th className="py-3 px-4">Campus & Location</th>
              <th className="py-3 px-4">PAR Type</th>
              <th className="py-3 px-4">Action Summary</th>
              <th className="py-3 px-4">Current Review Stage</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {pars.map((par) => {
              const typeInfo = getActionTypeInfo(par.actionType);
              const stageInfo = getStageInfo(par.currentStage);
              const priorityInfo = getPriorityBadge(par.priority);
              const isActionable = canPersonaActOnPar(currentPersona, par);

              // Calculate routing completion count
              const totalSteps = par.routingSteps.length;
              const approvedSteps = par.routingSteps.filter(s => s.status === 'approved').length;

              return (
                <tr 
                  key={par.id}
                  onClick={() => onSelectPar(par)}
                  className={`hover:bg-slate-50/90 cursor-pointer transition-colors ${
                    isActionable ? 'bg-amber-50/30' : ''
                  }`}
                >
                  {/* Tracking Number & Priority */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="font-mono font-bold text-slate-900 text-xs">
                      {par.trackingNumber}
                    </div>
                    <div className="mt-1 flex items-center space-x-1.5">
                      <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold border ${priorityInfo.className}`}>
                        {priorityInfo.label}
                      </span>
                    </div>
                  </td>

                  {/* Employee Details */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div>
                      <div className="font-bold text-slate-900">{par.firstName} {par.lastName}</div>
                      <div className="text-[11px] text-slate-500">
                        {par.title} • <span className="font-mono text-slate-600 font-semibold">{par.employeeId}</span>
                      </div>
                    </div>
                  </td>

                  {/* Campus & Location */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="font-semibold text-slate-800">{par.campus}</div>
                    <div className="text-[11px] text-slate-500">{par.location} Region • {par.employmentStatus}</div>
                  </td>

                  {/* Action Type */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${typeInfo.badgeClass}`}>
                      {renderActionIcon(par.actionType)}
                      <span>{typeInfo.label}</span>
                    </span>
                  </td>

                  {/* Proposed Change Delta */}
                  <td className="py-3.5 px-4">
                    {renderDeltaSummary(par)}
                  </td>

                  {/* Current Stage & Progress Bar */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div>
                      <span className={`inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-md text-[11px] font-bold border ${stageInfo.badgeClass}`}>
                        {par.currentStage === 'completed' && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                        {par.currentStage === 'rejected' && <AlertCircle className="w-3 h-3 text-red-600" />}
                        {par.currentStage !== 'completed' && par.currentStage !== 'rejected' && (
                          <Clock className="w-3 h-3 text-slate-500" />
                        )}
                        <span>{stageInfo.label}</span>
                      </span>

                      {/* Micro Progress Bar */}
                      {par.currentStage !== 'completed' && par.currentStage !== 'rejected' && (
                        <div className="mt-1.5 flex items-center space-x-2">
                          <div className="w-20 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div 
                              className="bg-[#0f2352] h-full rounded-full transition-all duration-500"
                              style={{ width: `${Math.round((approvedSteps / totalSteps) * 100)}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono font-semibold">
                            {approvedSteps}/{totalSteps}
                          </span>
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Action Buttons */}
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <div className="inline-flex items-center space-x-1.5">
                      {isActionable ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectPar(par);
                          }}
                          className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-xs transition-colors"
                        >
                          <span>Sign & Endorse</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectPar(par);
                          }}
                          className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-xl text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                        >
                          <span>View Form</span>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                        </button>
                      )}

                      {onDeletePar && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm(`Delete test request ${par.trackingNumber} for ${par.firstName} ${par.lastName} (ADP: ${par.employeeId})?`)) {
                              onDeletePar(par.id);
                            }
                          }}
                          className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Delete test request"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
