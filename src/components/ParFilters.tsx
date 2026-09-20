import React from 'react';
import { ActionType, Campus, SchoolLocation, SST_CAMPUS_REGIONS } from '../types/par';
import { Search, Filter, LayoutList, Columns3, X, MapPin } from 'lucide-react';

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
  onResetFilters
}) => {
  const locations: SchoolLocation[] = [
    'Houston',
    'San Antonio',
    'Corpus Christi',
    'Central Administration'
  ];

  const hasActiveFilters = searchQuery !== '' || selectedActionType !== 'all' || selectedLocation !== 'all' || selectedCampus !== 'all';

  return (
    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs mb-6 no-print">
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
              className="text-xs bg-slate-50 border border-slate-200 text-slate-800 py-2 px-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0f2352]/20 focus:border-[#0f2352] font-semibold max-w-[240px]"
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

          <div className="text-xs text-slate-500 ml-1">
            Showing <strong className="text-slate-800 font-bold">{totalFilteredCount}</strong> of {totalCount} requests
          </div>

        </div>

        {/* Right: View Mode Toggle */}
        <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl self-start lg:self-auto border border-slate-200/80">
          <button
            onClick={() => onViewModeChange('table')}
            className={`inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              viewMode === 'table'
                ? 'bg-white text-[#0f2352] shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <LayoutList className="w-4 h-4" />
            <span>Table View</span>
          </button>
          <button
            onClick={() => onViewModeChange('kanban')}
            className={`inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              viewMode === 'kanban'
                ? 'bg-white text-[#0f2352] shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Columns3 className="w-4 h-4" />
            <span>Routing Pipeline</span>
          </button>
        </div>

      </div>
    </div>
  );
};
