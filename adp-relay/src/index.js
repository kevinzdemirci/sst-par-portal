/**
 * SST ADP Relay — Cloudflare Worker
 *
 * Holds the ADP Workforce Now API credentials and client certificate, calls ADP
 * on behalf of the PAR portal, and returns only the staff fields a PAR needs.
 *
 *   GET /workers  (any path ending in /workers) → { syncedAt, workers: [...] }
 *
 * SST's API Central project ("Worker Demographic Data (Read Only)") allows
 * /hr/v2/worker-demographics, which returns the same worker records as /hr/v2/workers
 * with sensitive personal information masked. Compensation is not included.
 *
 * Every request must come through Cloudflare Access (Google sign-in limited to
 * the district domain). The browser never sees ADP credentials.
 *
 * Bindings / settings (see wrangler.toml and README.md):
 *   ADP_CERT               mTLS certificate binding (the ADP-signed client certificate)
 *   ADP_CLIENT_ID          secret
 *   ADP_CLIENT_SECRET      secret
 *   ACCESS_TEAM_DOMAIN     e.g. ssttx.cloudflareaccess.com
 *   ACCESS_AUD             Cloudflare Access application audience (AUD) tag
 *   ALLOWED_EMAIL_DOMAIN   e.g. ssttx.org
 *   ALLOWED_ORIGINS        comma-separated origins allowed to call the relay cross-origin
 *   DPS_SID_FIELD          optional ADP custom field name/code holding the DPS SID
 *   TRS_FIELD              optional ADP custom indicator field for TRS membership
 *   INCLUDE_SALARY         "false" to omit annual salary from responses
 *   ADP_WORKERS_PATH       optional, defaults to /hr/v2/worker-demographics
 *   TERMINATED_LOOKBACK_DAYS  terminated staff older than this are left out (default 365)
 */

import { mapWorker } from './mapWorker.js';

const ADP_TOKEN_URL = 'https://accounts.adp.com/auth/oauth/v2/token';
const ADP_API_BASE = 'https://api.adp.com';
const DEFAULT_WORKERS_PATH = '/hr/v2/worker-demographics';
const PAGE_SIZE = 100;
const ROSTER_CACHE_MS = 10 * 60 * 1000;

let cachedToken = null; // { value, expiresAt }
let cachedRoster = null; // { body, expiresAt }
let cachedAccessKeys = null; // { keys, expiresAt }

export default {
  async fetch(request, env) {
    const cors = corsHeaders(request, env);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });

    const url = new URL(request.url);
    if (request.method !== 'GET' || !url.pathname.endsWith('/workers')) {
      return json({ error: 'Not found' }, 404, cors);
    }

    const identity = await verifyAccess(request, env);
    if (!identity.ok) return json({ error: identity.error }, 401, cors);

    try {
      const refresh = url.searchParams.get('refresh') === '1';
      if (!refresh && cachedRoster && cachedRoster.expiresAt > Date.now()) {
        return json(cachedRoster.body, 200, cors);
      }
      const workers = await fetchAllWorkers(env);
      const lookbackDays = Number(env.TERMINATED_LOOKBACK_DAYS) || 365;
      const cutoff = new Date(Date.now() - lookbackDays * 86400000).toISOString().slice(0, 10);
      const body = {
        syncedAt: new Date().toISOString(),
        workers: workers
          .map(w =>
            mapWorker(w, {
              dpsSidField: env.DPS_SID_FIELD,
              trsField: env.TRS_FIELD,
              includeSalary: env.INCLUDE_SALARY !== 'false'
            })
          )
          // Keep current staff and recent separations; long-gone staff only clutter the search.
          .filter(w => w.status !== 'Terminated' || !w.terminationDate || w.terminationDate >= cutoff)
      };
      cachedRoster = { body, expiresAt: Date.now() + ROSTER_CACHE_MS };
      console.log(`roster served to ${identity.email}: ${body.workers.length} workers`);
      return json(body, 200, cors);
    } catch (err) {
      console.error('ADP relay error:', err);
      return json({ error: 'Could not reach ADP Workforce Now. Check the relay logs.' }, 502, cors);
    }
  }
};

