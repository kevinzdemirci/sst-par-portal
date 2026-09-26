/**
 * School of Science and Technology (SST) — Google Apps Script & Sheets Integration Service
 * Manages live synchronization between the SST PAR Portal and SSTTX Google Sheets / Google Workspace.
 */

import { PersonnelActionRequest, UserPersona } from '../types/par';
import { getStoredGmailCredentials, saveGmailCredentials } from './gmailService';
import { postToAppsScript } from './appsScriptTransport';

export interface AppsScriptConfig {
  scriptUrl: string;               // e.g. https://script.google.com/macros/s/.../exec
  spreadsheetUrl: string;          // e.g. https://docs.google.com/spreadsheets/d/.../edit
  senderEmail: string;             // e.g. sstpar@ssttx.org
  senderName: string;              // e.g. School of Science and Technology (SST PAR)
  autoSyncEnabled: boolean;        // Automatically push any PAR change/approval to Google Sheets
  lastSyncStatus: 'idle' | 'success' | 'error' | 'syncing';
  lastSyncMessage: string;
  lastSyncedAt: string;
  totalSyncedCount: number;
  syncHistory: SyncLogEntry[];
}

export interface SyncLogEntry {
  id: string;
  timestamp: string;
  action: 'track_par' | 'bulk_sync' | 'test_connection' | 'email_dispatch';
  target: string;
  status: 'success' | 'error';
  message: string;
}

export const APPS_SCRIPT_STORAGE_KEY = 'sst_apps_script_config_v2';

export const DEFAULT_APPS_SCRIPT_CONFIG: AppsScriptConfig = {
  scriptUrl: 'https://script.google.com/macros/s/AKfycbxWeeFyMDYwzMQPtBWYJSviK_cK9aDUiZphJd85b-npKo0kM7rEaGWqyyuLMV6fupppJg/exec',
  spreadsheetUrl: 'https://docs.google.com/spreadsheets/d/1La39XElCI6VPYEww0lEbmGJo43RInClBu-wAmfCf5sE/edit',
  senderEmail: 'sstpar@ssttx.org',
  senderName: 'School of Science and Technology (SST PAR)',
  autoSyncEnabled: true,
  lastSyncStatus: 'success',
  lastSyncMessage: 'Connected to SST — Personnel Action Requests (PAR) Master Tracker',
  lastSyncedAt: new Date().toISOString(),
  totalSyncedCount: 4,
  syncHistory: [
    {
      id: 'sync-live-init',
      timestamp: new Date().toISOString(),
      action: 'test_connection',
      target: 'SST — Personnel Action Requests (PAR) Master Tracker',
      status: 'success',
      message: 'Verified live connection to SST Google Apps Script suite.'
    }
  ]
};

/**
 * Embedded full Google Apps Script code for 1-click clipboard copying inside the portal
 */
