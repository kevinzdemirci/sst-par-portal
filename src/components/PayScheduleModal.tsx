import React, { useState } from 'react';
import { SST_PAYROLL_CYCLES, getActivePayrollCycle } from '../data/mockPayoutData';
import { Calendar, Search, Download, Printer, X, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { SST_DEFAULT_LOGO, getNormalizedLogoUrl } from '../data/sstLogo';

interface PayScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  districtLogo?: string;
  districtName?: string;
}

export const PayScheduleModal: React.FC<PayScheduleModalProps> = ({
  isOpen,
  onClose,
  districtLogo,
  districtName = 'School of Science and Technology'
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'upcoming' | 'closed'>('all');

  if (!isOpen) return null;

  const activeCycle = getActivePayrollCycle();

  const filteredCycles = SST_PAYROLL_CYCLES.filter(cycle => {
    const matchesSearch = 
      cycle.cycleName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cycle.periodStartFormatted.includes(searchTerm) ||
      cycle.periodEndFormatted.includes(searchTerm) ||
      cycle.correctionsDueFormatted.includes(searchTerm) ||
      cycle.payDateFormatted.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `period ${cycle.periodNumber}`.includes(searchTerm.toLowerCase());

    if (statusFilter === 'upcoming') {
      return matchesSearch && (cycle.status === 'active' || cycle.status === 'upcoming');
    }
    if (statusFilter === 'closed') {
      return matchesSearch && cycle.status === 'closed';
    }
    return matchesSearch;
  });

  const handleExportCSV = () => {
    const headers = ['Period #', 'Pay Period Start', 'Pay Period End', 'Corrections Due', 'Pay Date', 'Status'];
    const rows = SST_PAYROLL_CYCLES.map(c => [
      c.periodNumber,
      c.periodStartFormatted,
      c.periodEndFormatted,
      c.correctionsDueFormatted,
      `"${c.payDateFormatted}"`,
      c.status
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'SST_2026_2027_SY_Payroll_Schedule.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full max-h-[92vh] flex flex-col border border-slate-200 overflow-hidden my-auto">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-200 bg-gradient-to-r from-slate-900 via-[#0f2352] to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3.5">
            <div className="p-2 bg-white/10 rounded-2xl backdrop-blur-md border border-white/15">
              <Calendar className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-400 text-blue-950">
                  Official District Calendar
                </span>
                <span className="text-[11px] text-slate-300 font-semibold">
                  2026 – 2027 School Year
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white tracking-tight mt-0.5">
                SCHOOL OF SCIENCE AND TECHNOLOGY 2026 - 2027 SY PAYROLL SCHEDULE
              </h2>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => window.print()}
              className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition-colors no-print"
              title="Print Schedule"
            >
              <Printer className="w-5 h-5" />
            </button>
            <button
              onClick={handleExportCSV}
              className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition-colors no-print"
              title="Export to CSV / Excel"
            >
              <Download className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition-colors no-print"
              title="Close Modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Highlight Stats Ribbon */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3 shrink-0">
          <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Current Cycle</div>
              <div className="text-xs font-black text-slate-900 truncate">
                Period {activeCycle.periodNumber} ({activeCycle.periodStartFormatted} – {activeCycle.periodEndFormatted})
              </div>
            </div>
          </div>

          <div className="bg-white p-3 rounded-2xl border border-amber-300 bg-amber-50/50 shadow-2xs flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] font-black text-amber-800 uppercase tracking-wider">Corrections Due</div>
              <div className="text-xs font-black text-amber-950">
                {activeCycle.correctionsDueFormatted} ({activeCycle.daysRemaining} Days Left)
              </div>
            </div>
          </div>

          <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Target Pay Date</div>
              <div className="text-xs font-black text-emerald-950 truncate">
                {activeCycle.payDateFormatted}
              </div>
            </div>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="px-6 py-3 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 bg-white">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by period, date, or month..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div className="flex items-center space-x-1.5 w-full sm:w-auto">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                statusFilter === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All 24 Cycles
            </button>
            <button
              onClick={() => setStatusFilter('upcoming')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                statusFilter === 'upcoming'
                  ? 'bg-amber-500 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Active & Upcoming
            </button>
            <button
              onClick={() => setStatusFilter('closed')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                statusFilter === 'closed'
                  ? 'bg-slate-700 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Historical (Closed)
            </button>
          </div>
        </div>

        {/* The 24-Period Payroll Schedule Table */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/50">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <table className="min-w-full divide-y divide-slate-200 text-xs text-left">
              <thead className="bg-[#0f2352] text-white font-bold uppercase tracking-wider text-[11px] sticky top-0 z-10 shadow-xs">
                <tr>
                  <th className="px-3 py-3 w-16 text-center">Period</th>
                  <th colSpan={2} className="px-4 py-3 text-center border-x border-blue-900/60">
                    Pay Period
                  </th>
                  <th className="px-4 py-3 text-center border-r border-blue-900/60 bg-amber-500 text-blue-950 font-black">
                    Corrections Due
                  </th>
                  <th className="px-4 py-3 text-left">
                    Pay Date
                  </th>
                  <th className="px-4 py-3 text-right">
                    Status
                  </th>
                </tr>
                <tr className="bg-slate-100 text-slate-700 text-[10px] border-t border-slate-200">
                  <th className="px-3 py-2 text-center text-slate-500 font-bold">#</th>
                  <th className="px-4 py-2 text-center font-bold text-slate-600 border-l border-slate-200">Start Date</th>
                  <th className="px-4 py-2 text-center font-bold text-slate-600 border-r border-slate-200">End Date</th>
                  <th className="px-4 py-2 text-center font-bold text-amber-900 bg-amber-50 border-r border-slate-200">Deadline</th>
                  <th className="px-4 py-2 font-bold text-slate-600">Official Disbursement</th>
                  <th className="px-4 py-2 text-right font-bold text-slate-600">Cycle Phase</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredCycles.map((cycle) => {
                  const isActive = cycle.status === 'active';
                  return (
                    <tr
                      key={cycle.id}
                      className={`transition-colors ${
                        isActive
                          ? 'bg-amber-50/90 font-bold border-l-4 border-l-amber-500'
                          : 'hover:bg-slate-50/80'
                      }`}
                    >
                      <td className="px-3 py-3 text-center font-black text-slate-900">
                        {cycle.periodNumber}
                      </td>
                      <td className="px-4 py-3 text-center font-semibold text-slate-800 border-l border-slate-100">
                        {cycle.periodStartFormatted}
                      </td>
                      <td className="px-4 py-3 text-center font-semibold text-slate-800 border-r border-slate-100">
                        {cycle.periodEndFormatted}
                      </td>
                      <td className="px-4 py-3 text-center font-black text-amber-950 bg-amber-50/40 border-r border-slate-100">
                        {cycle.correctionsDueFormatted}
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-900">
                        <div className="flex items-center space-x-2">
                          <span>{cycle.payDateFormatted}</span>
                          {isActive && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-600 text-white font-black">
                              NEXT PAY
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {isActive ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-blue-950 border border-amber-500 animate-pulse">
                            ⏳ ACTIVE ({cycle.daysRemaining}d left)
                          </span>
                        ) : cycle.status === 'closed' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                            Completed
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                            Scheduled
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Footer Notes */}
          <div className="mt-4 p-4 rounded-2xl bg-white border border-slate-200 text-xs text-slate-600 flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-[#b91c1c] shrink-0 mt-0.5" />
            <div className="text-[11px] leading-relaxed">
              <strong className="text-slate-900 font-bold block mb-0.5">District Payroll Processing Guidelines:</strong>
              All employee PAR compensation changes, extra duty timesheets, retroactive stipends, and payroll deductions must be finalized by Regional HR and approved by the Chief People Officer before <strong>5:00 PM CST on the Corrections Due date</strong> to guarantee inclusion in the target disbursement pay cycle.
            </div>
          </div>
        </div>

        {/* Modal Action Bar */}
        <div className="px-6 py-3 border-t border-slate-200 bg-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2">
            <img 
              src={getNormalizedLogoUrl(districtLogo)} 
              alt={districtName} 
              className="h-6 w-auto object-contain"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = SST_DEFAULT_LOGO;
              }}
            />
            <span className="text-xs font-bold text-slate-500">
              {districtName} · People Operations & Payroll Division
            </span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors shadow-xs"
          >
            Close Schedule
          </button>
        </div>

      </div>
    </div>
  );
};
