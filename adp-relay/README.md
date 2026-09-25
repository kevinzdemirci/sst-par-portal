# Connecting the PAR Portal to ADP Workforce Now

When this setup is finished, a person creating a PAR types an employee's name, picks
them from the list, and the form fills in their name, work email, ADP ID, title,
campus, salary, supervisor, and DPS SID from ADP. Every field stays editable.

## How it works

```
PAR portal (browser)  →  SST ADP relay (Cloudflare Worker)  →  ADP Workforce Now API
   staff sign in            holds ADP credentials                 hr/v2/workers
   with Google              + certificate
```

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
- Read access to the **Workers** API (`/hr/v2/workers`)
- Client credentials (a **Client ID** and **Client Secret**)
- The steps to register a **client certificate** (ADP requires one)

API Central has a cost. Confirm pricing and timeline with ADP before continuing.

### Step 2. Create the certificate request
On a Mac, open Terminal and run:

```
mkdir -p ~/sst-adp-cert && cd ~/sst-adp-cert
openssl req -new -newkey rsa:2048 -nodes \
  -keyout sst-adp.key -out sst-adp.csr \
  -subj "/C=US/ST=Texas/O=School of Science and Technology/CN=sst-adp-relay"
```

This creates two files:
- `sst-adp.csr`: upload this to ADP in API Central.
- `sst-adp.key`: the private key. **Keep it secret.** Do not email it, and never add it to this repository.

ADP returns a signed certificate. Save it in the same folder as `sst-adp.pem`.

### Step 3. Note any custom fields
If the district stores **DPS SID** or **TRS membership** in ADP custom fields, write
down each field's exact name as it appears in ADP (for example `DPS SID`). You will
enter them in Step 6. If not, skip this step; those fields stay blank for manual entry.

---

## Part B — Deploy the relay (IT, or anyone comfortable with Terminal)

### Step 4. Set up Cloudflare
1. Create a free account at https://dash.cloudflare.com/sign-up
2. In Terminal, from the project folder:
   ```
   cd ~/.gemini/antigravity/scratch/hr-par-tracker/adp-relay
   npx wrangler login
   ```

### Step 5. Upload the ADP certificate
```
npx wrangler mtls-certificate upload \
  --cert ~/sst-adp-cert/sst-adp.pem \
  --key ~/sst-adp-cert/sst-adp.key \
  --name sst-adp-cert
```
Copy the certificate ID it prints and paste it into `wrangler.toml` in place of
`REPLACE_WITH_CERTIFICATE_ID`.

### Step 6. Add the ADP credentials and settings
```
npx wrangler secret put ADP_CLIENT_ID
npx wrangler secret put ADP_CLIENT_SECRET
```
Each command asks you to paste the value. In `wrangler.toml`, set `DPS_SID_FIELD` and
`TRS_FIELD` to the custom field names from Step 3, or leave them empty. Set
`INCLUDE_SALARY = "false"` if salaries should not come from ADP.

### Step 7. Deploy the relay
```
npx wrangler deploy
```
The relay refuses every request until Step 8 is done. That is expected.

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
4. On the **Roster** tab, click **Sync**. The count should match active staff in ADP.

### Step 10. Test it
Click **Create New PAR** and type part of an employee's name in **Find employee in
ADP**. Choose the employee and check that the fields match ADP.

---

## Troubleshooting

| Message | Meaning |
|---|---|
| "Sign-in required." / "Invalid sign-in token." | The request did not come through Cloudflare Access. Open the portal at its Pages address, not GitHub Pages. |
| "Account not permitted." | The signed-in account is not an @ssttx.org address. |
| "Could not reach ADP Workforce Now." | Check the relay logs (`npx wrangler tail`). The usual causes are a wrong Client ID or Secret, an expired certificate, or API access that ADP has not activated yet. |
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
- The relay caches the roster for 10 minutes. To force a fresh pull, call
  `/api/adp/workers?refresh=1`.
- If the certificate or secret is ever exposed, revoke it in ADP API Central and
  repeat Steps 2, 5, and 6.
