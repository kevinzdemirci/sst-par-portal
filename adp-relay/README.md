# Connecting the PAR Portal to ADP Workforce Now

When this setup is finished, a person creating a PAR types an employee's name, picks
them from the list, and the form fills in their name, work email, ADP ID, title,
campus, salary, supervisor, and DPS SID from ADP. Every field stays editable.

## How it works

```
PAR portal (browser)  →  SST ADP relay (Cloudflare Worker)  →  ADP Workforce Now API
   staff sign in            holds ADP credentials                 hr/v2/worker-demographics
   with Google              + certificate
```

The relay pulls the full roster from ADP **once a day at 5:00 AM Central** and saves
it in Cloudflare storage. The portal reads that saved copy, which takes about a second
instead of the minutes a full ADP pull takes, and refreshes its own copy automatically
every 6 hours. If the daily pull fails, the form shows a warning with the date of the
last good refresh.

The browser cannot call ADP directly. ADP requires a client secret and a client
certificate on every call, and neither can be placed in a web page. The relay holds
them, calls ADP, and returns only the fields a PAR needs. SSNs, birth dates, home
addresses, and bank details never leave the relay.

**Do not connect live ADP data while the portal is hosted on GitHub Pages.** That
site is public and has no real sign-in. Step 8 moves the portal behind Google sign-in
limited to @ssttx.org accounts.

---

## Part A — Get API access from ADP (HR / ADP administrator)

### Step 1. Request ADP API access
Contact your ADP account representative and ask for **ADP API Central** for Workforce
Now. It is ADP's add-on that lets a client connect its own tools. Ask for:
- **Worker Demographic Data (Read Only)**. SST's project uses this bundle, which allows
  `/hr/v2/worker-demographics` (sensitive personal information is masked). It does not
  include pay, so salary stays a manual field unless a compensation API is added.
- Client credentials (a **Client ID** and **Client Secret**)
- The steps to register a **client certificate** (ADP requires one)

API Central has a cost. Confirm pricing and timeline with ADP before continuing.

### Step 2. Create the certificate
**Recommended: API Central's generator.** Go to **Certificate management → Request
certificate** and fill in the form. On the **Copy/paste private key** screen, copy the
key and save it as `~/sst-adp-cert/sst-par-relay.key` **before continuing**, because
ADP does not keep it. Then download the certificate and save it as
`~/sst-adp-cert/sst-par-relay.pem`. SST's current pair ("SST PAR Relay") was created
this way on 2026-09-25 and expires 2027-09-25.

**Alternative: your own request.** On a Mac, open Terminal and run:

```
mkdir -p ~/sst-adp-cert && cd ~/sst-adp-cert
openssl req -new -newkey rsa:2048 -nodes \
  -keyout sst-adp.key -out sst-adp.csr \
  -subj "/C=US/ST=Texas/O=School of Science and Technology/CN=sst-adp-relay"
```

This creates two files:
- `sst-adp.csr`: upload this to ADP in API Central.
- `sst-adp.key`: the private key. **Keep it secret.** Do not email it, and never add it to this repository.

To check that a certificate and key belong together before using them:
```
cd ~/sst-adp-cert
[ "$(openssl x509 -in sst-par-relay.pem -noout -pubkey | openssl md5)" = "$(openssl pkey -in sst-par-relay.key -pubout | openssl md5)" ] && echo MATCH || echo "NO MATCH"
```

### Step 3. Note any custom fields
SST stores the DPS SID in the ADP custom field **`DPS SID&/Name`**; `wrangler.toml`
already uses it. No TRS membership field was found, so TRS defaults to "member" and
can be changed on the form.

ADP work locations (for example `015827 006-1 SST Champions`) are mapped to portal
campuses in `ADP_LOCATION_ALIASES` in `src/utils/formatters.ts`. Staff assigned to
several campuses (for example `CHAMP/CHAMPCP/HILLCOUNTRY`) get a blank campus to pick by hand.

---

## Part B — Deploy the relay (IT, or anyone comfortable with Terminal)

### Step 4. Set up Cloudflare
1. Create an account at https://dash.cloudflare.com/sign-up, preferably with an
   @ssttx.org address so the district owns it.
   **Plan:** the daily pull reads over 2,000 ADP records, which exceeds the free plan's
   10 ms CPU limit per run. Subscribe to **Workers Paid** ($5/month) under
   **Workers & Pages → Plans**. Access (sign-in) stays on the free Zero Trust plan.
2. In Terminal, from the project folder:
   ```
   cd ~/.gemini/antigravity/scratch/hr-par-tracker/adp-relay
   npx wrangler login
   ```

### Step 5. Upload the ADP certificate
```
npx wrangler mtls-certificate upload \
  --cert ~/sst-adp-cert/sst-par-relay.pem \
  --key ~/sst-adp-cert/sst-par-relay.key \
  --name sst-par-relay
```
Copy the certificate ID it prints and paste it into `wrangler.toml` in place of
`REPLACE_WITH_CERTIFICATE_ID`.

