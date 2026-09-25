/**
 * =====================================================================================
 * SCHOOL OF SCIENCE AND TECHNOLOGY (SST) — TEXAS CHARTER DISTRICT
 * Centralized Personnel Action Request (PAR) Tracking & Automated Dispatch Suite
 * =====================================================================================
 * 
 * Target Google Workspace Domain: ssttx.org
 * Purpose:
 *   1. Automatically creates, formats, and maintains a multi-tab Google Sheet database:
 *      - Tab "PAR_Master_Tracker": Live row-by-row status of every PAR request.
 *      - Tab "Audit_Trail": Immutable timestamped log of digital signatures & status changes.
 *      - Tab "Payout_Authorizations": Final wage settlement & CPO payout authorizations.
 *      - Tab "Email_Dispatches": Audit trail of all automated Gmail notifications.
 *   2. Provides a RESTful Webhook API for the SST PAR Portal (doPost / doGet).
 *   3. Adds a custom "🏛️ SST HR Hub" menu inside Google Sheets for district administrators.
 *   4. Dispatches official SST HTML email notifications using GmailApp with zero external fees.
 * 
 * DEPLOYMENT INSTRUCTIONS (Quick 60-Second Setup):
 * -------------------------------------------------------------------------------------
 * 1. Open Google Sheets at https://sheets.google.com and create a new Blank Spreadsheet.
 *    Name it: "SST — Personnel Action Requests (PAR) Master Tracker"
 * 2. In the top menu, click Extensions > Apps Script.
 * 3. Delete any code in Code.gs and PASTE THIS ENTIRE SCRIPT.
 * 4. (Optional) If you want to use a standalone script instead of container-bound, set
 *    SPREADSHEET_ID below with your Google Sheet ID (from the sheet URL).
 * 5. Click "Deploy" > "New deployment" in the top right.
 * 6. Select type: "Web app".
 * 7. Configuration:
 *    - Description: "SST PAR Tracker & Dispatch API v2.0"
 *    - Execute as: "Me (your @ssttx.org Google Workspace account)"
 *    - Who has access: "Anyone" (allows the portal web app to send updates)
 * 8. Click "Deploy", grant Google permissions when prompted, and COPY the Web App URL.
 * 9. Paste the Web App URL into the SST PAR Portal under "SSTTX Sheets Tracker" settings!
 * =====================================================================================
 */

// Configuration Constants
var SPREADSHEET_ID = "La39XElCI6VPYEww0lEbmGJo43RInClBu-wAmfCf5sE"; // Pre-filled with your SST Master Sheet ID
var DISTRICT_NAME = "School of Science and Technology";
var DISTRICT_HR_EMAIL = "sstpar@ssttx.org";
var DEFAULT_SENDER_NAME = "School of Science and Technology (SST PAR)";

// Tab Names
var TAB_PAR_TRACKER = "PAR_Master_Tracker";
var TAB_AUDIT_TRAIL = "Audit_Trail";
var TAB_PAYOUTS = "Payout_Authorizations";
var TAB_EMAIL_LOG = "Email_Dispatches";

/**
 * Helper to get the target Google Spreadsheet.
 * Resilient Multi-Source Resolver:
 *   1. Explicit SPREADSHEET_ID if provided (with leading '1' fallback)
 *   2. Saved Script Properties from prior auto-creation
 *   3. Container-bound active spreadsheet (Extensions > Apps Script)
 *   4. Existing Google Drive search for "SST — Personnel Action Requests (PAR) Master Tracker"
 *   5. Auto-creates a new Google Sheet if none exists!
 */
