import React from 'react';
import { ActionType, Campus, SchoolLocation, SST_CAMPUS_REGIONS } from '../types/par';
import { 
  Search, 
  Filter, 
  LayoutList, 
  Columns3, 
  X, 
  MapPin, 
  Download, 
  FileSpreadsheet, 
  Clock, 
  UserMinus, 
  BadgeDollarSign, 
  ArrowRightLeft
} from 'lucide-react';

interface ParFiltersProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedActionType: ActionType | 'all';
  onActionTypeChange: (t: ActionType | 'all') => void;
  selectedLocation: SchoolLocation | 'all';
  onLocationChange: (loc: SchoolLocation | 'all') => void;
  selectedCampus: Campus | 'all';
  onCampusChange: (c: Campus | 'all') => void;
  viewMode: 'table' | 'kanban';
  onViewModeChange: (m: 'table' | 'kanban') => void;
  totalFilteredCount: number;
  totalCount: number;
  onResetFilters: () => void;
  onExportCsv?: () => void;
  onOpenAppsScript?: () => void;
  myActionCount?: number;
  filterActionQueue?: boolean;
  onToggleActionQueue?: () => void;
  /** Principals see only their own PARs, so the campus, region, type, and HR filters are hidden. */
  simplified?: boolean;
}

export const ParFilters: React.FC<ParFiltersProps> = ({
  searchQuery,
  onSearchChange,
  selectedActionType,
  onActionTypeChange,
  selectedLocation,
  onLocationChange,
  selectedCampus,
  onCampusChange,
  viewMode,
  onViewModeChange,
  totalFilteredCount,
  totalCount,
  onResetFilters,
  onExportCsv,
  onOpenAppsScript,
  myActionCount = 0,
  filterActionQueue = false,
  onToggleActionQueue,
  simplified = false
}) => {
  const locations: SchoolLocation[] = [
    'Houston',
    'San Antonio',
    'Corpus Christi',
    'Central Administration'
  ];

  const hasActiveFilters = searchQuery !== '' || selectedActionType !== 'all' || selectedLocation !== 'all' || selectedCampus !== 'all' || filterActionQueue;

  return (
    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs mb-6 no-print space-y-3.5">
      
      {/* Top Row: Search, Selectors, and Action Buttons */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        
        {/* Left: Search & Filter dropdowns */}
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          
          {/* Search Box */}
          <div className="relative min-w-[220px] flex-1 sm:max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search employee, ADP ID, campus..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 hover:bg-slate-100/60 focus:bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0f2352]/20 focus:border-[#0f2352] transition-all text-slate-800 placeholder-slate-400"
            />
          </div>

          {!simplified && (<>
          {/* Action Type Selector */}
          <div className="flex items-center space-x-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400 hidden sm:inline" />
            <select
              value={selectedActionType}
              onChange={(e) => onActionTypeChange(e.target.value as ActionType | 'all')}
              className="text-xs bg-slate-50 border border-slate-200 text-slate-700 py-2 px-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0f2352]/20 focus:border-[#0f2352] font-medium"
            >
              <option value="all">All PAR Types</option>
              <option value="termination">🚪 Termination / Separation</option>
              <option value="campus_transfer">🔄 Campus Transfer</option>
              <option value="salary_change">💰 Salary / Stipend</option>
              <option value="role_change">👤 Role Change</option>
              <option value="promotion">📈 Promotion</option>
              <option value="leave_of_absence">🏖️ Leave of Absence</option>
            </select>
          </div>

          {/* ALL SST CAMPUSES DROPDOWN (Organized by region) */}
          <div className="flex items-center space-x-1.5">
            <MapPin className="w-3.5 h-3.5 text-[#b91c1c] hidden sm:inline" />
            <select
              value={selectedCampus}
              onChange={(e) => onCampusChange(e.target.value as Campus | 'all')}
              className="text-xs bg-slate-50 border border-slate-200 text-slate-800 py-2 px-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0f2352]/20 focus:border-[#0f2352] font-semibold max-w-[220px]"
              title="Filter by SST Campus"
            >
              <option value="all">🏫 All SST Campuses (Texas)</option>
              {Object.entries(SST_CAMPUS_REGIONS).map(([region, campuses]) => (
                <optgroup key={region} label={region} className="font-bold text-slate-900">
                  {campuses.map((c) => (
                    <option key={c} value={c} className="font-normal text-slate-800">
                      {c}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          {/* Region / Location Selector */}
          <div>
            <select
              value={selectedLocation}
              onChange={(e) => onLocationChange(e.target.value as SchoolLocation | 'all')}
              className="text-xs bg-slate-50 border border-slate-200 text-slate-700 py-2 px-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0f2352]/20 focus:border-[#0f2352] font-medium"
            >
              <option value="all">All Regions</option>
              {locations.map((loc) => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
          </div>

          </>)}

          {/* Clear Filter button */}
          {hasActiveFilters && (
            <button
              onClick={onResetFilters}
              className="inline-flex items-center space-x-1 text-xs text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100/70 px-2.5 py-1.5 rounded-lg transition-colors font-semibold"
            >
              <X className="w-3.5 h-3.5" />
              <span>Reset Filters</span>
            </button>
          )}

        </div>

        {/* Right Action Tools: CSV Export, Sheets Sync, View Mode Toggle */}
        <div className="flex items-center flex-wrap gap-2">
          
          {/* Export to CSV for Texas HR reporting */}
          {onExportCsv && (
            <button
              type="button"
              onClick={onExportCsv}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 hover:text-slate-900 rounded-xl text-xs font-bold shadow-2xs transition-colors"
              title="Export filtered PAR requests to Texas Charter compliance CSV"
            >
              <Download className="w-3.5 h-3.5 text-blue-700" />
              <span>Export CSV</span>
            </button>
          )}

          {/* Open SSTTX Google Sheets Sync */}
          {onOpenAppsScript && (
            <button
              type="button"
              onClick={onOpenAppsScript}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-900 rounded-xl text-xs font-bold shadow-2xs transition-colors"
              title="Track requests directly in SSTTX Google Sheets"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
              <span>SSTTX Sheets</span>
            </button>
          )}

          {/* View Mode Toggle */}
          <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl border border-slate-200/80">
            <button
              onClick={() => onViewModeChange('table')}
              className={`inline-flex items-center space-x-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                viewMode === 'table'
                  ? 'bg-white text-[#0f2352] shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutList className="w-3.5 h-3.5" />
              <span>Table</span>
            </button>
            <button
              onClick={() => onViewModeChange('kanban')}
              className={`inline-flex items-center space-x-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                viewMode === 'kanban'
                  ? 'bg-white text-[#0f2352] shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Columns3 className="w-3.5 h-3.5" />
              <span>Pipeline</span>
            </button>
          </div>

        </div>

      </div>

      {/* Bottom Row: HR Quick Filter Pills */}
      <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
        {!simplified && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mr-1">
            HR Quick Filters:
          </span>

          {/* All */}
          <button
            type="button"
            onClick={() => {
              onActionTypeChange('all');
              if (filterActionQueue && onToggleActionQueue) onToggleActionQueue();
            }}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
              selectedActionType === 'all' && !filterActionQueue
                ? 'bg-[#0f2352] text-white'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            All Requests ({totalCount})
          </button>

          {/* Needs My Signature */}
          {onToggleActionQueue && (
            <button
              type="button"
              onClick={onToggleActionQueue}
              className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                filterActionQueue
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200'
              }`}
            >
              <Clock className="w-3 h-3 text-amber-700" />
              <span>Action Required</span>
              {myActionCount > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                  filterActionQueue ? 'bg-white text-amber-700' : 'bg-amber-500 text-white'
                }`}>
                  {myActionCount}
                </span>
              )}
            </button>
          )}

          {/* Separations */}
          <button
            type="button"
            onClick={() => {
              onActionTypeChange('termination');
              if (filterActionQueue && onToggleActionQueue) onToggleActionQueue();
            }}
            className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
              selectedActionType === 'termination'
                ? 'bg-rose-700 text-white'
                : 'bg-rose-50 hover:bg-rose-100 text-rose-900 border border-rose-200'
            }`}
          >
            <UserMinus className="w-3 h-3 text-rose-600" />
            <span>Separations / Terminations</span>
          </button>

          {/* Salary / Stipends */}
          <button
            type="button"
            onClick={() => {
              onActionTypeChange('salary_change');
              if (filterActionQueue && onToggleActionQueue) onToggleActionQueue();
            }}
            className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
              selectedActionType === 'salary_change'
                ? 'bg-emerald-700 text-white'
                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200'
            }`}
          >
            <BadgeDollarSign className="w-3 h-3 text-emerald-600" />
            <span>Salary & Stipends</span>
          </button>

          {/* Transfers */}
          <button
            type="button"
            onClick={() => {
              onActionTypeChange('campus_transfer');
              if (filterActionQueue && onToggleActionQueue) onToggleActionQueue();
            }}
            className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
              selectedActionType === 'campus_transfer'
                ? 'bg-blue-800 text-white'
                : 'bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200'
            }`}
          >
            <ArrowRightLeft className="w-3 h-3 text-blue-600" />
            <span>Campus Transfers</span>
          </button>
        </div>
        )}
        <div className="text-slate-500 text-[11px]">
          Showing <strong className="text-slate-900 font-bold">{totalFilteredCount}</strong> of {totalCount} records
        </div>
      </div>

    </div>
  );
};