### Step 6. Add the ADP credentials, storage, and settings
```
npx wrangler secret put ADP_CLIENT_ID
npx wrangler secret put ADP_CLIENT_SECRET
npx wrangler kv namespace create ROSTER
```
The first two ask you to paste each value. The third creates the storage for the daily
roster and prints an `id`. Paste that id into `wrangler.toml` in place of
`REPLACE_WITH_KV_NAMESPACE_ID`.

The daily schedule is `crons = ["0 10 * * *"]` in `wrangler.toml` (10:00 UTC, which is
5:00 AM Central in summer and 4:00 AM in winter).

### Step 7. Deploy the relay
```
npx wrangler deploy
```
The relay refuses every request until Step 8 is done. That is expected.

To load the roster now instead of waiting for tomorrow morning, run
`npx wrangler tail` in one Terminal window. Then, in the Cloudflare dashboard, open
**Workers & Pages → sst-adp-relay → Settings → Triggers** and use **Trigger** on the
Cron Trigger (or wait for 5:00 AM). The tail window shows
`roster refreshed (scheduled): N of M ADP workers kept`.

### Step 8. Put the portal behind district sign-in
1. **Host the portal on Cloudflare Pages.** In the Cloudflare dashboard, go to
   **Workers & Pages → Create → Pages → Connect to Git**, choose the
   `sst-par-portal` repository, and use build command `npm run build` with output folder `dist`.
2. **Connect the relay to the portal.** In the Pages project, open
   **Settings → Bindings → Add → Service binding**. Set name `ADP_RELAY` and service
   `sst-adp-relay`, then redeploy the Pages project. The file
   `functions/api/adp/[[path]].js` routes `/api/adp/*` to the relay.
3. **Require Google sign-in.** In **Zero Trust → Access → Applications**, add a
   **Self-hosted** application for the Pages address (for example
   `sst-par-portal.pages.dev`). Add Google Workspace as the login method, with a policy
   that allows only emails ending in `@ssttx.org`. Cloudflare's free Zero Trust plan
   covers up to 50 users.
4. From that Access application, copy the **Application Audience (AUD) tag** and your
   **team domain** (`<team>.cloudflareaccess.com`) into `wrangler.toml`
   (`ACCESS_AUD`, `ACCESS_TEAM_DOMAIN`). Then run `npx wrangler deploy` again.

### Step 9. Turn it on in the portal
1. Open the portal at its Cloudflare Pages address and sign in with your @ssttx.org account.
2. As the CPO, go to **District Tools → ADP Staff & Terminations → Settings**.
3. Set **SST ADP Relay URL** to `/api/adp` and click **Save Configuration**.
4. On the **Roster** tab, click **Sync**. The count should match current staff plus
   separations from the last 12 months. After this, every signed-in browser refreshes
   on its own.

### Step 10. Test it
Click **Create New PAR** and type part of an employee's name in **Find employee in
ADP**. Choose the employee and check that the fields match ADP.

---

## Troubleshooting

| Message | Meaning |
|---|---|
| "Sign-in required." / "Invalid sign-in token." | The request did not come through Cloudflare Access. Open the portal at its Pages address, not GitHub Pages. |
| "Account not permitted." | The signed-in account is not an @ssttx.org address. |
| "Could not load the staff roster." / "has not been pulled from ADP yet" / the form says ADP data may be out of date | The daily pull failed. Check the relay logs (`npx wrangler tail`). The usual causes are a wrong Client ID or Secret, an expired certificate, or ADP API access that was changed. The portal keeps using the last good roster. |
| 403 "Invalid Scope" in the logs | The project is not allowed that ADP address. SST's project allows `/hr/v2/worker-demographics` only. |
| Campus is blank after choosing someone | ADP's work-location name does not exactly match an SST campus name. Select the campus manually. To make it automatic, rename the location in ADP or tell the developer the ADP name. |

## Until the API is ready: use an ADP report

You can load real staff into the search today without the API:
1. In ADP Workforce Now, create a custom report with these columns: Associate ID, Legal
   First Name, Legal Last Name, Work Contact: Work Email, Job Title Description, Home
   Work Location, Annual Salary, Reports To Name, Hire Date, Position Status, and Worker
   Category. Export it as CSV.
2. In the portal, go to **District Tools → ADP Staff & Terminations → Import CSV**
   and paste the file contents.

Imported data is stored only in that browser.

## Security notes
- ADP credentials live only in Cloudflare as encrypted secrets, and the certificate
  in Cloudflare's certificate store. Neither is in this repository or in the browser.
- The relay checks every request's Cloudflare Access sign-in token and logs which
  account requested the roster.
- The roster snapshot is refreshed daily. To pull again sooner, call
  `/api/adp/workers?refresh=1`; this only runs if the snapshot is over an hour old.
- Staff terminated more than 365 days ago are left out
  (`TERMINATED_LOOKBACK_DAYS` in `wrangler.toml`).
- If the certificate or secret is ever exposed, revoke it in ADP API Central and
  repeat Steps 2, 5, and 6.
