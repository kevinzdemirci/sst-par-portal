export function createAdpClient(options: {
  certPem: string;
  keyPem: string;
  clientId: string;
  clientSecret: string;
  request?: (url: string, init?: { method?: string; headers?: Record<string, string>; body?: string }) => Promise<{ status: number; text: string }>;
}): { fetchAllWorkers(path: string): Promise<unknown[]> };
