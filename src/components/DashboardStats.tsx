import React from 'react';
import { PersonnelActionRequest, WorkflowStage } from '../types/par';
import { 
  Clock, 
  GraduationCap, 
  Award, 
  Users,
  ShieldCheck, 
  HeartHandshake, 
  CheckCircle2 
} from 'lucide-react';

interface DashboardStatsProps {
  pars: PersonnelActionRequest[];
  selectedStageFilter: WorkflowStage | 'all';
  onSelectStageFilter: (stage: WorkflowStage | 'all') => void;
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({
  pars,
  selectedStageFilter,
  onSelectStageFilter
}) => {
  const activeCount = pars.filter(p => p.currentStage !== 'completed' && p.currentStage !== 'rejected').length;
  const supervisorCount = pars.filter(p => p.currentStage === 'supervisor_review').length;
  const regionalCount = pars.filter(p => p.currentStage === 'regional_review').length;
  const cpoCount = pars.filter(p => p.currentStage === 'cpo_review').length;
  const hrCount = pars.filter(p => p.currentStage === 'hr_review').length;
  const benefitsCount = pars.filter(p => p.currentStage === 'benefits_review').length;
  const payrollCount = pars.filter(p => p.currentStage === 'payroll_action').length;
  const urgentCount = pars.filter(p => p.priority === 'urgent' && p.currentStage !== 'completed' && p.currentStage !== 'rejected').length;

  const cards = [
    {
      id: 'all' as const,
      label: 'Active Requests',
      count: activeCount,
      icon: Clock,
      color: 'blue',
      badge: urgentCount > 0 ? `${urgentCount} Urgent` : undefined,
      description: 'Active in SST pipeline'
    },
    {
      id: 'supervisor_review' as const,
      label: 'Supervisor / Principal',
      count: supervisorCount,
      icon: GraduationCap,
      color: 'amber',
      description: 'Campus endorsement'
    },
    {
      id: 'regional_review' as const,
      label: 'Regional Execs',
      count: regionalCount,
      icon: Users,
      color: 'orange',
      description: 'A. Ekin & S. Bulut (Voluntary)'
    },
    {
      id: 'cpo_review' as const,
      label: 'Chief People Officer',
      count: cpoCount,
      icon: Award,
      color: 'purple',
      description: 'Dr. Kevin Demirci (Involuntary)'
    },
    {
      id: 'hr_review' as const,
      label: 'Regional HR Audit',
      count: hrCount,
      icon: ShieldCheck,
      color: 'indigo',
      description: 'K. Stewart & A. Johnson (Regional HR)'
    },
    {
      id: 'benefits_review' as const,
      label: 'Benefits Sign-Off',
      count: benefitsCount,
      icon: HeartHandshake,
      color: 'teal',
      description: 'Ursula Villanueva (COBRA)'
    },
    {
      id: 'payroll_action' as const,
      label: 'Payroll ADP Action',
      count: payrollCount,
      icon: CheckCircle2,
      color: 'emerald',
      description: 'Paola Comparini (ADP Closeout)'
    }
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2.5 mb-6 no-print">
      {cards.map((card) => {
        const Icon = card.icon;
        const isSelected = selectedStageFilter === card.id;

        return (
          <button
            key={card.id}
            onClick={() => onSelectStageFilter(card.id)}
            className={`p-3.5 rounded-2xl text-left border transition-all relative overflow-hidden group ${
              isSelected 
                ? 'bg-white border-[#0f2352] shadow-md ring-2 ring-[#0f2352]/20' 
                : 'bg-white border-slate-200/80 hover:border-slate-300 hover:shadow-2xs'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className={`p-2 rounded-xl text-xs font-semibold ${
                card.color === 'blue' ? 'bg-blue-50 text-[#0f2352]' :
                card.color === 'amber' ? 'bg-amber-50 text-amber-700' :
                card.color === 'purple' ? 'bg-purple-50 text-purple-700' :
                card.color === 'indigo' ? 'bg-indigo-50 text-indigo-700' :
                card.color === 'teal' ? 'bg-teal-50 text-teal-700' :
                'bg-emerald-50 text-emerald-700'
              }`}>
                <Icon className="w-4 h-4" />
              </span>

              {card.badge && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 animate-pulse">
                  {card.badge}
                </span>
              )}
            </div>

            <div className="text-2xl font-black text-slate-900 tracking-tight">
              {card.count}
            </div>
            <div className="text-xs font-bold text-slate-800 truncate mt-0.5">
              {card.label}
            </div>
            <div className="text-[11px] text-slate-500 truncate mt-0.5">
              {card.description}
            </div>
          </button>
        );
      })}
    </div>
  );
};