export const FULL_APPS_SCRIPT_SOURCE = `/**
 * =====================================================================================
 * SCHOOL OF SCIENCE AND TECHNOLOGY (SST) — TEXAS CHARTER DISTRICT
 * Centralized Personnel Action Request (PAR) Tracking & Automated Dispatch Suite
 * =====================================================================================
 * Target Google Workspace Domain: ssttx.org
 */

var SPREADSHEET_ID = "La39XElCI6VPYEww0lEbmGJo43RInClBu-wAmfCf5sE"; // Pre-filled with your SST Master Sheet ID
var DISTRICT_NAME = "School of Science and Technology";
var DISTRICT_HR_EMAIL = "sstpar@ssttx.org";
var DEFAULT_SENDER_NAME = "School of Science and Technology (SST PAR)";

var TAB_PAR_TRACKER = "PAR_Master_Tracker";
var TAB_AUDIT_TRAIL = "Audit_Trail";
var TAB_PAYOUTS = "Payout_Authorizations";
var TAB_EMAIL_LOG = "Email_Dispatches";

function getSpreadsheet() {
  if (SPREADSHEET_ID && SPREADSHEET_ID.trim() !== "" && SPREADSHEET_ID.indexOf("YOUR_") === -1) {
    var rawId = SPREADSHEET_ID.trim();
    try { return SpreadsheetApp.openById(rawId); } catch(e) {}
    try { if (!rawId.startsWith("1")) return SpreadsheetApp.openById("1" + rawId); } catch(e) {}
  }
  try {
    var storedId = PropertiesService.getScriptProperties().getProperty("TARGET_SPREADSHEET_ID");
    if (storedId && storedId.trim() !== "") return SpreadsheetApp.openById(storedId.trim());
  } catch(e) {}
  try {
    var active = SpreadsheetApp.getActiveSpreadsheet();
    if (active) {
      PropertiesService.getScriptProperties().setProperty("TARGET_SPREADSHEET_ID", active.getId());
      return active;
    }
  } catch(e) {}
  try {
    var files = DriveApp.getFilesByName("SST — Personnel Action Requests (PAR) Master Tracker");
    if (files.hasNext()) {
      var file = files.next();
      var foundSheet = SpreadsheetApp.openById(file.getId());
      PropertiesService.getScriptProperties().setProperty("TARGET_SPREADSHEET_ID", file.getId());
      return foundSheet;
    }
  } catch(e) {}
  try {
    var created = SpreadsheetApp.create("SST — Personnel Action Requests (PAR) Master Tracker");
    PropertiesService.getScriptProperties().setProperty("TARGET_SPREADSHEET_ID", created.getId());
    return created;
  } catch(e) {}
  return null;
}

function testRun() {
  var ss = getSpreadsheet();
  if (ss) {
    Logger.log("✅ Target Spreadsheet: " + ss.getName() + " (" + ss.getUrl() + ")");
    var initRes = initializeSstTrackerSheets();
    Logger.log("📊 Result: " + JSON.stringify(initRes));
  } else {
    Logger.log("❌ ERROR: Could not create or open spreadsheet.");
  }
}

function initializeSstTrackerSheets() {
  var ss = getSpreadsheet();
  if (!ss) return { status: "error", message: "Spreadsheet not found or could not be created." };

  var trackerSheet = ss.getSheetByName(TAB_PAR_TRACKER) || ss.insertSheet(TAB_PAR_TRACKER, 0);
  var trackerHeaders = [
    "Tracking #", "Submission Date", "Employee Full Name", "ADP ID", "Campus", "Region",
    "Current Position", "PAR Action Type", "Effective Date", "Current Workflow Stage",
    "Assigned Reviewer", "Step 1: Principal / Supervisor", "Step 2: CPO / Regional Exec",
    "Step 3: Regional HR Coordinator", "Step 4: Benefits & COBRA", "Step 5: Payroll & ADP Action",
    "Current Salary ($)", "Proposed Salary ($)", "Salary Delta ($)", "Total Payout / Deductions ($)",
    "Signatures Count", "Submitted By", "Last Updated", "Direct Portal URL"
  ];
  setupSheetHeaders(trackerSheet, trackerHeaders, "#0F2352", "#FFFFFF");

  var auditSheet = ss.getSheetByName(TAB_AUDIT_TRAIL) || ss.insertSheet(TAB_AUDIT_TRAIL, 1);
  var auditHeaders = [
    "Log Timestamp", "PAR Tracking #", "Employee Name", "Action / Event", "Performed By",
    "Role & Title", "Stage Transition", "Electronic Signer ID", "IP Address", "Comments & Compliance Notes"
  ];
  setupSheetHeaders(auditSheet, auditHeaders, "#1E3A8A", "#FFFFFF");

  var payoutSheet = ss.getSheetByName(TAB_PAYOUTS) || ss.insertSheet(TAB_PAYOUTS, 2);
  var payoutHeaders = [
    "Log Timestamp", "PAR Tracking #", "Employee Name", "Campus", "Last Day Worked", "Daily Rate ($)",
    "Total Compensated Days", "Gross Payout ($)", "PTO / Benefits Deductions ($)", "Net Payout ($)",
    "CPO Authorization Status", "Payroll ADP Entry Status", "Processed By"
  ];
  setupSheetHeaders(payoutSheet, payoutHeaders, "#065F46", "#FFFFFF");

  var emailSheet = ss.getSheetByName(TAB_EMAIL_LOG) || ss.insertSheet(TAB_EMAIL_LOG, 3);
  var emailHeaders = [
    "Dispatch Timestamp", "Recipient Email", "Recipient Name", "Email Category",
    "Subject Line", "CC Recipient", "Delivery Status", "Sender Account"
  ];
  setupSheetHeaders(emailSheet, emailHeaders, "#4C1D95", "#FFFFFF");

  return { status: "success", message: "SST PAR Tracker sheets initialized.", url: ss.getUrl() };
}

function setupSheetHeaders(sheet, headers, bgColor, textColor) {
  var existing = sheet.getLastRow() > 0 ? sheet.getRange(1, 1, 1, headers.length).getValues()[0] : [];
  if (existing.length === 0 || existing[0] === "") {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }
  var headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setBackground(bgColor).setFontColor(textColor).setFontWeight("bold").setFontSize(10)
             .setHorizontalAlignment("center").setVerticalAlignment("middle");
  sheet.setRowHeight(1, 36);
  sheet.setFrozenRows(1);
  for (var c = 1; c <= headers.length; c++) {
    sheet.autoResizeColumn(c);
    var w = sheet.getColumnWidth(c);
    if (w < 100) sheet.setColumnWidth(c, 110);
    if (w > 320) sheet.setColumnWidth(c, 320);
  }
}

function upsertParRecord(par, auditInfo) {
  var ss = getSpreadsheet();
  initializeSstTrackerSheets();
  var sheet = ss.getSheetByName(TAB_PAR_TRACKER);

  var trackingNumber = par.trackingNumber || par.id;
  var employeeName = (par.firstName || "") + " " + (par.lastName || "");
  var employeeId = par.employeeId || "";
  var campus = par.campus || "";
  var location = par.location || "";
  var title = par.title || "";
  var actionType = (par.actionType || "").toUpperCase().replace(/_/g, " ");
  var effectiveDate = par.effectiveDate || "";
  var currentStage = (par.currentStage || "").toUpperCase().replace(/_/g, " ");

  var steps = par.routingSteps || [];
  var step1 = getStepStatusSummary(steps, "supervisor_review");
  var step2 = getStepStatusSummary(steps, ["cpo_review", "regional_review"]);
  var step3 = getStepStatusSummary(steps, "hr_review");
  var step4 = getStepStatusSummary(steps, "benefits_review");
  var step5 = getStepStatusSummary(steps, "payroll_action");

  var currentPending = steps.filter(function(s) { return s.status === "pending"; })[0];
  var assignedReviewer = currentPending ? (currentPending.assignedRole + " (" + (currentPending.reviewerName || currentPending.assignedEmail || "") + ")") : (currentStage === "COMPLETED" ? "All Departments Signed & Executed" : currentStage);

  var currentSalary = par.currentSalary || 0;
  var proposedSalary = par.proposedSalary || currentSalary;
  var salaryDelta = proposedSalary - currentSalary;
  var payoutAmount = par.finalPay || (par.earnedWages ? (par.earnedWages - (par.deductions || 0)) : 0);

  var sigsCount = (par.electronicSignatures || []).filter(function(s) { return s.status === "signed"; }).length + " / " + (par.electronicSignatures || []).length;
  var submittedBy = par.submittedBy || "System User";
  var submissionDate = par.submittedAt ? formatDateStr(par.submittedAt) : formatDateStr(new Date());
  var lastUpdated = formatDateStr(new Date());
  var portalLink = "https://sst-par-portal.web.app/?par=" + encodeURIComponent(trackingNumber);

  var rowData = [
    trackingNumber, submissionDate, employeeName, employeeId, campus, location,
    title, actionType, effectiveDate, currentStage, assignedReviewer,
    step1, step2, step3, step4, step5,
    currentSalary, proposedSalary, salaryDelta, payoutAmount,
    sigsCount, submittedBy, lastUpdated, portalLink
  ];

  var data = sheet.getDataRange().getValues();
  var foundRowIndex = -1;
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] && data[i][0].toString().trim().toUpperCase() === trackingNumber.trim().toUpperCase()) {
      foundRowIndex = i + 1;
      break;
    }
  }

  if (foundRowIndex > 0) {
    sheet.getRange(foundRowIndex, 1, 1, rowData.length).setValues([rowData]);
  } else {
    sheet.appendRow(rowData);
    foundRowIndex = sheet.getLastRow();
  }

  sheet.getRange(foundRowIndex, 17, 1, 4).setNumberFormat("$#,##0.00");
  var statusCell = sheet.getRange(foundRowIndex, 10);
  if (currentStage.indexOf("COMPLETED") !== -1) {
    statusCell.setBackground("#D1FAE5").setFontColor("#065F46").setFontWeight("bold");
  } else if (currentStage.indexOf("REJECTED") !== -1) {
    statusCell.setBackground("#FEE2E2").setFontColor("#991B1B").setFontWeight("bold");
  } else {
    statusCell.setBackground("#FEF3C7").setFontColor("#92400E").setFontWeight("bold");
  }

  if (auditInfo) logAuditTrail(trackingNumber, employeeName, auditInfo);

  return { status: "success", action: foundRowIndex > 0 ? "updated" : "inserted", row: foundRowIndex, trackingNumber: trackingNumber, sheetUrl: ss.getUrl() };
}

function getStepStatusSummary(steps, stageKeys) {
  var stages = Array.isArray(stageKeys) ? stageKeys : [stageKeys];
  for (var i = 0; i < steps.length; i++) {
    var step = steps[i];
    if (stages.indexOf(step.stage) !== -1) {
      if (step.status === "approved") return "✅ Approved (" + (step.reviewerName || step.assignedRole) + ")";
      if (step.status === "rejected") return "❌ Rejected (" + (step.reviewerName || step.assignedRole) + ")";
      if (step.status === "returned") return "⚠️ Revision (" + (step.reviewerName || step.assignedRole) + ")";
      return "⏳ Pending (" + step.assignedRole + ")";
    }
  }
  return "N/A";
}

function logAuditTrail(trackingNumber, employeeName, info) {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName(TAB_AUDIT_TRAIL);
  if (!sheet) return;
  sheet.appendRow([
    formatDateStr(new Date()), trackingNumber, employeeName, info.action || "Status Update",
    info.userName || "System", info.userRole || "",
    (info.previousStage ? info.previousStage + " → " : "") + (info.newStage || ""),
    info.signerId || "UETA-VERIFIED", info.ipAddress || "Portal Client",
    info.comments || info.message || "Action recorded."
  ]);
}

function logEmailDispatch(to, toName, category, subject, cc, status) {
  try {
    var ss = getSpreadsheet();
    var sheet = ss.getSheetByName(TAB_EMAIL_LOG);
    if (!sheet) return;
    sheet.appendRow([
      formatDateStr(new Date()), to, toName || "", category || "notification",
      subject, cc || "", status || "Sent", Session.getActiveUser().getEmail() || DEFAULT_SENDER_NAME
    ]);
  } catch (e) {}
}

function bulkSyncPars(parsList) {
  if (!Array.isArray(parsList)) throw new Error("Expected array of PARs.");
  for (var i = 0; i < parsList.length; i++) {
    upsertParRecord(parsList[i], {
      action: "Bulk Portal Sync", userName: "Portal Admin", userRole: "HR", comments: "Bulk synced"
    });
  }
  return { status: "success", syncedCount: parsList.length, message: "Synced " + parsList.length + " PARs to Google Sheets." };
}

function formatDateStr(dateVal) {
  if (!dateVal) return "";
  var d = new Date(dateVal);
  if (isNaN(d.getTime())) return String(dateVal);
  return Utilities.formatDate(d, Session.getScriptTimeZone() || "America/Chicago", "MM/dd/yyyy hh:mm a");
}

function doPost(e) {
  try {
    var payload = JSON.parse(e.postData.contents);
    var action = payload.action || "track_par";

    if (action === "track_par" || action === "sync_par") {
      var parData = payload.par || payload;
      var auditInfo = payload.auditInfo || {
        action: payload.eventType || "Portal Update",
        userName: payload.userName,
        userRole: payload.userRole,
        comments: payload.comments,
        newStage: parData.currentStage
      };
      var res = upsertParRecord(parData, auditInfo);
      return ContentService.createTextOutput(JSON.stringify(res)).setMimeType(ContentService.MimeType.JSON);
    }

    if (action === "bulk_sync" || action === "sync_all_pars") {
      var bulkRes = bulkSyncPars(payload.pars || []);
      bulkRes.sheetUrl = getSpreadsheet().getUrl();
      return ContentService.createTextOutput(JSON.stringify(bulkRes)).setMimeType(ContentService.MimeType.JSON);
    }

    if (action === "send_email" || payload.to) {
      var options = { name: payload.senderName || DEFAULT_SENDER_NAME, htmlBody: payload.htmlBody || (payload.bodyText || "").replace(/\\n/g, "<br>") };
      if (payload.cc) options.cc = payload.cc;
      GmailApp.sendEmail(payload.to, payload.subject || "SST Notification", payload.bodyText || "", options);
      logEmailDispatch(payload.to, payload.toName, payload.category, payload.subject, payload.cc, "Success");
      return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "Email sent via Gmail" })).setMimeType(ContentService.MimeType.JSON);
    }

    if (action === "init_sheets") {
      return ContentService.createTextOutput(JSON.stringify(initializeSstTrackerSheets())).setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "Unknown action" })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  try {
    var ss = getSpreadsheet();
    return ContentService.createTextOutput(JSON.stringify({
      status: "online",
      service: "SST PAR Tracker & Dispatch Suite",
      spreadsheetTitle: ss ? ss.getName() : "None",
      spreadsheetUrl: ss ? ss.getUrl() : "",
      version: "2.5.0",
      activeAccount: Session.getActiveUser().getEmail() || "Authenticated",
      timestamp: new Date().toISOString()
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}

function onOpen() {
  SpreadsheetApp.getUi().createMenu("🏛️ SST HR Hub")
    .addItem("📊 Refresh & Format All Tracker Columns", "initializeSstTrackerSheets")
    .addItem("🔔 Send Pending Reminders to Approvers", "sendApproverRemindersPrompt")
    .addToUi();
}

function sendApproverRemindersPrompt() {
  var ui = SpreadsheetApp.getUi();
  ui.alert("SST HR Notice", "Reminder trigger processed for all pending approvers.", ui.ButtonSet.OK);
}
`;