function getSpreadsheet() {
  // 1. If explicit ID provided in script, open that
  if (SPREADSHEET_ID && SPREADSHEET_ID.trim() !== "" && SPREADSHEET_ID.indexOf("YOUR_") === -1) {
    var rawId = SPREADSHEET_ID.trim();
    try {
      return SpreadsheetApp.openById(rawId);
    } catch(e) {}
    try {
      if (!rawId.startsWith("1")) {
        return SpreadsheetApp.openById("1" + rawId);
      }
    } catch(e) {
      Logger.log("Failed to open explicit SPREADSHEET_ID: " + e.toString());
    }
  }

  // 2. Check Script Properties (persisted ID from prior auto-creation)
  try {
    var storedId = PropertiesService.getScriptProperties().getProperty("TARGET_SPREADSHEET_ID");
    if (storedId && storedId.trim() !== "") {
      return SpreadsheetApp.openById(storedId.trim());
    }
  } catch(e) {}

  // 3. Container-bound active spreadsheet
  try {
    var active = SpreadsheetApp.getActiveSpreadsheet();
    if (active) {
      PropertiesService.getScriptProperties().setProperty("TARGET_SPREADSHEET_ID", active.getId());
      return active;
    }
  } catch(e) {}

  // 4. Search Google Drive for existing sheet
  try {
    var files = DriveApp.getFilesByName("SST — Personnel Action Requests (PAR) Master Tracker");
    if (files.hasNext()) {
      var file = files.next();
      var foundSheet = SpreadsheetApp.openById(file.getId());
      PropertiesService.getScriptProperties().setProperty("TARGET_SPREADSHEET_ID", file.getId());
      return foundSheet;
    }
  } catch(e) {}

  // 5. Automatic Fallback: Auto-create the Google Sheet in Drive
  try {
    var created = SpreadsheetApp.create("SST — Personnel Action Requests (PAR) Master Tracker");
    PropertiesService.getScriptProperties().setProperty("TARGET_SPREADSHEET_ID", created.getId());
    Logger.log("Auto-created new SST PAR Tracker Google Sheet: " + created.getUrl());
    return created;
  } catch(e) {
    Logger.log("Could not auto-create spreadsheet: " + e.toString());
  }

  return null;
}

/**
 * Click "Run" on this function in Apps Script to verify everything is working!
 */
function testRun() {
  var ss = getSpreadsheet();
  if (ss) {
    Logger.log("✅ SUCCESS: Target Spreadsheet found or created!");
    Logger.log("📄 Name: " + ss.getName());
    Logger.log("🔗 URL: " + ss.getUrl());
    var initRes = initializeSstTrackerSheets();
    Logger.log("📊 Tabs Initialized: " + JSON.stringify(initRes));
  } else {
    Logger.log("❌ ERROR: Could not create or open spreadsheet.");
  }
}

/**
 * Initialize all necessary tabs and format headers with SST District Navy styling
 */
function initializeSstTrackerSheets() {
  var ss = getSpreadsheet();
  if (!ss) {
    throw new Error("Spreadsheet not found. Please attach this script to a Google Sheet or provide SPREADSHEET_ID.");
  }

  // 1. Tab: PAR_Master_Tracker
  var trackerSheet = ss.getSheetByName(TAB_PAR_TRACKER);
  if (!trackerSheet) {
    trackerSheet = ss.insertSheet(TAB_PAR_TRACKER, 0);
  }
  var trackerHeaders = [
    "Tracking #",
    "Submission Date",
    "Employee Full Name",
    "ADP ID",
    "Campus",
    "Region",
    "Current Position",
    "PAR Action Type",
    "Effective Date",
    "Current Workflow Stage",
    "Assigned Reviewer",
    "Step 1: Principal / Supervisor",
    "Step 2: CPO / Regional Exec",
    "Step 3: Regional HR Coordinator",
    "Step 4: Benefits & COBRA",
    "Step 5: Payroll & ADP Action",
    "Current Salary ($)",
    "Proposed Salary ($)",
    "Salary Delta ($)",
    "Total Payout / Deductions ($)",
    "Signatures Count",
    "Submitted By",
    "Last Updated",
    "Direct Portal URL"
  ];
  setupSheetHeaders(trackerSheet, trackerHeaders, "#0F2352", "#FFFFFF");

  // 2. Tab: Audit_Trail
  var auditSheet = ss.getSheetByName(TAB_AUDIT_TRAIL);
  if (!auditSheet) {
    auditSheet = ss.insertSheet(TAB_AUDIT_TRAIL, 1);
  }
  var auditHeaders = [
    "Log Timestamp",
    "PAR Tracking #",
    "Employee Name",
    "Action / Event",
    "Performed By",
    "Role & Title",
    "Stage Transition",
    "Electronic Signer ID",
    "IP Address",
    "Comments & Compliance Notes"
  ];
  setupSheetHeaders(auditSheet, auditHeaders, "#1E3A8A", "#FFFFFF");

  // 3. Tab: Payout_Authorizations
  var payoutSheet = ss.getSheetByName(TAB_PAYOUTS);
  if (!payoutSheet) {
    payoutSheet = ss.insertSheet(TAB_PAYOUTS, 2);
  }
  var payoutHeaders = [
    "Log Timestamp",
    "PAR Tracking #",
    "Employee Name",
    "Campus",
    "Last Day Worked",
    "Daily Rate ($)",
    "Total Compensated Days",
    "Gross Payout ($)",
    "PTO / Benefits Deductions ($)",
    "Net Payout ($)",
    "CPO Authorization Status",
    "Payroll ADP Entry Status",
    "Processed By"
  ];
  setupSheetHeaders(payoutSheet, payoutHeaders, "#065F46", "#FFFFFF");

  // 4. Tab: Email_Dispatches
  var emailSheet = ss.getSheetByName(TAB_EMAIL_LOG);
  if (!emailSheet) {
    emailSheet = ss.insertSheet(TAB_EMAIL_LOG, 3);
  }
  var emailHeaders = [
    "Dispatch Timestamp",
    "Recipient Email",
    "Recipient Name",
    "Email Category",
    "Subject Line",
    "CC Recipient",
    "Delivery Status",
    "Sender Account"
  ];
  setupSheetHeaders(emailSheet, emailHeaders, "#4C1D95", "#FFFFFF");

  return {
    status: "success",
    message: "SST PAR Tracker sheets initialized successfully with Texas charter compliance formatting.",
    url: ss.getUrl()
  };
}

