/**
 * ADP Workforce Now API client. ADP requires the district's client certificate
 * (mutual TLS) on the token call and on every API call.
 */
import https from 'node:https';

const ADP_TOKEN_URL = 'https://accounts.adp.com/auth/oauth/v2/token';
const ADP_API_BASE = 'https://api.adp.com';
const PAGE_SIZE = 100;
const MAX_PAGES = 200; // safety stop: 20,000 records

/**
 * ADP's token endpoint does not accept chunked request bodies, so every body is sent
 * with an explicit Content-Length (otherwise Node streams it chunked and ADP answers
 * "unsupported_grant_type").
 */
export function withContentLength(headers = {}, body) {
  return body === undefined ? headers : { ...headers, 'Content-Length': Buffer.byteLength(body) };
}

function httpsRequest(agent, url, { method = 'GET', headers = {}, body } = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, { method, headers: withContentLength(headers, body), agent }, res => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve({ status: res.statusCode, text: Buffer.concat(chunks).toString('utf8') }));
    });
    req.on('error', reject);
    req.setTimeout(60000, () => req.destroy(new Error(`ADP request timed out: ${url}`)));
    if (body) req.write(body);
    req.end();
  });
}

/**
 * @param {{ certPem: string, keyPem: string, clientId: string, clientSecret: string,
 *           request?: (url: string, init?: object) => Promise<{ status: number, text: string }> }} options
 *   `request` replaces the network call in tests.
 */
export function createAdpClient({ certPem, keyPem, clientId, clientSecret, request }) {
  const send = request || ((url, init) => httpsRequest(new https.Agent({ cert: certPem, key: keyPem }), url, init));

  async function getToken() {
    const res = await send(ADP_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ grant_type: 'client_credentials', client_id: clientId, client_secret: clientSecret }).toString()
    });
    if (res.status !== 200) throw new Error(`ADP sign-in failed: HTTP ${res.status} ${res.text.slice(0, 200)}`);
    const token = JSON.parse(res.text).access_token;
    if (!token) throw new Error('ADP sign-in returned no access token.');
    return token;
  }

  async function fetchAllWorkers(path) {
    const token = await getToken();
    const all = [];
    for (let page = 0; page < MAX_PAGES; page++) {
      const res = await send(`${ADP_API_BASE}${path}?$top=${PAGE_SIZE}&$skip=${page * PAGE_SIZE}`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' }
      });
      if (res.status === 204) break; // ADP returns 204 No Content past the last page
      if (res.status !== 200) throw new Error(`ADP ${path} failed: HTTP ${res.status} ${res.text.slice(0, 200)}`);
      const workers = JSON.parse(res.text).workers || [];
      all.push(...workers);
      if (workers.length < PAGE_SIZE) break;
    }
    return all;
  }

  return { fetchAllWorkers };
}
