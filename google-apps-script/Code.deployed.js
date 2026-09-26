/**
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

function handlePost_(e) {
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
      var options = { name: payload.senderName || DEFAULT_SENDER_NAME, htmlBody: payload.htmlBody || (payload.bodyText || "").replace(/\n/g, "<br>") };
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

// Only the SST PAR Portal (which knows PORTAL_KEY) may send emails or update the Sheet.
// The key is the PORTAL_KEY script property and must match the portal's APPS_SCRIPT_KEY secret.
function doPost(e) {
  if (!e || !e.postData || !e.postData.contents) return handlePost_(e);
  var key = "";
  try { key = String(JSON.parse(e.postData.contents).portalKey || "").trim(); } catch (err) {}
  var expected = getPortalKey_();
  if (!expected || key !== expected) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: "Not authorized. Use the SST PAR Portal.",
      keyCheck: keyFingerprint_(expected)
    })).setMimeType(ContentService.MimeType.JSON);
  }
  return handlePost_(e);
}

// The PORTAL_KEY script property, tolerating spaces, lowercase, or a space for the underscore in its name.
function getPortalKey_() {
  var props = PropertiesService.getScriptProperties().getProperties();
  for (var name in props) {
    if (name.replace(/[\s_]+/g, "").toUpperCase() === "PORTALKEY") return String(props[name] || "").trim();
  }
  return "";
}

// Length plus the start of a SHA-256 hash: enough to tell whether two keys match, without revealing either.
function keyFingerprint_(key) {
  if (!key) return "none";
  var digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, key, Utilities.Charset.UTF_8);
  var hex = digest.map(function(b) { return ("0" + (b & 0xff).toString(16)).slice(-2); }).join("");
  return key.length + ":" + hex.slice(0, 8);
}
