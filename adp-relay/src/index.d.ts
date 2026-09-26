declare const relay: {
  scheduled(event: unknown, env: any, ctx: { waitUntil(p: Promise<unknown>): void }): Promise<void>;
  fetch(request: Request, env: any): Promise<Response>;
};
export default relay;
