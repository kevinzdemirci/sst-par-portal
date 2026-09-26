/**
 * IDs of the fictional sample records the portal used to ship with. Browsers that saved
 * them before they were removed drop them on load; real records are never matched.
 */
export const LEGACY_SAMPLE_PAR_IDS = ['par-sst-001', 'par-sst-002', 'par-sst-003', 'par-sst-004'];
export const LEGACY_SAMPLE_PAYOUT_IDS = ['payout-2026-001', 'payout-2026-002', 'payout-2026-003', 'payout-2026-004'];
export const LEGACY_SAMPLE_ADP_WORKER_IDS = [
  'ADP-WFN-001', 'ADP-WFN-002', 'ADP-WFN-003', 'ADP-WFN-004', 'ADP-WFN-005', 'ADP-WFN-006',
  'ADP-WFN-007', 'ADP-WFN-008', 'ADP-WFN-009', 'ADP-WFN-010', 'ADP-WFN-011', 'ADP-WFN-012'
];

export function withoutLegacySamples<T extends { id: string }>(records: T[], sampleIds: string[]): T[] {
  return records.filter(r => !sampleIds.includes(r.id));
}
