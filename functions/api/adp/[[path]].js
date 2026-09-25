// Cloudflare Pages Function: forwards /api/adp/* to the SST ADP relay Worker through a
// service binding, so the portal and the relay share one origin behind Cloudflare Access.
// Bind the Worker as ADP_RELAY in the Pages project settings (README, step 7).
export const onRequest = ({ request, env }) => env.ADP_RELAY.fetch(request);
