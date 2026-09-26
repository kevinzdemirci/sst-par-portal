/**
 * Pure roster helpers shared by the Cloud Function and the test suite.
 */
import { mapWorker } from './mapWorker.js';

// Firestore documents are limited to 1 MiB; 250 staff records are well under that.
export const CHUNK_SIZE = 250;

/**
 * Maps ADP worker records to PAR staff records and drops staff terminated longer ago
 * than the lookback window (they only clutter the search).
 */
export function buildRoster(adpWorkers, options = {}, now = new Date()) {
  const lookbackDays = Number(options.terminatedLookbackDays) || 365;
  const cutoff = new Date(now.getTime() - lookbackDays * 86400000).toISOString().slice(0, 10);
  return adpWorkers
    .map(w => mapWorker(w, options))
    .filter(w => w.status !== 'Terminated' || !w.terminationDate || w.terminationDate >= cutoff);
}

export function chunkRoster(workers, size = CHUNK_SIZE) {
  const chunks = [];
  for (let i = 0; i < workers.length; i += size) chunks.push(workers.slice(i, i + size));
  return chunks;
}
