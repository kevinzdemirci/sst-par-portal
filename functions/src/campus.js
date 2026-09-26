/**
 * SST campus names and ADP work-location matching for the Cloud Functions.
 * Mirrors SST_CAMPUSES (src/types/par.ts) and matchSstCampus (src/utils/formatters.ts);
 * the test suite checks that the two stay identical.
 */
export const SST_CAMPUSES = [
  // Houston Region
  'SST Champions Elementary',
  'SST Champions College Prep High School',
  'SST Spring',
  'SST Advancement',
  'SST Sugar Land',
  'SST Sugar Land College Prep High School',
  'SST The Woodlands',
  'SST Willow Creek',
  // San Antonio Region
  'SST San Antonio College Prep High School',
  'SST Discovery',
  'SST Alamo',
  'SST Northwest',
  'SST Hill Country',
  'SST Hill Country College Prep High School',
  'SST Sonterra',
  'SST Schertz Elementary',
  'SST Schertz Early Elementary',
  'SST San Antonio Regional Office',
  'NF Greg Garcia Elementary (NFPS Partner)',
  'NF Frank L. Madla Early College High School (NFPS Partner)',
  // Corpus Christi Region
  'SST Corpus Christi Elementary',
  'SST Corpus Christi Early Elementary',
  'SST Bayshore',
  'SST Corpus Christi College Prep High School',
  // District Administration
  'SST Central Office (District Administration)',
  'SST Houston Regional Office'
];

// ADP Workforce Now home work location names (after the code prefix is removed and the
// name is normalized) that differ from the portal's campus names.
const ADP_LOCATION_ALIASES = {
  'champions': 'SST Champions Elementary',
  'champions college prep': 'SST Champions College Prep High School',
  'corpus elementary': 'SST Corpus Christi Elementary',
  'cc college prep': 'SST Corpus Christi College Prep High School',
  'sugarland': 'SST Sugar Land',
  'sugarland college prep': 'SST Sugar Land College Prep High School',
  'sa college prep': 'SST San Antonio College Prep High School',
  'hill country college prep': 'SST Hill Country College Prep High School',
  'hill country cp': 'SST Hill Country College Prep High School',
  'central office': 'SST Central Office (District Administration)',
  'regional office houston': 'SST Houston Regional Office',
  'regional office san antonio': 'SST San Antonio Regional Office',
  'cc early elementary': 'SST Corpus Christi Early Elementary',
  // ADP has two Schertz locations: "2 Schertz" (Elementary) and "SST Schertz" (Early Elementary).
  '2 schertz': 'SST Schertz Elementary',
  'schertz': 'SST Schertz Early Elementary',
  'nf greg garcia elem': 'NF Greg Garcia Elementary (NFPS Partner)',
  'nf frank l madla early college hs': 'NF Frank L. Madla Early College High School (NFPS Partner)'
};

function normalizeCampusName(name) {
  return name
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/\b(sst|school of science and technology)\b/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/** Same as the portal's matchSstCampus: an exact match or known alias, never a guess. */
export function matchSstCampus(locationName) {
  if (!locationName) return undefined;
  const name = locationName.trim().replace(/^\d{6}\s+\d+(-\d+)?\s+/, '');
  const exact = SST_CAMPUSES.find(c => c.toLowerCase() === name.toLowerCase());
  if (exact) return exact;
  const target = normalizeCampusName(name).replace(/\bcampus\b/g, '').replace(/\s+/g, ' ').trim();
  if (!target) return undefined;
  if (ADP_LOCATION_ALIASES[target]) return ADP_LOCATION_ALIASES[target];
  const equal = SST_CAMPUSES.filter(c => normalizeCampusName(c) === target);
  return equal.length === 1 ? equal[0] : undefined;
}