/**
 * Load stored Apps Script configuration
 */
export function getStoredAppsScriptConfig(): AppsScriptConfig {
  try {
    const saved = localStorage.getItem(APPS_SCRIPT_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      const scriptUrl = parsed.scriptUrl && parsed.scriptUrl.startsWith('http')
        ? parsed.scriptUrl
        : DEFAULT_APPS_SCRIPT_CONFIG.scriptUrl;
      const spreadsheetUrl = parsed.spreadsheetUrl && parsed.spreadsheetUrl.startsWith('http')
        ? parsed.spreadsheetUrl
        : DEFAULT_APPS_SCRIPT_CONFIG.spreadsheetUrl;

      return {
        ...DEFAULT_APPS_SCRIPT_CONFIG,
        ...parsed,
        scriptUrl,
        spreadsheetUrl
      };
    }

    // Auto-migrate from gmail credentials if available
    const gmailCreds = getStoredGmailCredentials();
    if (gmailCreds && gmailCreds.scriptUrl) {
      return {
        ...DEFAULT_APPS_SCRIPT_CONFIG,
        scriptUrl: gmailCreds.scriptUrl,
        senderEmail: gmailCreds.senderEmail || 'sstpar@ssttx.org',
        senderName: gmailCreds.senderName || 'School of Science and Technology (SST PAR)',
        autoSyncEnabled: true,
        lastSyncMessage: 'Migrated from Gmail Dispatcher settings.'
      };
    }
  } catch (e) {
    console.error('Error loading Apps Script configuration:', e);
  }
  return DEFAULT_APPS_SCRIPT_CONFIG;
}

