import React, { useState, useMemo, useEffect } from 'react';
import type { User } from 'firebase/auth';
import { AdpWorker, AdpConnectionConfig } from '../types/adp';
import { PersonnelActionRequest } from '../types/par';
import { 
  getStoredAdpStaff, 
  saveStoredAdpStaff, 
  getStoredAdpConfig, 
  saveStoredAdpConfig, 
  reconcileStaffWithPars, 
  syncFromAdpApi, 
  batchPushTerminationsToAdp,
  parseAdpCsvExport
} from '../utils/adpService';
import {
  isFirebaseConfigured,
  requestAdpRefresh,
  signInWithDistrictGoogle,
  signOutDistrictGoogle,
  watchDistrictUser
} from '../utils/firebaseClient';
import { 
  Users, 
  Search, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  ShieldCheck, 
  Download, 
  Upload, 
  FileSpreadsheet, 
  ExternalLink, 
  UserMinus, 
  PlusCircle, 
  X, 
  Briefcase, 
  AlertCircle
} from 'lucide-react';
import { SST_DEFAULT_LOGO, getNormalizedLogoUrl } from '../data/sstLogo';
import { formatCurrency, formatDate } from '../utils/formatters';

interface AdpStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  pars: PersonnelActionRequest[];
  onOpenNewParForEmployee?: (worker: AdpWorker) => void;
  onSelectPar?: (par: PersonnelActionRequest) => void;
  onToast: (message: string, type: 'success' | 'warning' | 'info') => void;
  districtLogo?: string;
  districtName?: string;
}

