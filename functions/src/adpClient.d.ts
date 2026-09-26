export function createAdpClient(options: {
  certPem: string;
  keyPem: string;
  clientId: string;
  clientSecret: string;
  request?: (url: string, init?: { method?: string; headers?: Record<string, string>; body?: string }) => Promise<{ status: number; text: string }>;
}): { fetchAllWorkers(path: string): Promise<unknown[]> };
export function withContentLength(headers?: Record<string, string | number>, body?: string): Record<string, string | number>;
