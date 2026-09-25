export function mapWorker(
  worker: unknown,
  options?: { dpsSidField?: string; trsField?: string; includeSalary?: boolean }
): import('../../src/utils/adpService').AdpRelayWorker;
