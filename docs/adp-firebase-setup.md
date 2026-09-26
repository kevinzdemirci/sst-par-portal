# Connecting the PAR Portal to ADP Workforce Now (Firebase)

When setup is finished, a person creating a PAR signs in with their @ssttx.org Google
account, types an employee's name, and the form fills in name, work email, ADP ID,
title, campus, supervisor, DPS SID, and employment type from ADP. Every field stays editable.

## How it works

```
Every day 5:00 AM Central
  Cloud Function "syncAdpRoster"  →  ADP Workforce Now  (/hr/v2/worker-demographics)
        │  (presents SST's ADP certificate; secrets in Google Secret Manager)
        ▼
  Firestore  adpRoster/meta + adpRoster/chunk-N   (only PAR fields; SSN, birth date, pay never stored)
        ▲
  PAR portal (browser)  — reads the roster after Google sign-in; firestore.rules allow only verified @ssttx.org accounts
```

- The portal reloads the roster every 6 hours while someone is signed in.
- If a daily pull fails, the previous roster is kept and the PAR form shows
  "ADP data may be out of date".
- Staff terminated more than 365 days ago are left out.
- Salary is not included: SST's API Central bundle ("Worker Demographic Data") has no pay data.

Google Apps Script cannot do this job, because ADP requires a client certificate on
every call and Apps Script's `UrlFetchApp` cannot send one.

---

## What is already done

- **ADP API Central project** "SST PAR Portal", which allows `/hr/v2/worker-demographics`.
- **Certificate pair** "SST PAR Relay", valid until 2027-09-25:
  `~/sst-adp-cert/sst-par-relay.pem` (certificate) and `~/sst-adp-cert/sst-par-relay.key`
  (private key; never share it).
- **ADP connection verified**: HTTP 200 on sign-in, about 2,000 workers returned.
- **Firebase project** created.

## Step 2. Turn on billing (Blaze plan)
Cloud Functions and Secret Manager need the pay-as-you-go **Blaze** plan. At SST's size
(one pull a day), usage stays inside Google's free allowances, so expect about $0/month.
1. In the Firebase console, click **Upgrade** (bottom-left, next to "Spark plan").
2. Choose **Blaze** and select or create a billing account.
3. When offered, set a **budget alert** of **$5**. You'll get an email if anything costs money.

## Step 3. Turn on Google sign-in
1. **Build → Authentication → Get started**.
2. Go to the **Sign-in method** tab, then **Google → Enable**. Choose your email as the support email, then click **Save**.
3. The portal is hosted at `https://sst-par-portal.web.app` (Firebase Hosting), which is already an
   authorized sign-in domain. If you add a custom domain (e.g. par.ssttx.org), add it under **Settings → Authorized domains**.

## Step 4. Create the database
1. **Build → Firestore Database → Create database**.
2. Location: **nam5 (United States)**. Mode: **Start in production mode**. Click **Create**.
   The deploy in Step 8 installs SST's security rules.

## Step 5. Register the portal as a web app
1. Click the **gear icon → Project settings**. Under **Your apps**, click the web icon **`</>`**.
2. Nickname: `SST PAR Portal`. Don't check Firebase Hosting. Click **Register app**.
3. Copy the `firebaseConfig` block it shows (apiKey, authDomain, projectId, and the rest).
   These values are not secret. They go into `src/config/firebase.ts`.

## Step 6. Sign in to Firebase from Terminal
```
cd ~/.gemini/antigravity/scratch/hr-par-tracker
npx firebase-tools login
```
A browser window opens. Sign in with the same @ssttx.org account and allow access.
Then put the Project ID into `.firebaserc` in place of `REPLACE_WITH_FIREBASE_PROJECT_ID`.