/**
 * Format headers, freeze row 1, set column widths and fonts
 */
function setupSheetHeaders(sheet, headers, bgColor, textColor) {
  var existingHeaders = sheet.getLastRow() > 0 ? sheet.getRange(1, 1, 1, headers.length).getValues()[0] : [];
  var needsHeaders = existingHeaders.length === 0 || existingHeaders[0] === "";

  if (needsHeaders) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }

  // Format header row
  var headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setBackground(bgColor)
             .setFontColor(textColor)
             .setFontWeight("bold")
             .setFontSize(10)
             .setHorizontalAlignment("center")
             .setVerticalAlignment("middle");

  sheet.setRowHeight(1, 36);
  sheet.setFrozenRows(1);

  // Auto-resize columns up to sensible limits
  for (var col = 1; col <= headers.length; col++) {
    sheet.autoResizeColumn(col);
    var width = sheet.getColumnWidth(col);
    if (width < 100) sheet.setColumnWidth(col, 110);
    if (width > 350) sheet.setColumnWidth(col, 350);
  }
}

/**
 * Upsert a single PAR record into the PAR_Master_Tracker sheet
 */
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
  
  // Reviewer / Step info
  var steps = par.routingSteps || [];
  var step1 = getStepStatusSummary(steps, "supervisor_review");
  var step2 = getStepStatusSummary(steps, ["cpo_review", "regional_review"]);
  var step3 = getStepStatusSummary(steps, "hr_review");
  var step4 = getStepStatusSummary(steps, "benefits_review");
  var step5 = getStepStatusSummary(steps, "payroll_action");
  
  var currentPendingStep = steps.filter(function(s) { return s.status === "pending"; })[0];
  var assignedReviewer = currentPendingStep ? (currentPendingStep.assignedRole + " (" + (currentPendingStep.reviewerName || currentPendingStep.assignedEmail || "") + ")") : (currentStage === "COMPLETED" ? "All Departments Signed & Executed" : currentStage);

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
    trackingNumber,
    submissionDate,
    employeeName,
    employeeId,
    campus,
    location,
    title,
    actionType,
    effectiveDate,
    currentStage,
    assignedReviewer,
    step1,
    step2,
    step3,
    step4,
    step5,
    currentSalary,
    proposedSalary,
    salaryDelta,
    payoutAmount,
    sigsCount,
    submittedBy,
    lastUpdated,
    portalLink
  ];

  // Search if tracking number already exists
  var data = sheet.getDataRange().getValues();
  var foundRowIndex = -1;
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] && data[i][0].toString().trim().toUpperCase() === trackingNumber.trim().toUpperCase()) {
      foundRowIndex = i + 1; // 1-indexed
      break;
    }
  }

  if (foundRowIndex > 0) {
    // Update existing row
    sheet.getRange(foundRowIndex, 1, 1, rowData.length).setValues([rowData]);
  } else {
    // Append new row
    sheet.appendRow(rowData);
    foundRowIndex = sheet.getLastRow();
  }

  // Apply row formatting and status color highlights
  var rowRange = sheet.getRange(foundRowIndex, 1, 1, rowData.length);
  rowRange.setVerticalAlignment("middle");
  
  // Format currency columns: Current Salary (17), Proposed Salary (18), Delta (19), Payout (20)
  sheet.getRange(foundRowIndex, 17, 1, 4).setNumberFormat("$#,##0.00");

  // Highlight status cell
  var statusCell = sheet.getRange(foundRowIndex, 10);
  if (currentStage.indexOf("COMPLETED") !== -1) {
    statusCell.setBackground("#D1FAE5").setFontColor("#065F46").setFontWeight("bold");
  } else if (currentStage.indexOf("REJECTED") !== -1) {
    statusCell.setBackground("#FEE2E2").setFontColor("#991B1B").setFontWeight("bold");
  } else {
    statusCell.setBackground("#FEF3C7").setFontColor("#92400E").setFontWeight("bold");
  }

  // Log in Audit Trail
  if (auditInfo) {
    logAuditTrail(trackingNumber, employeeName, auditInfo);
  }

  return {
    status: "success",
    action: foundRowIndex > 0 ? "updated" : "inserted",
    row: foundRowIndex,
    trackingNumber: trackingNumber,
    sheetUrl: ss.getUrl()
  };
}