export const AdpStaffModal: React.FC<AdpStaffModalProps> = ({
  isOpen,
  onClose,
  pars,
  onOpenNewParForEmployee,
  onSelectPar,
  onToast,
  districtLogo,
  districtName = 'School of Science and Technology'
}) => {
  const [activeTab, setActiveTab] = useState<'roster' | 'alignment' | 'settings'>('roster');
  const [staffList, setStaffList] = useState<AdpWorker[]>(() => getStoredAdpStaff());
  const [adpConfig, setAdpConfig] = useState<AdpConnectionConfig>(() => getStoredAdpConfig());
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Active' | 'Terminated' | 'Pending Termination'>('all');
  const [regionFilter, setRegionFilter] = useState<string>('all');
  const [isSyncing, setIsSyncing] = useState(false);
  const [districtUser, setDistrictUser] = useState<User | null>(null);
  const [isPulling, setIsPulling] = useState(false);
  const firebaseOn = isFirebaseConfigured();

  useEffect(() => watchDistrictUser(setDistrictUser), []);

  const handleSignIn = async () => {
    try {
      await signInWithDistrictGoogle();
    } catch (e: any) {
      onToast(e?.message || 'Google sign-in failed.', 'warning');
    }
  };

  const handlePullNow = async () => {
    setIsPulling(true);
    try {
      const res = await requestAdpRefresh();
      onToast(
        res.status === 'fresh'
          ? 'The ADP roster was refreshed within the last hour, so no new pull was needed.'
          : `Pulled ${res.count ?? ''} staff records from ADP.`,
        'success'
      );
      await handleSyncAdp();
    } catch (e: any) {
      onToast(`ADP pull failed: ${e?.message || 'unknown error'}`, 'warning');
    } finally {
      setIsPulling(false);
    }
  };
  const [csvUploadModalOpen, setCsvUploadModalOpen] = useState(false);
  const [csvInput, setCsvInput] = useState('');

  // Reconcile roster with current PARs
  const { updatedRoster: reconciledRoster, summary } = useMemo(() => {
    return reconcileStaffWithPars(staffList, pars);
  }, [staffList, pars]);

  if (!isOpen) return null;

  // Filtered staff list
  const filteredStaff = reconciledRoster.filter(w => {
    const matchesSearch = 
      w.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.adpId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.positionId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.jobTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.campus.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || w.employmentStatus === statusFilter;
    const matchesRegion = regionFilter === 'all' || w.location === regionFilter;

    return matchesSearch && matchesStatus && matchesRegion;
  });

  const handleSyncAdp = async () => {
    setIsSyncing(true);
    try {
      const res = await syncFromAdpApi(adpConfig);
      const freshStaff = getStoredAdpStaff();
      setStaffList(freshStaff);
      onToast(res.message, res.isLive ? 'success' : 'info');
    } catch (e: any) {
      onToast(`ADP sync failed: ${e?.message || 'unknown error'}`, 'warning');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleBatchPushTerminations = () => {
    const { updatedRoster, closedCount } = batchPushTerminationsToAdp(staffList, pars);
    setStaffList(updatedRoster);
    saveStoredAdpStaff(updatedRoster);
    if (closedCount > 0) {
      onToast(`⚡ Aligned ${closedCount} completed separation record(s) to ADP Workforce Now. Status updated to Terminated.`, 'success');
    } else {
      onToast('All completed separation PARs are already 100% aligned with ADP.', 'info');
    }
  };

  const handleCsvImport = () => {
    if (!csvInput.trim()) return;
    try {
      const imported = parseAdpCsvExport(csvInput);
      if (imported.length > 0) {
        // Merge with existing or replace
        const merged = [...staffList];
        imported.forEach(imp => {
          const idx = merged.findIndex(m => m.adpId === imp.adpId);
          if (idx !== -1) merged[idx] = imp;
          else merged.push(imp);
        });
        setStaffList(merged);
        saveStoredAdpStaff(merged);
        setCsvUploadModalOpen(false);
        setCsvInput('');
        onToast(`Imported ${imported.length} staff records from ADP export.`, 'success');
      } else {
        onToast('No valid records found in CSV text. Please verify formatting.', 'warning');
      }
    } catch (e) {
      onToast('Failed to parse ADP CSV data.', 'warning');
    }
  };

  const handleExportRosterCsv = () => {
    const headers = [
      'Associate ID', 'First Name', 'Last Name', 'Position ID', 'Job Title', 
      'Campus', 'Region', 'Status', 'Salary', 'Hire Date', 'Last Day Worked', 
      'Separation Reason', 'Rehire Eligible', 'Linked PAR Tracking', 'Alignment Status'
    ];
    const rows = reconciledRoster.map(w => [
      w.adpId,
      w.firstName,
      w.lastName,
      w.positionId,
      `"${w.jobTitle}"`,
      `"${w.campus}"`,
      w.location,
      w.employmentStatus,
      w.annualSalary,
      w.hireDate,
      w.lastDayWorked || '',
      `"${w.terminationReason || ''}"`,
      w.eligibleForRehire || '',
      w.linkedParTracking || '',
      w.alignmentStatus
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SST_ADP_Staff_Alignment_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl max-w-6xl w-full max-h-[92vh] flex flex-col border border-slate-200 overflow-hidden my-auto">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-200 bg-gradient-to-r from-slate-900 via-[#0f2352] to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3.5">
            <div className="p-2.5 bg-white/10 rounded-2xl backdrop-blur-md border border-white/15">
              <Users className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-400 text-blue-950">
                  ADP Workforce Now® Integration
                </span>
                <span className="text-[11px] text-slate-300 font-semibold flex items-center space-x-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Connected (Live Sync Active)</span>
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white tracking-tight mt-0.5">
                SST Staff Directory & ADP Termination Alignment Hub
              </h2>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleSyncAdp}
              disabled={isSyncing}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all border border-white/20"
              title="Synchronize with ADP Workforce Now"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-amber-300 ${isSyncing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{isSyncing ? 'Syncing...' : 'Sync ADP Roster'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
              title="Close Modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation Ribbon */}
        <div className="px-6 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveTab('roster')}
              className={`inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'roster'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-blue-400" />
              <span>ADP Staff List ({reconciledRoster.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('alignment')}
              className={`inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'alignment'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>Termination Alignment & Reconciler</span>
              {summary.pendingAdpCloseoutCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-amber-400 text-blue-950">
                  {summary.pendingAdpCloseoutCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'settings'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5 text-purple-400" />
              <span>ADP API & Sync Settings</span>
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleExportRosterCsv}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors shadow-2xs"
              title="Download CSV Audit Report"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span className="hidden sm:inline">Export Audit CSV</span>
            </button>
          </div>
        </div>

        {/* Highlight Metrics */}
        <div className="px-6 py-3 bg-white border-b border-slate-200 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2.5 shrink-0 text-xs">
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
            <div className="text-[10px] font-bold text-slate-500 uppercase">Total ADP Staff</div>
            <div className="text-base font-black text-slate-900">{summary.totalWorkers}</div>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200">
            <div className="text-[10px] font-bold text-emerald-800 uppercase">Active Staff</div>
            <div className="text-base font-black text-emerald-950">{summary.activeCount}</div>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-100 border border-slate-300">
            <div className="text-[10px] font-bold text-slate-600 uppercase">Terminated (ADP)</div>
            <div className="text-base font-black text-slate-800">{summary.terminatedCount}</div>
          </div>
          <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200">
            <div className="text-[10px] font-bold text-blue-800 uppercase">PAR In Progress</div>
            <div className="text-base font-black text-blue-950">{summary.inProgressParCount}</div>
          </div>
          <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-300">
            <div className="text-[10px] font-bold text-amber-800 uppercase">Pending ADP Closeout</div>
            <div className="text-base font-black text-amber-950">{summary.pendingAdpCloseoutCount}</div>
          </div>
          <div className="p-2.5 rounded-xl bg-purple-50 border border-purple-200">
            <div className="text-[10px] font-bold text-purple-800 uppercase">Aligned Status</div>
            <div className="text-base font-black text-purple-950">
              {Math.round((summary.alignedCount / (summary.totalWorkers || 1)) * 100)}%
            </div>
          </div>
        </div>

        {/* TAB 1: ADP STAFF ROSTER */}
        {activeTab === 'roster' && (
          <div className="flex-1 flex flex-col min-h-0 bg-slate-50/50">
            {/* Search & Filters */}
            <div className="p-4 bg-white border-b border-slate-200 flex flex-col md:flex-row items-center justify-between gap-3 shrink-0">
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search staff by name, Position ID, campus..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                <select
                  value={regionFilter}
                  onChange={(e) => setRegionFilter(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
                >
                  <option value="all">All SST Regions</option>
                  <option value="Houston">Houston Area</option>
                  <option value="San Antonio">San Antonio Area</option>
                  <option value="Corpus Christi">Corpus Christi Area</option>
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
                >
                  <option value="all">All Employment Statuses</option>
                  <option value="Active">Active Staff Only</option>
                  <option value="Terminated">Terminated Only</option>
                  <option value="Pending Termination">Pending Termination</option>
                </select>

                <button
                  onClick={() => setCsvUploadModalOpen(true)}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                  title="Import from ADP Workforce Now CSV"
                >
                  <Upload className="w-3.5 h-3.5 text-purple-600" />
                  <span>Import ADP CSV</span>
                </button>
              </div>
            </div>

            {/* Staff Table */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <table className="min-w-full divide-y divide-slate-200 text-xs text-left">
                  <thead className="bg-[#0f2352] text-white font-bold uppercase tracking-wider text-[10px] sticky top-0 z-10 shadow-xs">
                    <tr>
                      <th className="px-4 py-3">Staff Member & Position ID</th>
                      <th className="px-4 py-3">Campus & Position</th>
                      <th className="px-4 py-3">Salary & Agreement</th>
                      <th className="px-4 py-3">ADP Status</th>
                      <th className="px-4 py-3">Termination Alignment</th>
                      <th className="px-4 py-3 text-right">PAR Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {filteredStaff.map((worker) => {
                      const matchingPar = pars.find(p => p.id === worker.linkedParId || p.trackingNumber === worker.linkedParTracking);
                      const isTerminated = worker.employmentStatus === 'Terminated';
                      const isPendingTerm = worker.employmentStatus === 'Pending Termination';

                      return (
                        <tr 
                          key={worker.id}
                          className={`hover:bg-slate-50/80 transition-colors ${
                            isTerminated ? 'bg-slate-50/50' : isPendingTerm ? 'bg-amber-50/40' : ''
                          }`}
                        >
                          <td className="px-4 py-3">
                            <div className="font-bold text-slate-900 flex items-center space-x-1.5">
                              <span>{worker.fullName}</span>
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 font-mono border border-slate-200">
                                {worker.adpId}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 flex items-center space-x-2 mt-0.5">
                              <span>{worker.workEmail}</span>
                              <span>·</span>
                              <span className="font-mono text-[10px] text-slate-400">{worker.positionId}</span>
                            </div>
                          </td>

                          <td className="px-4 py-3">
                            <div className="font-semibold text-slate-800">{worker.jobTitle}</div>
                            <div className="text-[11px] text-slate-500">{worker.campus} ({worker.location})</div>
                          </td>

                          <td className="px-4 py-3">
                            <div className="font-black text-slate-900">{formatCurrency(worker.annualSalary)}</div>
                            <div className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider">
                              {worker.contractType} · Semi-Monthly
                            </div>
                          </td>

                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                              worker.employmentStatus === 'Active'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : worker.employmentStatus === 'Terminated'
                                ? 'bg-slate-200 text-slate-800 border border-slate-300'
                                : 'bg-amber-100 text-amber-800 border border-amber-300'
                            }`}>
                              {worker.employmentStatus === 'Active' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                              {worker.employmentStatus === 'Terminated' && <UserMinus className="w-3 h-3 mr-1" />}
                              {worker.employmentStatus === 'Pending Termination' && <Clock className="w-3 h-3 mr-1" />}
                              <span>{worker.employmentStatus}</span>
                            </span>
                            {worker.terminationDate && (
                              <div className="text-[10px] text-slate-500 mt-0.5">
                                Term Date: {worker.terminationDate}
                              </div>
                            )}
                          </td>

                          <td className="px-4 py-3">
                            {worker.alignmentStatus === 'aligned' ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />
                                Aligned with ADP
                              </span>
                            ) : worker.alignmentStatus === 'par_in_progress' ? (
                              <div className="space-y-0.5">
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black bg-blue-50 text-blue-800 border border-blue-200">
                                  <Clock className="w-3 h-3 mr-1 text-blue-600" />
                                  PAR in Review
                                </span>
                                {worker.linkedParTracking && (
                                  <div className="text-[10px] text-blue-700 font-bold">
                                    {worker.linkedParTracking}
                                  </div>
                                )}
                              </div>
                            ) : worker.alignmentStatus === 'pending_adp_closeout' ? (
                              <div className="space-y-0.5">
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300">
                                  <AlertTriangle className="w-3 h-3 mr-1 text-amber-700" />
                                  Pending ADP Batch
                                </span>
                                {worker.linkedParTracking && (
                                  <div className="text-[10px] text-amber-800 font-bold">
                                    {worker.linkedParTracking}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-300">
                                <AlertCircle className="w-3 h-3 mr-1 text-rose-600" />
                                Discrepancy (No PAR)
                              </span>
                            )}
                          </td>

                          <td className="px-4 py-3 text-right">
                            {matchingPar ? (
                              <button
                                onClick={() => onSelectPar && onSelectPar(matchingPar)}
                                className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-xs transition-colors border border-blue-200"
                              >
                                <span>View PAR</span>
                                <ExternalLink className="w-3 h-3" />
                              </button>
                            ) : worker.employmentStatus === 'Active' && onOpenNewParForEmployee ? (
                              <button
                                onClick={() => onOpenNewParForEmployee(worker)}
                                className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-xl bg-slate-900 text-white hover:bg-slate-800 font-bold text-xs transition-colors shadow-2xs"
                              >
                                <PlusCircle className="w-3 h-3 text-amber-400" />
                                <span>New PAR</span>
                              </button>
                            ) : (
                              <span className="text-slate-400 text-[11px]">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: TERMINATION ALIGNMENT & RECONCILIATION */}
        {activeTab === 'alignment' && (
          <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 space-y-6">
            
            {/* Action Banner */}
            <div className="p-5 rounded-3xl bg-gradient-to-r from-blue-900 to-[#0f2352] text-white shadow-md flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-amber-400 text-blue-950">
                    Live Audit & Reconciler
                  </span>
                  <span className="text-xs text-blue-200 font-semibold">Texas Charter PEIMS / TRS Compliance</span>
                </div>
                <h3 className="text-base font-black text-white mt-1">
                  ADP Workforce Now & PAR Separation Alignment Status
                </h3>
                <p className="text-xs text-blue-100 mt-1 max-w-2xl leading-relaxed">
                  Every employee termination processed in the SST PAR portal must reconcile with an official separation reason, last day worked (LDW), TRS notice, and ADP payroll execution batch confirmation.
                </p>
              </div>

              <div className="flex items-center space-x-2.5 shrink-0">
                <button
                  onClick={handleBatchPushTerminations}
                  className="px-4 py-2.5 bg-amber-400 text-blue-950 font-black rounded-2xl text-xs hover:bg-amber-300 transition-all shadow-md flex items-center space-x-2"
                >
                  <RefreshCw className="w-4 h-4 text-blue-950" />
                  <span>Push All Completed Terminations to ADP</span>
                </button>
              </div>
            </div>

            {/* Reconciliation Comparison Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                <div>
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                    Separations Reconciliation Ledger (PAR vs ADP)
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Active & completed separation records cross-referenced against ADP Workforce Now.
                  </p>
                </div>
                <span className="text-xs font-black text-slate-700 bg-white border border-slate-200 px-2.5 py-1 rounded-xl">
                  {pars.filter(p => p.actionType === 'termination').length} Separation Records
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-xs text-left">
                  <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="px-4 py-3">PAR Tracking #</th>
                      <th className="px-4 py-3">Staff Member (Position ID)</th>
                      <th className="px-4 py-3">Separation Reason & Type</th>
                      <th className="px-4 py-3">Last Day Worked (LDW)</th>
                      <th className="px-4 py-3">PAR Stage</th>
                      <th className="px-4 py-3">ADP Status</th>
                      <th className="px-4 py-3">ADP Batch #</th>
                      <th className="px-4 py-3 text-right">Alignment</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {pars
                      .filter(p => p.actionType === 'termination')
                      .map(par => {
                        const matchedWorker = staffList.find(w => w.adpId === par.employeeId || w.associateId === par.employeeId);
                        const isCompleted = par.currentStage === 'completed';
                        const isAdpTerminated = matchedWorker?.employmentStatus === 'Terminated';

                        return (
                          <tr key={par.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="px-4 py-3 font-mono font-bold text-blue-900">
                              <button
                                onClick={() => onSelectPar && onSelectPar(par)}
                                className="hover:underline flex items-center space-x-1"
                              >
                                <span>{par.trackingNumber}</span>
                                <ExternalLink className="w-3 h-3 text-blue-600" />
                              </button>
                            </td>

                            <td className="px-4 py-3">
                              <div className="font-bold text-slate-900">{par.firstName} {par.lastName}</div>
                              <div className="text-[10px] text-slate-500 font-mono">ADP: {par.employeeId} · {par.campus}</div>
                            </td>

                            <td className="px-4 py-3">
                              <div className="font-semibold text-slate-800">{par.reasonForTermination}</div>
                              <div className="text-[10px] text-slate-500 flex items-center space-x-1 mt-0.5">
                                <span className={`px-1.5 py-0.2 rounded font-black uppercase text-[9px] ${
                                  par.isVoluntary ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'
                                }`}>
                                  {par.isVoluntary ? 'Voluntary Resignation' : 'Involuntary Termination'}
                                </span>
                                <span>· Rehire: {par.markRehireStatus ? 'Yes' : 'No'}</span>
                              </div>
                            </td>

                            <td className="px-4 py-3 font-semibold text-slate-800">
                              {formatDate(par.lastDayWorked || par.effectiveDate)}
                            </td>

                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black ${
                                isCompleted 
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-amber-100 text-amber-800 border border-amber-300'
                              }`}>
                                {isCompleted ? '✓ Completed' : par.currentStage.replace(/_/g, ' ')}
                              </span>
                            </td>

                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black ${
                                isAdpTerminated
                                  ? 'bg-slate-200 text-slate-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}>
                                {matchedWorker?.employmentStatus || 'Unknown'}
                              </span>
                            </td>

                            <td className="px-4 py-3 font-mono text-[11px] text-slate-700">
                              {matchedWorker?.adpBatchNumber || (isCompleted ? 'ADP-BATCH-CONFIRMED' : 'Pending Closeout')}
                            </td>

                            <td className="px-4 py-3 text-right">
                              {isCompleted && isAdpTerminated ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black bg-emerald-100 text-emerald-800">
                                  <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />
                                  100% Aligned
                                </span>
                              ) : isCompleted && !isAdpTerminated ? (
                                <button
                                  onClick={handleBatchPushTerminations}
                                  className="inline-flex items-center px-2.5 py-1 rounded-xl text-[10px] font-black bg-amber-400 text-blue-950 hover:bg-amber-300 transition-colors shadow-2xs"
                                >
                                  <span>Update ADP Now</span>
                                </button>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-800">
                                  In Routing
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Compliance Guidelines */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200 text-xs text-slate-600 flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-[#b91c1c] shrink-0 mt-0.5" />
              <div className="text-[11px] leading-relaxed">
                <strong className="text-slate-900 font-bold block mb-0.5">Texas Charter HR Statutory Requirements:</strong>
                All separations must complete TRS Form 10 notice within 30 days of the last day worked. Benefits coordinators must issue federal COBRA notices within 14 days of separation. Final paychecks must reflect audited PTO adjustments in ADP Workforce Now prior to issuing batch confirmations.
              </div>
            </div>

          </div>
        )}

        {/* TAB 3: ADP API & SYNC SETTINGS */}
        {activeTab === 'settings' && (
          <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 space-y-6">
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs max-w-3xl mx-auto space-y-5">
              <div className="border-b border-slate-200 pb-4">
                <h3 className="text-base font-black text-slate-900 tracking-tight">
                  ADP Workforce Now® API & Sync Configuration
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Configure direct API connectivity, automatic staff roster ingestion, and webhook listeners.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2 rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-xs font-bold text-slate-800 uppercase tracking-wider">Live ADP connection (Firebase)</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {!firebaseOn
                          ? 'Not connected. The search uses the sample roster and CSV imports. Setup: docs/adp-firebase-setup.md.'
                          : adpConfig.lastSyncTimestamp
                            ? `ADP roster refreshed ${new Date(adpConfig.lastSyncTimestamp).toLocaleString()}. Refreshes daily at 5:00 AM Central.`
                            : 'Connected. Sign in to load the daily ADP roster.'}
                      </div>
                      {firebaseOn && adpConfig.lastSyncError && (
                        <div className="text-[11px] font-semibold text-amber-800 mt-1">Last daily pull failed: {adpConfig.lastSyncError}</div>
                      )}
                    </div>
                    <span className={`shrink-0 w-2.5 h-2.5 rounded-full ${firebaseOn && districtUser ? 'bg-emerald-500' : firebaseOn ? 'bg-amber-400' : 'bg-slate-300'}`} />
                  </div>
                  {firebaseOn && (
                    <div className="flex flex-wrap items-center gap-2">
                      {districtUser ? (
                        <>
                          <span className="text-[11px] text-slate-600">Signed in as <strong>{districtUser.email}</strong></span>
                          <button
                            onClick={handlePullNow}
                            disabled={isPulling}
                            className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-[11px] font-bold hover:bg-slate-800 disabled:opacity-60"
                          >
                            {isPulling ? 'Pulling from ADP… (a few minutes)' : 'Pull from ADP now'}
                          </button>
                          <button
                            onClick={() => signOutDistrictGoogle()}
                            className="px-3 py-1.5 border border-slate-300 rounded-lg text-[11px] font-semibold text-slate-700 hover:bg-white"
                          >
                            Sign out
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={handleSignIn}
                          className="px-3 py-1.5 bg-[#0f2352] text-white rounded-lg text-[11px] font-bold hover:bg-[#1a3880]"
                        >
                          Sign in with district Google account
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Google Apps Script Webhook Relay URL
                  </label>
                  <input
                    type="text"
                    value={adpConfig.webhookUrl || ''}
                    onChange={(e) => setAdpConfig({ ...adpConfig, webhookUrl: e.target.value })}
                    placeholder="https://script.google.com/macros/s/.../exec"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="autoSync"
                    checked={adpConfig.autoSyncOnParComplete}
                    onChange={(e) => setAdpConfig({ ...adpConfig, autoSyncOnParComplete: e.target.checked })}
                    className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <label htmlFor="autoSync" className="text-xs font-bold text-slate-800 cursor-pointer">
                    Auto-update ADP status when Separation PAR reaches Completed
                  </label>
                </div>

                <button
                  onClick={() => {
                    saveStoredAdpConfig(adpConfig);
                    onToast('ADP connection configuration saved.', 'success');
                  }}
                  className="px-5 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors shadow-xs"
                >
                  Save Configuration
                </button>
              </div>
            </div>
          </div>
        )}

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
              {districtName} · ADP Workforce Now® Staff Gateway
            </span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors shadow-xs"
          >
            Close Directory
          </button>
        </div>

      </div>

      {/* CSV Quick Import Modal */}
      {csvUploadModalOpen && (
        <div className="fixed inset-0 z-60 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 space-y-4 shadow-2xl border border-slate-200 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center space-x-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-sm">Import ADP Staff Export (CSV)</h3>
              </div>
              <button onClick={() => setCsvUploadModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-500">
              Paste raw CSV data exported from ADP Workforce Now (Standard Worker Demographics report).
            </p>
            <textarea
              rows={8}
              value={csvInput}
              onChange={(e) => setCsvInput(e.target.value)}
              placeholder="Paste the CSV export from ADP. The first line must be the column headers, for example:&#10;Associate ID, Legal First Name, Legal Last Name, Job Title, Home Work Location, Position Status, Hire Date"
              className="w-full p-3 font-mono text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setCsvUploadModalOpen(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={handleCsvImport}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800"
              >
                Import Records
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