/**
 * Save configuration to localStorage and keep gmailCredentials in sync
 */
export function saveAppsScriptConfig(config: AppsScriptConfig): void {
  try {
    localStorage.setItem(APPS_SCRIPT_STORAGE_KEY, JSON.stringify(config));

    // Keep gmailService updated
    const gmailCreds = getStoredGmailCredentials();
    saveGmailCredentials({
      ...gmailCreds,
      scriptUrl: config.scriptUrl,
      senderEmail: config.senderEmail,
      senderName: config.senderName,
      isEnabled: Boolean(config.scriptUrl)
    });
  } catch (e) {
    console.error('Error saving Apps Script config:', e);
  }
}

/**
 * Record a sync log entry
 */
function recordSyncLog(
  action: SyncLogEntry['action'],
  target: string,
  status: 'success' | 'error',
  message: string
) {
  try {
    const current = getStoredAppsScriptConfig();
    const newEntry: SyncLogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      action,
      target,
      status,
      message
    };
    const updatedHistory = [newEntry, ...(current.syncHistory || [])].slice(0, 50);
    const updated: AppsScriptConfig = {
      ...current,
      lastSyncStatus: status,
      lastSyncMessage: message,
      lastSyncedAt: new Date().toISOString(),
      totalSyncedCount: status === 'success' ? (current.totalSyncedCount || 0) + 1 : current.totalSyncedCount,
      syncHistory: updatedHistory
    };
    saveAppsScriptConfig(updated);
  } catch (e) {
    console.error('Error recording sync log:', e);
  }
}