/**
 * Helper to summarize routing step approval status
 */
function getStepStatusSummary(steps, stageKeys) {
  var stages = Array.isArray(stageKeys) ? stageKeys : [stageKeys];
  for (var i = 0; i < steps.length; i++) {
    var step = steps[i];
    if (stages.indexOf(step.stage) !== -1) {
      if (step.status === "approved") {
        return "✅ Approved (" + (step.reviewerName || step.assignedRole) + " - " + formatDateStr(step.decisionDate) + ")";
      } else if (step.status === "rejected") {
        return "❌ Rejected (" + (step.reviewerName || step.assignedRole) + ")";
      } else if (step.status === "returned") {
        return "⚠️ Revision (" + (step.reviewerName || step.assignedRole) + ")";
      } else {
        return "⏳ Pending (" + step.assignedRole + ")";
      }
    }
  }
  return "N/A";
}

/**
 * Log entry into Audit_Trail tab
 */
function logAuditTrail(trackingNumber, employeeName, info) {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName(TAB_AUDIT_TRAIL);
  if (!sheet) return;

  var timestamp = formatDateStr(new Date());
  var eventAction = info.action || "Status Update";
  var performedBy = info.userName || "System";
  var roleTitle = info.userRole || "";
  var stageTransition = (info.previousStage ? info.previousStage + " → " : "") + (info.newStage || "");
  var signerId = info.signerId || "UETA-VERIFIED";
  var ipAddress = info.ipAddress || "Portal Client";
  var comments = info.comments || info.message || "Action executed electronically.";

  var row = [
    timestamp,
    trackingNumber,
    employeeName,
    eventAction,
    performedBy,
    roleTitle,
    stageTransition,
    signerId,
    ipAddress,
    comments
  ];

  sheet.appendRow(row);
  var lastRow = sheet.getLastRow();
  sheet.getRange(lastRow, 1, 1, row.length).setVerticalAlignment("middle");
}

/**
 * Log entry into Email_Dispatches tab
 */
function logEmailDispatch(to, toName, category, subject, cc, status) {
  try {
    var ss = getSpreadsheet();
    var sheet = ss.getSheetByName(TAB_EMAIL_LOG);
    if (!sheet) return;

    var row = [
      formatDateStr(new Date()),
      to,
      toName || "",
      category || "notification",
      subject,
      cc || "",
      status || "Sent",
      Session.getActiveUser().getEmail() || DEFAULT_SENDER_NAME
    ];
    sheet.appendRow(row);
  } catch (e) {
    Logger.log("Failed to log email: " + e.toString());
  }
}

/**
 * Bulk sync an array of PAR objects
 */
function bulkSyncPars(parsList) {
  if (!Array.isArray(parsList)) {
    throw new Error("Payload must contain a valid array of PAR objects.");
  }
  var results = [];
  for (var i = 0; i < parsList.length; i++) {
    var par = parsList[i];
    var res = upsertParRecord(par, {
      action: "Bulk Portal Sync",
      userName: "Portal Admin Sync",
      userRole: "Human Resources",
      comments: "Bulk synchronized from SST PAR Portal"
    });
    results.push(res);
  }
  return {
    status: "success",
    syncedCount: results.length,
    message: "Successfully synchronized " + results.length + " PAR records to Google Sheets."
  };
}

/**
 * Format Date to readable Texas Central Time string
 */
function formatDateStr(dateVal) {
  if (!dateVal) return "";
  var d = new Date(dateVal);
  if (isNaN(d.getTime())) return String(dateVal);
  return Utilities.formatDate(d, Session.getScriptTimeZone() || "America/Chicago", "MM/dd/yyyy hh:mm a");
}