## Step 7. Store the ADP secrets in Google Secret Manager
```
npx firebase-tools functions:secrets:set ADP_CLIENT_ID
npx firebase-tools functions:secrets:set ADP_CLIENT_SECRET
npx firebase-tools functions:secrets:set ADP_CERT_PEM --data-file ~/sst-adp-cert/sst-par-relay.pem
npx firebase-tools functions:secrets:set ADP_KEY_PEM  --data-file ~/sst-adp-cert/sst-par-relay.key
```
The first two ask you to paste the value, which comes from API Central → SST PAR Portal →
Credentials. If asked to enable the Secret Manager API, answer **Y**.

## Step 8. Deploy
```
npx firebase-tools deploy --only functions,firestore
```
The first deploy may ask to enable several Google Cloud services (Cloud Functions, Cloud
Build, Artifact Registry, Cloud Scheduler, Eventarc). Answer **Y** each time. It takes a
few minutes. It's finished when you see `Deploy complete!`.

## Step 9. Run the first pull now
Instead of waiting for 5:00 AM:
1. Open https://console.cloud.google.com/cloudscheduler and select the Firebase project.
2. On the job ending in `syncAdpRoster`, open the **⋮** menu and choose **Force run**.
3. After a few minutes, **Firestore Database → Data** shows `adpRoster` with `meta` and `chunk-0`, `chunk-1`, and so on.
   `meta.lastAttempt.ok` should be `true`.

## Step 10. Publish the portal and test
```
git push origin main
npm run deploy
```
Open the portal, click **Create New PAR**, then **Sign in to search ADP staff**. Sign in
and type part of a name.

---

## Troubleshooting

| What you see | What to do |
|---|---|
| "Sign-in failed" or a popup closes right away | Check that the address you opened (e.g. `sst-par-portal.web.app`) is in **Authentication → Settings → Authorized domains**. Allow popups for the site. |
| "Use your @ssttx.org Google account" | A personal Google account was chosen. Sign in with the district account. |
| "The ADP roster has not been pulled yet" | Do Step 9, or wait until after 5:00 AM Central. |
| `meta.lastAttempt.error` or the log says `HTTP 401 invalid_client` | Wrong Client ID or Secret. A Client ID is 36 characters; on 2026-09-25 it had been pasted three times into the secret. Repeat Step 7 carefully (paste once), then run `npx firebase-tools deploy --only functions`, because functions keep the secret version from their last deploy. |
| Log says `HTTP 400 unsupported_grant_type` | The function is running code older than `5d17e38`. Redeploy with `npx firebase-tools deploy --only functions`. |
| `meta.lastAttempt.error` mentions certificate, TLS, or `HTTP 403 Invalid Scope` | The certificate expired or doesn't match its key, or the API Central project changed. Check the pair (below). |
| "Pull from ADP now" fails with a permission error, but the daily job works | Your Google Cloud organization may block public access to functions. Ask IT to allow `allUsers` as invoker for `refreshAdpRoster`, or rely on the daily pull. |

Check that the certificate and key belong together:
```
cd ~/sst-adp-cert
[ "$(openssl x509 -in sst-par-relay.pem -noout -pubkey | openssl md5)" = "$(openssl pkey -in sst-par-relay.key -pubout | openssl md5)" ] && echo MATCH || echo "NO MATCH"
```

Function logs: `npx firebase-tools functions:log --only syncAdpRoster`.

## Yearly: renew the certificate (before 2027-09-25)
1. In API Central, go to **Certificate management → Request certificate**. Save the
   private key from the **Copy/paste private key** screen before continuing, then download the certificate.
2. Run the two `--data-file` commands from Step 7 with the new files, then run
   `npx firebase-tools deploy --only functions`.

## Security notes
- ADP credentials, the certificate, and the private key live only in Google Secret Manager
  and in `~/sst-adp-cert` on the setup Mac. Never add them to this repository;
  `.gitignore` blocks `*.pem` and `*.key`.
- Firestore rules allow reading the roster only to signed-in, verified @ssttx.org
  accounts, and nobody can write to it except the Cloud Function.
- The roster holds only the fields a PAR needs. ADP's masked personal information (SSN,
  birth date) and pay are never requested or stored.