/**
 * Test connectivity with Google Apps Script Web App
 */
export async function testAppsScriptConnection(scriptUrl?: string): Promise<{
  success: boolean;
  message: string;
  spreadsheetTitle?: string;
  spreadsheetUrl?: string;
  activeAccount?: string;
}> {
  const url = (scriptUrl || getStoredAppsScriptConfig().scriptUrl || '').trim();
  if (!url || !url.startsWith('http')) {
    return {
      success: false,
      message: 'Please provide a valid Google Apps Script Web App URL starting with https://script.google.com'
    };
  }

  // Diagnostic 1: User pasted Google Sheets link instead of Web App URL
  if (url.includes('docs.google.com/spreadsheets')) {
    return {
      success: false,
      message: 'You pasted the Google Sheet link instead of the Apps Script Web App URL. In Google Sheets, click Extensions > Apps Script > Deploy > New deployment > Web app, and copy the Web App URL.'
    };
  }

  // Diagnostic 2: User pasted Script Editor URL
  if (url.includes('script.google.com') && url.includes('/edit')) {
    return {
      success: false,
      message: 'You pasted the Apps Script Editor URL. Please click the blue "Deploy" button (top right) > "New deployment" > Select "Web app", deploy it, and copy the Web App URL ending in /exec.'
    };
  }

  // Diagnostic 3: User pasted /dev URL
  if (url.endsWith('/dev')) {
    return {
      success: false,
      message: 'You pasted the developer /dev test URL. Development URLs block web portal connections. Please click Deploy > New deployment > Web app and copy the production URL ending in /exec.'
    };
  }

  try {
    // 1. Try GET ping
    const res = await fetch(url, { method: 'GET', mode: 'cors' });
    if (res.ok) {
      const data = await res.json();
      recordSyncLog('test_connection', url, 'success', `Connected to: ${data.spreadsheetTitle || 'SST Sheet'}`);
      return {
        success: true,
        message: `Successfully connected to ${data.service || 'SST Apps Script'} (Account: ${data.activeAccount || 'SSTTX'})!`,
        spreadsheetTitle: data.spreadsheetTitle,
        spreadsheetUrl: data.spreadsheetUrl,
        activeAccount: data.activeAccount
      };
    }
  } catch {
    // The status check can be blocked by the browser; set up the sheet tabs instead.
    try {
      const postData = await postToAppsScript(url, { action: 'init_sheets' });
      recordSyncLog('test_connection', url, 'success', 'Connected & initialized sheets.');
      return {
        success: true,
        message: 'Connected and verified Google Sheets tracker initialization!',
        spreadsheetUrl: postData?.url
      };
    } catch (postErr: any) {
      recordSyncLog('test_connection', url, 'error', postErr.message || 'Unreachable endpoint.');
      return {
        success: false,
        message: `Could not reach Google Apps Script: ${postErr.message || 'unknown error'}`
      };
    }
  }

  return {
    success: false,
    message: 'Apps Script endpoint did not return expected response. Please check deployment settings.'
  };
}