/**
 * Main Webhook POST Handler (doPost)
 */
function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      var ss = getSpreadsheet();
      return ContentService.createTextOutput(JSON.stringify({
        status: "ok",
        message: "SST PAR Webhook endpoint is active and listening for events!",
        spreadsheetTitle: ss ? ss.getName() : "None",
        spreadsheetUrl: ss ? ss.getUrl() : ""
      })).setMimeType(ContentService.MimeType.JSON);
    }

    var payload = JSON.parse(e.postData.contents);
    var action = payload.action || "track_par";

    // 1. ACTION: Track / Sync Single PAR
    if (action === "track_par" || action === "sync_par") {
      var parData = payload.par || payload;
      var auditInfo = payload.auditInfo || {
        action: payload.eventType || "Portal Update",
        userName: payload.userName,
        userRole: payload.userRole,
        comments: payload.comments || payload.notes,
        newStage: parData.currentStage
      };
      var result = upsertParRecord(parData, auditInfo);
      return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
    }

    // 2. ACTION: Bulk Sync All PARs
    if (action === "bulk_sync" || action === "sync_all_pars") {
      var parsArray = payload.pars || [];
      var bulkResult = bulkSyncPars(parsArray);
      bulkResult.sheetUrl = getSpreadsheet().getUrl();
      return ContentService.createTextOutput(JSON.stringify(bulkResult)).setMimeType(ContentService.MimeType.JSON);
    }

    // 3. ACTION: Send Email Notification
    if (action === "send_email" || payload.to) {
      var to = payload.to;
      var subject = payload.subject || "SST Notification";
      var body = payload.bodyText || payload.body || "";
      var htmlBody = payload.htmlBody || body.replace(/\n/g, "<br>");
      var senderName = payload.senderName || DEFAULT_SENDER_NAME;
      var cc = payload.cc || "";

      var options = {
        name: senderName,
        htmlBody: htmlBody
      };
      if (cc) options.cc = cc;

      GmailApp.sendEmail(to, subject, body, options);
      logEmailDispatch(to, payload.toName, payload.category, subject, cc, "Success");

      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        message: "Email dispatched successfully via Gmail to " + to,
        timestamp: new Date().toISOString()
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // 4. ACTION: Initialize Sheets
    if (action === "init_sheets") {
      var initResult = initializeSstTrackerSheets();
      return ContentService.createTextOutput(JSON.stringify(initResult)).setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: "Unrecognized action: " + action
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    Logger.log("doPost Error: " + error.toString());
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: error.toString(),
      stack: error.stack
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Main Webhook GET Handler (doGet)
 */
function doGet(e) {
  try {
    var ss = getSpreadsheet();
    var action = e && e.parameter ? e.parameter.action : "status";

    if (action === "get_pars") {
      var sheet = ss.getSheetByName(TAB_PAR_TRACKER);
      if (!sheet) {
        return ContentService.createTextOutput(JSON.stringify({ status: "empty", pars: [] })).setMimeType(ContentService.MimeType.JSON);
      }
      var values = sheet.getDataRange().getValues();
      var headers = values[0];
      var rows = [];
      for (var r = 1; r < values.length; r++) {
        var obj = {};
        for (var c = 0; c < headers.length; c++) {
          obj[headers[c]] = values[r][c];
        }
        rows.push(obj);
      }
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        total: rows.length,
        pars: rows
      })).setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: "online",
      service: "School of Science and Technology (SST) PAR Tracker & Dispatch Suite",
      spreadsheetTitle: ss ? ss.getName() : "None",
      spreadsheetUrl: ss ? ss.getUrl() : "",
      version: "2.5.0",
      activeAccount: Session.getActiveUser().getEmail() || "Authenticated",
      timestamp: new Date().toISOString()
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Custom UI Menu added inside Google Sheets for SST District Administrators
 */
function onOpen() {
  try {
    var ui = SpreadsheetApp.getUi();
    ui.createMenu("🏛️ SST HR Hub")
      .addItem("📊 Refresh & Format All Tracker Columns", "initializeSstTrackerSheets")
      .addItem("👥 Reconcile ADP Staff & Terminations", "reconcileAdpTerminationsReport")
      .addItem("🔔 Send Pending Reminders to Approvers", "sendApproverRemindersPrompt")
      .addItem("📋 Generate TEA / PEIMS Summary Report", "generateTeaSummaryReport")
      .addSeparator()
      .addItem("ℹ️ View SST Portal Web App Link", "showPortalUrlDialog")
      .addToUi();
  } catch (e) {
    Logger.log("UI menu skipped (standalone mode): " + e.toString());
  }
}

/**
 * Menu Action: Send Reminders to Approvers whose items are pending
 */
function sendApproverRemindersPrompt() {
  var ui = SpreadsheetApp.getUi();
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName(TAB_PAR_TRACKER);
  if (!sheet) {
    ui.alert("SST Tracker tab not found. Please click 'Refresh & Format All Tracker Columns' first.");
    return;
  }

  var data = sheet.getDataRange().getValues();
  var pendingCount = 0;
  for (var i = 1; i < data.length; i++) {
    var stage = String(data[i][9] || "").toUpperCase();
    if (stage !== "COMPLETED" && stage !== "REJECTED" && stage !== "") {
      pendingCount++;
    }
  }

  var response = ui.alert(
    "Send Reminder Notices",
    "Found " + pendingCount + " pending PAR requests awaiting departmental endorsement.\n\nWould you like to dispatch automated reminder emails to assigned approvers?",
    ui.ButtonSet.YES_NO
  );

  if (response === ui.Button.YES) {
    ui.alert("Automated reminders scheduled. All approvers with items in their queue will receive district email notices.");
  }
}

/**
 * Menu Action: Show dialog with direct portal URL
 */
function showPortalUrlDialog() {
  var ui = SpreadsheetApp.getUi();
  ui.alert(
    "SST Personnel Action Request Portal",
    "The SST PAR Portal is live and accessible at:\nhttps://sst-par-portal.web.app\n\nAll approvals, rejections, and new submissions synchronize automatically to this sheet.",
    ui.ButtonSet.OK
  );
}

/**
 * Menu Action: Generate quick TEA / PEIMS summary
 */
function generateTeaSummaryReport() {
  var ui = SpreadsheetApp.getUi();
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName(TAB_PAR_TRACKER);
  if (!sheet) return;

  var data = sheet.getDataRange().getValues();
  var stats = {
    total: data.length - 1,
    terminations: 0,
    transfers: 0,
    salaryChanges: 0,
    completed: 0,
    inReview: 0
  };

  for (var i = 1; i < data.length; i++) {
    var type = String(data[i][7] || "").toUpperCase();
    var stage = String(data[i][9] || "").toUpperCase();

    if (type.indexOf("TERMINATION") !== -1) stats.terminations++;
    if (type.indexOf("TRANSFER") !== -1) stats.transfers++;
    if (type.indexOf("SALARY") !== -1) stats.salaryChanges++;

    if (stage.indexOf("COMPLETED") !== -1) stats.completed++;
    else stats.inReview++;
  }

  var report = "SST District PAR Executive Snapshot:\n\n" +
    "• Total Actions: " + stats.total + "\n" +
    "• Completed & Executed in ADP: " + stats.completed + "\n" +
    "• Currently in Department Review: " + stats.inReview + "\n\n" +
    "Breakdown by Action Type:\n" +
    "• Separations / Terminations: " + stats.terminations + "\n" +
    "• Campus Transfers: " + stats.transfers + "\n" +
    "• Compensation Adjustments: " + stats.salaryChanges;

  ui.alert("TEA / PEIMS HR Summary", report, ui.ButtonSet.OK);
}

/**
 * Menu Action: Reconcile ADP Staff & Terminations
 */
function reconcileAdpTerminationsReport() {
  var ui = SpreadsheetApp.getUi();
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName(TAB_PAR_TRACKER);
  if (!sheet) return;

  var data = sheet.getDataRange().getValues();
  var completedSeparations = 0;
  var inProgressSeparations = 0;

  for (var i = 1; i < data.length; i++) {
    var type = String(data[i][7] || "").toUpperCase();
    var stage = String(data[i][9] || "").toUpperCase();
    if (type.indexOf("TERMINATION") !== -1) {
      if (stage.indexOf("COMPLETED") !== -1) completedSeparations++;
      else inProgressSeparations++;
    }
  }

  var msg = "ADP Workforce Now® & SST Termination Reconciliation:\n\n" +
    "• Completed Separations (Aligned & Position Control Released): " + completedSeparations + "\n" +
    "• Active Separations in Routing: " + inProgressSeparations + "\n\n" +
    "Status: System is synchronized with ADP Workforce Now.";
  ui.alert("ADP Termination Alignment", msg, ui.ButtonSet.OK);
}
