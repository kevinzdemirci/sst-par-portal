import type { AdpRelayWorker } from '../../src/utils/adpService';
export const CHUNK_SIZE: number;
export function buildRoster(
  adpWorkers: unknown[],
  options?: { dpsSidField?: string; trsField?: string; includeSalary?: boolean; terminatedLookbackDays?: number },
  now?: Date
): AdpRelayWorker[];
export function chunkRoster<T>(workers: T[], size?: number): T[][];