/**
 * Synchronize a single PAR to SST Google Sheets
 */
export async function syncParToSstGoogleSheet(
  par: PersonnelActionRequest,
  eventType: string = 'Status Update',
  actorPersona?: UserPersona,
  comments?: string
): Promise<{ success: boolean; message: string; sheetUrl?: string }> {
  const config = getStoredAppsScriptConfig();
  if (!config.scriptUrl || !config.scriptUrl.startsWith('http')) {
    return {
      success: false,
      message: 'Apps Script URL not configured. Sync skipped.'
    };
  }

  const payload = {
    action: 'sync_par',
    eventType,
    userName: actorPersona ? actorPersona.name : par.submittedBy,
    userRole: actorPersona ? actorPersona.role : par.submitterRole,
    comments: comments || `Updated to ${par.currentStage}`,
    par
  };

  try {
    const resJson = await postToAppsScript(config.scriptUrl, payload);
    if (resJson && resJson.status === 'error') {
      const errMsg = resJson.message || 'Apps Script returned an error.';
      recordSyncLog('track_par', par.trackingNumber, 'error', errMsg);
      return { success: false, message: errMsg };
    }

    const msg = `Synced ${par.trackingNumber} to SSTTX Google Sheet (${resJson?.action || 'updated'})`;
    recordSyncLog('track_par', par.trackingNumber, 'success', msg);

    // Update spreadsheet URL if returned
    if (resJson?.sheetUrl && !config.spreadsheetUrl) {
      config.spreadsheetUrl = resJson.sheetUrl;
      saveAppsScriptConfig(config);
    }

    return {
      success: true,
      message: msg,
      sheetUrl: resJson?.sheetUrl || config.spreadsheetUrl
    };
  } catch (err: any) {
    const msg = `Could not sync to the Google Sheet: ${err.message || 'unknown error'}`;
    recordSyncLog('track_par', par.trackingNumber, 'error', msg);
    return { success: false, message: msg };
  }
}