async function getAdpToken(env) {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken.value;
  const res = await env.ADP_CERT.fetch(ADP_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: env.ADP_CLIENT_ID,
      client_secret: env.ADP_CLIENT_SECRET
    })
  });
  if (!res.ok) throw new Error(`ADP token request failed: ${res.status} ${await res.text()}`);
  const data = await res.json();
  cachedToken = { value: data.access_token, expiresAt: Date.now() + (Number(data.expires_in) || 3600) * 1000 };
  return cachedToken.value;
}

async function fetchAllWorkers(env) {
  const token = await getAdpToken(env);
  const all = [];
  for (let skip = 0; ; skip += PAGE_SIZE) {
    const path = env.ADP_WORKERS_PATH || DEFAULT_WORKERS_PATH;
    const res = await env.ADP_CERT.fetch(`${ADP_API_BASE}${path}?$top=${PAGE_SIZE}&$skip=${skip}`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' }
    });
    if (res.status === 204) break; // ADP returns 204 No Content past the last page
    if (!res.ok) throw new Error(`ADP workers request failed: ${res.status} ${await res.text()}`);
    const page = (await res.json()).workers || [];
    all.push(...page);
    if (page.length < PAGE_SIZE) break;
  }
  return all;
}

/**
 * Verifies the Cloudflare Access JWT so the relay only answers signed-in district staff,
 * even if someone reaches the Worker URL directly.
 */
async function verifyAccess(request, env) {
  const token = request.headers.get('Cf-Access-Jwt-Assertion');
  if (!token) return { ok: false, error: 'Sign-in required.' };
  try {
    const [headerB64, payloadB64, signatureB64] = token.split('.');
    const header = JSON.parse(decodeBase64UrlText(headerB64));
    const payload = JSON.parse(decodeBase64UrlText(payloadB64));

    const keys = await getAccessKeys(env);
    const jwk = keys.find(k => k.kid === header.kid);
    if (!jwk) return { ok: false, error: 'Unknown signing key.' };

    const key = await crypto.subtle.importKey(
      'jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']
    );
    const valid = await crypto.subtle.verify(
      'RSASSA-PKCS1-v1_5',
      key,
      decodeBase64UrlBytes(signatureB64),
      new TextEncoder().encode(`${headerB64}.${payloadB64}`)
    );
    const audiences = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
    const email = String(payload.email || '').toLowerCase();
    const domain = String(env.ALLOWED_EMAIL_DOMAIN || '').toLowerCase();

    if (!valid) return { ok: false, error: 'Invalid sign-in token.' };
    if (!audiences.includes(env.ACCESS_AUD)) return { ok: false, error: 'Token not issued for this app.' };
    if (payload.iss !== `https://${env.ACCESS_TEAM_DOMAIN}`) return { ok: false, error: 'Unexpected token issuer.' };
    if (!payload.exp || payload.exp * 1000 < Date.now()) return { ok: false, error: 'Sign-in expired.' };
    if (domain && !email.endsWith(`@${domain}`)) return { ok: false, error: 'Account not permitted.' };
    return { ok: true, email };
  } catch {
    return { ok: false, error: 'Invalid sign-in token.' };
  }
}

async function getAccessKeys(env) {
  if (cachedAccessKeys && cachedAccessKeys.expiresAt > Date.now()) return cachedAccessKeys.keys;
  const res = await fetch(`https://${env.ACCESS_TEAM_DOMAIN}/cdn-cgi/access/certs`);
  if (!res.ok) throw new Error(`Access certs request failed: ${res.status}`);
  const { keys } = await res.json();
  cachedAccessKeys = { keys, expiresAt: Date.now() + 60 * 60 * 1000 };
  return keys;
}

function decodeBase64UrlBytes(input) {
  const base64 = input.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(input.length / 4) * 4, '=');
  return Uint8Array.from(atob(base64), c => c.charCodeAt(0));
}

function decodeBase64UrlText(input) {
  return new TextDecoder().decode(decodeBase64UrlBytes(input));
}

function corsHeaders(request, env) {
  const origin = request.headers.get('Origin') || '';
  const allowed = String(env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
  const headers = { 'Cache-Control': 'no-store', Vary: 'Origin' };
  if (origin && allowed.includes(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Access-Control-Allow-Credentials'] = 'true';
    headers['Access-Control-Allow-Methods'] = 'GET, OPTIONS';
  }
  return headers;
}

function json(body, status, headers) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, 'Content-Type': 'application/json' }
  });
}
