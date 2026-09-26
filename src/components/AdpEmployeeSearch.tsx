import React, { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { AdpWorker } from '../types/adp';
import {
  ADP_ROSTER_UPDATED_EVENT,
  getStoredAdpConfig,
  getStoredAdpStaff,
  isAdpDataStale,
  isAdpSyncDue,
  syncFromAdpApi
} from '../utils/adpService';
import { isFirebaseConfigured, signInWithDistrictGoogle, watchDistrictUser } from '../utils/firebaseClient';

interface AdpEmployeeSearchProps {
  /** DOM id for the search box; the result list and options derive their ids from it. */
  idPrefix: string;
  onSelect: (worker: AdpWorker) => void;
  inputClassName: string;
  label?: string;
}

/**
 * "Find employee in ADP" search. Searches the daily ADP roster (after district Google
 * sign-in) or the local sample/CSV roster, and hands the chosen worker to the parent form.
 */
export const AdpEmployeeSearch: React.FC<AdpEmployeeSearchProps> = ({
  idPrefix,
  onSelect,
  inputClassName,
  label = 'Find employee in ADP'
}) => {
  const liveAdp = isFirebaseConfigured();
  const [adpRoster, setAdpRoster] = useState<AdpWorker[]>(() => getStoredAdpStaff());
  const [adpConfig, setAdpConfig] = useState(() => getStoredAdpConfig());
  const [adpSignedIn, setAdpSignedIn] = useState(false);
  const [adpLoadMessage, setAdpLoadMessage] = useState('');
  const [employeeQuery, setEmployeeQuery] = useState('');
  const [isLookupOpen, setIsLookupOpen] = useState(false);
  const [activeMatch, setActiveMatch] = useState(0);

  const reloadFromStorage = () => {
    setAdpRoster(getStoredAdpStaff());
    setAdpConfig(getStoredAdpConfig());
  };

  const loadLiveRoster = async () => {
    setAdpLoadMessage('Loading ADP staff…');
    try {
      await syncFromAdpApi(getStoredAdpConfig());
      reloadFromStorage();
      setAdpLoadMessage('');
    } catch (e: any) {
      setAdpLoadMessage(e?.message || 'Could not load ADP staff.');
    }
  };

  // Refresh whenever a live roster is saved (e.g. the app's background sync finishes).
  useEffect(() => {
    window.addEventListener(ADP_ROSTER_UPDATED_EVENT, reloadFromStorage);
    return () => window.removeEventListener(ADP_ROSTER_UPDATED_EVENT, reloadFromStorage);
  }, []);

  // Once signed in, load the ADP roster right away if this browser has none or it is old.
  useEffect(
    () =>
      watchDistrictUser(user => {
        setAdpSignedIn(!!user);
        if (user && isAdpSyncDue(getStoredAdpConfig())) loadLiveRoster();
      }),
    []
  );

  const connectAdp = async () => {
    setAdpLoadMessage('Signing in…');
    try {
      await signInWithDistrictGoogle();
      setAdpLoadMessage(prev => (prev === 'Signing in…' ? '' : prev));
    } catch (e: any) {
      setAdpLoadMessage(e?.message || 'Google sign-in failed.');
    }
    // watchDistrictUser above loads the roster once the sign-in registers.
  };

  const employeeMatches = useMemo(() => {
    const tokens = employeeQuery.toLowerCase().split(/\s+/).filter(Boolean);
    if (tokens.length === 0 || employeeQuery.trim().length < 2) return [];
    const statusRank = (w: AdpWorker) => (w.employmentStatus === 'Terminated' ? 1 : 0);
    return adpRoster
      .filter(w => {
        const haystack = `${w.fullName} ${w.adpId} ${w.associateId} ${w.workEmail} ${w.jobTitle} ${w.campus}`.toLowerCase();
        return tokens.every(t => haystack.includes(t));
      })
      .sort((a, b) => statusRank(a) - statusRank(b) || a.lastName.localeCompare(b.lastName))
      .slice(0, 8);
  }, [employeeQuery, adpRoster]);

  const select = (w: AdpWorker) => {
    onSelect(w);
    setEmployeeQuery('');
    setIsLookupOpen(false);
  };

  const onLookupKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setIsLookupOpen(true);
      setActiveMatch(i => Math.min(i + 1, Math.max(employeeMatches.length - 1, 0)));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveMatch(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault(); // never submit the surrounding form from the search box
      if (isLookupOpen && employeeMatches[activeMatch]) select(employeeMatches[activeMatch]);
    } else if (e.key === 'Escape' && isLookupOpen) {
      e.stopPropagation(); // close the list, not the whole form
      setIsLookupOpen(false);
    }
  };

  return (
        <div className="relative">
          <label htmlFor={idPrefix} className="block text-[11px] font-semibold text-slate-700 mb-1">
            {label}
          </label>
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id={idPrefix}
              type="search"
              name={`${idPrefix}-query`}
              role="combobox"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              data-1p-ignore
              data-lpignore="true"
              aria-expanded={isLookupOpen && employeeQuery.trim().length >= 2}
              aria-controls={`${idPrefix}-list`}
              aria-activedescendant={isLookupOpen && employeeMatches[activeMatch] ? `${idPrefix}-${activeMatch}` : undefined}
              value={employeeQuery}
              onChange={e => {
                setEmployeeQuery(e.target.value);
                setIsLookupOpen(true);
                setActiveMatch(0);
              }}
              onFocus={() => setIsLookupOpen(true)}
              onBlur={() => setIsLookupOpen(false)}
              onKeyDown={onLookupKeyDown}
              placeholder="Start typing a staff member or Position ID"
              className={`${inputClassName} pl-8`}
            />
          </div>
          {isLookupOpen && employeeQuery.trim().length >= 2 && (
            <ul
              id={`${idPrefix}-list`}
              role="listbox"
              className="absolute z-20 mt-1 w-full max-h-72 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg"
            >
              {employeeMatches.length === 0 ? (
                <li className="px-3 py-2.5 text-[11px] text-slate-500">
                  No match in the ADP roster. Enter the employee's details below.
                </li>
              ) : (
                employeeMatches.map((w, i) => (
                  <li
                    key={w.id}
                    id={`${idPrefix}-${i}`}
                    role="option"
                    aria-selected={i === activeMatch}
                    onMouseDown={e => {
                      e.preventDefault();
                      select(w);
                    }}
                    onMouseEnter={() => setActiveMatch(i)}
                    className={`px-3 py-2 cursor-pointer border-b border-slate-100 last:border-0 ${
                      i === activeMatch ? 'bg-[#0f2352]/5' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-slate-900 truncate">{w.fullName}</span>
                      <span className="flex items-center gap-1.5 shrink-0">
                        {w.employmentStatus !== 'Active' && (
                          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                            w.employmentStatus === 'Terminated' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-800'
                          }`}>
                            {w.employmentStatus}
                          </span>
                        )}
                        <span className="font-mono text-[10px] text-slate-500">{w.adpId}</span>
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 truncate">
                      {[w.jobTitle, w.campus || w.locationName, w.workEmail].filter(Boolean).join(' · ')}
                    </div>
                  </li>
                ))
              )}
            </ul>
          )}
          {liveAdp && !adpSignedIn && (
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={connectAdp}
                className="px-2.5 py-1 rounded-md bg-[#0f2352] text-white text-[11px] font-semibold hover:bg-[#1a3880]"
              >
                Sign in to search ADP staff
              </button>
              <span className="text-[10px] text-slate-500">Use your @ssttx.org Google account.</span>
            </div>
          )}
          {adpLoadMessage && <p className="mt-1 text-[10px] font-semibold text-slate-700">{adpLoadMessage}</p>}
          {liveAdp && adpSignedIn && (isAdpDataStale(adpConfig) || adpConfig.lastSyncError) && (
            <p className="mt-1 text-[10px] font-semibold text-amber-800">
              ADP data may be out of date: the daily ADP refresh has not succeeded since{' '}
              {adpConfig.lastSyncTimestamp ? new Date(adpConfig.lastSyncTimestamp).toLocaleString() : 'setup'}.
              Confirm details against ADP.
            </p>
          )}
          <p className="mt-1 text-[10px] text-slate-500">
            {liveAdp && adpSignedIn && adpConfig.lastSyncTimestamp
              ? `${adpRoster.length} staff records from ADP Workforce Now${adpConfig.lastSyncTimestamp ? `, synced ${new Date(adpConfig.lastSyncTimestamp).toLocaleString()}` : ''}.`
              : `${adpRoster.length} staff records in the local roster (sample or CSV import). Live ADP sync is not connected yet.`}
          </p>
        </div>
  );
};