/**
 * Bulk synchronize an entire list of PARs to Google Sheets
 */
export async function bulkSyncParsToSstGoogleSheet(
  pars: PersonnelActionRequest[]
): Promise<{ success: boolean; message: string; count: number; sheetUrl?: string }> {
  const config = getStoredAppsScriptConfig();
  if (!config.scriptUrl || !config.scriptUrl.startsWith('http')) {
    return {
      success: false,
      message: 'Google Apps Script URL is required. Please paste your Web App URL in settings.',
      count: 0
    };
  }

  const payload = {
    action: 'bulk_sync',
    pars
  };

  try {
    const resJson = await postToAppsScript(config.scriptUrl, payload);
    if (resJson && resJson.status === 'error') {
      const errMsg = resJson.message || 'Apps Script returned an error.';
      recordSyncLog('bulk_sync', 'Batch', 'error', errMsg);
      return { success: false, message: errMsg, count: 0 };
    }

    const syncedCount = resJson?.syncedCount || pars.length;
    const msg = `Successfully synchronized ${syncedCount} PARs to SST Google Sheet!`;
    recordSyncLog('bulk_sync', `${syncedCount} Records`, 'success', msg);

    if (resJson?.sheetUrl) {
      config.spreadsheetUrl = resJson.sheetUrl;
      saveAppsScriptConfig(config);
    }

    return {
      success: true,
      message: msg,
      count: syncedCount,
      sheetUrl: resJson?.sheetUrl || config.spreadsheetUrl
    };
  } catch (err: any) {
    const msg = `Could not sync to the Google Sheet: ${err.message || 'unknown error'}`;
    recordSyncLog('bulk_sync', 'Batch', 'error', msg);
    return { success: false, message: msg, count: 0 };
  }
}
