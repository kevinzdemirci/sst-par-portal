# SSTTX Google Apps Script — Centralized PAR Tracking & Email Dispatcher

This Google Apps Script enables the **School of Science and Technology (SST)** Texas charter district to seamlessly track all Personnel Action Requests (PAR) in **Google Sheets** and dispatch official district notifications via **Google Workspace Gmail** (`@ssttx.org`).

---

## 🌟 Key Capabilities

1. **Automated Multi-Tab Google Sheet Management**:
   - `PAR_Master_Tracker`: Formatted with SST Navy branding, frozen headers, currency formatting, auto-sized columns, and live tracking of all 5 approval stages.
   - `Audit_Trail`: Immutable log of every digital signature, time stamp, IP address, and transition.
   - `Payout_Authorizations`: Tracks daily rate, compensated days, deductions, net payout, and CPO authorization.
   - `Email_Dispatches`: Full delivery log of all automated emails sent from Google Workspace.

2. **Bidirectional Synchronization**:
   - When a PAR is submitted, signed, approved, revised, or rejected in the web portal, it automatically upserts the corresponding row in the Google Sheet.
   - 1-click **Bulk Sync** in the portal pushes all existing requests into Google Sheets simultaneously.

3. **In-Sheet District HR Menu**:
   - Inside Google Sheets, an **"🏛️ SST HR Hub"** menu appears with tools to:
     - Refresh & Format columns
     - Send batch reminders to pending approvers
     - Generate Texas Education Agency (TEA) / PEIMS executive summary reports

4. **Zero-Cost Gmail Dispatch**:
   - Dispatches official HTML emails authenticated from `sstpar@ssttx.org` (or any configured SST Workspace account) using Google's native `GmailApp` with zero third-party service fees.

---

## 🚀 Quick 60-Second Setup Guide

### Step 1: Create a Google Sheet
1. Open [Google Sheets](https://sheets.google.com).
2. Create a new Spreadsheet and name it:  
   **`SST — Personnel Action Requests (PAR) Master Tracker`**

### Step 2: Open Apps Script
1. In the top toolbar, click **Extensions** > **Apps Script**.
2. A new tab will open with `Code.gs`.
3. Select and delete everything in `Code.gs`.
4. Copy the entire contents of [`google-apps-script/Code.gs`](file:///Users/ekode2/.gemini/antigravity/scratch/hr-par-tracker/google-apps-script/Code.gs) and paste it into the editor.
5. Click the **Save** disk icon (or press `Ctrl+S` / `Cmd+S`).

### Step 3: Deploy as a Web App
1. In the top right corner, click **Deploy** > **New deployment**.
2. Click the gear icon next to "Select type" and choose **Web app**.
3. Fill in the deployment settings:
   - **Description**: `SST PAR Tracker & Dispatch API v2.5`
   - **Execute as**: `Me (your @ssttx.org account)`
   - **Who has access**: `Anyone` *(Note: This allows the SST Portal web app to securely POST updates to the sheet)*
4. Click **Deploy**.
5. When prompted, click **Authorize Access**, select your SST account, click **Advanced**, and proceed.
6. **Copy the Web App URL** (it will look like `https://script.google.com/macros/s/AKfycb.../exec`).

### Step 4: Link in the SST Portal
1. Open the SST PAR Portal.
2. In the top navigation, click **SSTTX Sheets Tracker** (or navigate to Gmail / Apps Script Settings).
3. Paste your Web App URL into the **Google Apps Script Web App URL** input.
4. (Optional) Paste your Google Sheet URL so administrators can click a direct link to view the spreadsheet.
5. Click **Test Connection & Initialize Sheets**.
6. Click **Sync All Records to Google Sheet**!
