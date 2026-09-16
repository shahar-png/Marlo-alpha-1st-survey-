/**
 * Marlo alpha — Survey 1 log + Email 1 sender.
 * Standalone Apps Script project "Marlo survey 1" in jenny@saymarlo.com's Drive; writes to the sheet "survey-1-answers" by id.
 * (A sheet-bound script could not be opened from Jenny's account, so it is standalone. Same behaviour.)
 *
 * Install (as Jenny):
 *   1. script.google.com → New project → name it "Marlo survey 1" → replace Code.gs with this file → Save.
 *   2. Project Settings → Script Properties → add SECRET = <long random string>. Same value goes to Vercel as APPS_SCRIPT_SECRET.
 *   3. Deploy → New deployment → type "Web app" → Execute as: Me (jenny@) → Who has access: Anyone → Deploy.
 *      Authorize when asked. Copy the Web app URL → Vercel APPS_SCRIPT_URL.
 *   4. Re-deploy (Manage deployments → edit → new version) after any code change; the URL stays the same.
 *
 * Flow: Vercel /api/apply and /api/deep-dive POST {secret, tab, columns, row, dupCols}. /api/waiver POSTs {secret, action:"waiver", …}
 * (see waiver_ below: files the signed PDF in Drive, emails it from Jenny's inbox, logs a "Waiver" row). The script appends the row (header on first use),
 * sends the email for that tab from Jenny's inbox (tabs in MAIL only — "Survey 2" sends nothing), stamps the sent time,
 * and returns {rowIndex, gid, sheetId} so the caller can link the row from Notion ("Survey 2 raw").
 * Text = 02_Acceptance/email-1-we-got-it.md, verbatim. Change it there first, then here.
 */
var SHEET_ID = "1O3R50Gk2ZXDZQjAUcvKKFQrzOoYabfIEJ8BUJAELVS8"; // survey-1-answers
var FROM_NAME = "The Marlo team";

var EMAIL1_SUBJECT = "Marlo — we got your application";
function email1Body(first) {
  return "Hi " + first + ",\n\n" +
    "Thanks for applying to the Marlo alpha. Your application is in, and we're reading it now — every one, ourselves.\n\n" +
    "We'll get back to you shortly with the next step.\n\n" +
    "Really glad you're here.\n\n" +
    "— The Marlo team";
}

var LATER_SUBJECT = "Marlo — you're on the list";
function laterBody() {
  return "Hi,\n\n" +
    "Done. We've added you to our list and will contact you when a suitable opportunity arises.\n\n" +
    "— The Marlo team";
}

// tab → { sentCol, subject, body(row) }
var MAIL = {
  "Survey 1":    { sentCol: "email1_sent_at", subject: EMAIL1_SUBJECT, body: function (r) { return email1Body(r.first_name || "there"); } },
  "Later round": { sentCol: "email_sent_at",  subject: LATER_SUBJECT,  body: function () { return laterBody(); } }
};

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var p = JSON.parse(e.postData.contents || "{}");
    var secret = PropertiesService.getScriptProperties().getProperty("SECRET");
    if (!secret || p.secret !== secret) return out_({ error: "unauthorized" });
    if (p.action === "waiver") return waiver_(p);
    if (!p.tab || !p.columns || !p.row) return out_({ error: "bad_request" });

    var ss = SpreadsheetApp.openById(SHEET_ID);
    var sh = ss.getSheetByName(p.tab) || ss.insertSheet(p.tab);
    var values = sh.getDataRange().getValues();
    if (values.length === 0 || !values[0][0]) { sh.getRange(1, 1, 1, p.columns.length).setValues([p.columns]); values = [p.columns]; }
    var header = values[0];

    // Duplicate guard (email / phone) for callers that have no database of their own.
    var dupCols = p.dupCols || [];
    for (var r = 1; r < values.length && dupCols.length; r++) {
      for (var d = 0; d < dupCols.length; d++) {
        var i = header.indexOf(dupCols[d]);
        var want = String(p.row[dupCols[d]] || "").toLowerCase();
        if (i >= 0 && want && String(values[r][i] || "").toLowerCase() === want) return out_({ ok: true, duplicate: true });
      }
    }

    var line = header.map(function (h) { return p.row[h] != null ? String(p.row[h]) : ""; });
    sh.appendRow(line);
    var rowIndex = sh.getLastRow();

    var m = MAIL[p.tab];
    var to = String(p.row.email || "").trim();
    if (m && to) {
      try {
        GmailApp.sendEmail(to, m.subject, m.body(p.row), { name: FROM_NAME });
        var iSent = header.indexOf(m.sentCol);
        if (iSent >= 0) sh.getRange(rowIndex, iSent + 1).setValue(new Date().toISOString());
      } catch (err) {
        Logger.log("send failed row " + rowIndex + ": " + err);
        return out_({ ok: true, duplicate: false, emailed: false, warn: String(err), rowIndex: rowIndex, gid: sh.getSheetId(), sheetId: SHEET_ID });
      }
    }
    // Jenny's trigger: a "New application" notice in her inbox (cc Shahar) for every Survey 1 / later-round row.
    try { notifyNew_(p.tab, p.row, rowIndex); } catch (err) { Logger.log("notify failed: " + err); }
    return out_({ ok: true, duplicate: false, emailed: Boolean(m && to), rowIndex: rowIndex, gid: sh.getSheetId(), sheetId: SHEET_ID });
  } catch (err) {
    return out_({ error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

/* ---------- Jenny's trigger: "New application" notice ---------- */

var NOTIFY_TO = "jenny@saymarlo.com";
var NOTIFY_CC = "shahar@saymarlo.com";

function notionUrl_(id) { return id ? "https://www.notion.so/" + String(id).replace(/-/g, "") : ""; }

function notifyNew_(tab, r, rowIndex) {
  if (tab !== "Survey 1" && tab !== "Later round") return;
  var name = r.full_name || r.email || "someone";
  var subject, body;
  if (tab === "Survey 1") {
    subject = "[Alpha] New application \u2014 " + name + " \u00b7 " + (r.icp_bucket || "no bucket");
    body =
      "A Survey 1 application just landed. Run the gates (guide A5\u2013A9) and send Email 2 or 3 within 1 business day.\n\n" +
      "Name: " + name + "\n" +
      "Email: " + (r.email || "") + "\n" +
      "Phone: " + (r.phone || "") + "\n" +
      "Age band: " + (r.age_band || "") + " \u00b7 Sex: " + (r.sex || "") + "\n" +
      "Bucket: " + (r.icp_bucket || "") + " \u00b7 Fit: " + (r.fit || "") + (r.fit_text ? " \u2014 " + r.fit_text : "") + "\n" +
      "Frequency: " + (r.frequency || "") + "\n" +
      "Supplements: " + (r.supplements || "") + (r.supplements_other ? " \u00b7 other: " + r.supplements_other : "") + "\n" +
      "Rx: " + (r.rx || "no") + (r.rx_text ? " \u2014 " + r.rx_text : "") + "\n" +
      "Self-declared on the deal screen: iPhone \u00b7 US \u00b7 18+\n\n" +
      "Card: " + (notionUrl_(r.notion_page_id) || "(no Notion page \u2014 the write failed; create it from the sheet row)") + "\n" +
      "Sheet row: https://docs.google.com/spreadsheets/d/" + SHEET_ID + "/edit#range=A" + rowIndex + "\n\n" +
      "Check for an Invited card with the same name or phone and merge before you decide.";
  } else {
    subject = "[Alpha] Later-round signup \u2014 " + name;
    body = "Someone opted into the later-round list from the deal screen (didn't fit this round).\n\nEmail: " + (r.email || "") + "\nReason: " + (r.reason || "") + "\nCard: " + notionUrl_(r.notion_page_id) + "\n\nNothing to send; keep the row.";
  }
  GmailApp.sendEmail(NOTIFY_TO, subject, body, { name: "Marlo alpha \u2014 pipeline", cc: NOTIFY_CC });
}

/* ---------- Signed waiver: file in Drive, email the copy, log a row ---------- */

var WAIVER_FOLDER_ID = "1Repk5sVGxBj2XCKCObu0Uzqne9W5zqI-"; // Alpha program / 02_Acceptance (agreement, waiver) — cloud copy
var WAIVER_CC = "jenny@saymarlo.com";
var WAIVER_COLUMNS = ["signed_at", "notion_page_id", "email", "name", "waiver_version", "text_hash", "signature_kind", "ip", "user_agent", "drive_url", "emailed"];

function waiverSubject(first) { return "Marlo — your signed agreement"; }
function waiverBody(first) {
  return "Hi " + first + ",\n\n" +
    "Thanks — your Marlo alpha agreement is signed. A copy is attached for your records.\n\n" +
    "Next: the short questionnaire and your first call, both linked in your \u201cYou\u2019re in\u201d email. Questions? Just reply.\n\n" +
    "\u2014 The Marlo team";
}

function waiverFolder_() {
  var parent;
  try { parent = DriveApp.getFolderById(WAIVER_FOLDER_ID); }
  catch (e) { parent = DriveApp.getRootFolder(); } // no access to the shared folder → Jenny's own Drive
  var it = parent.getFoldersByName("signed");
  return it.hasNext() ? it.next() : parent.createFolder("signed");
}

// {to, name, first_name, filename, pdfBase64, row}
function waiver_(p) {
  if (!p.to || !p.pdfBase64 || !p.filename) return out_({ error: "bad_request" });
  var bytes = Utilities.base64Decode(p.pdfBase64);
  var blob = Utilities.newBlob(bytes, "application/pdf", p.filename);

  var driveUrl = "";
  try { driveUrl = waiverFolder_().createFile(blob).getUrl(); }
  catch (err) { Logger.log("drive failed: " + err); }

  var emailed = false;
  try {
    GmailApp.sendEmail(String(p.to).trim(), waiverSubject(p.first_name), waiverBody(p.first_name || "there"), { name: FROM_NAME, cc: WAIVER_CC, attachments: [blob] });
    emailed = true;
  } catch (err) { Logger.log("waiver email failed: " + err); }

  var ss = SpreadsheetApp.openById(SHEET_ID);
  var sh = ss.getSheetByName("Waiver") || ss.insertSheet("Waiver");
  if (sh.getLastRow() === 0) sh.getRange(1, 1, 1, WAIVER_COLUMNS.length).setValues([WAIVER_COLUMNS]);
  var row = p.row || {};
  row.drive_url = driveUrl; row.emailed = emailed ? "yes" : "no";
  sh.appendRow(WAIVER_COLUMNS.map(function (h) { return row[h] != null ? String(row[h]) : ""; }));
  return out_({ ok: true, driveUrl: driveUrl, emailed: emailed, rowIndex: sh.getLastRow(), gid: sh.getSheetId(), sheetId: SHEET_ID });
}

function doGet() { return out_({ ok: true, service: "marlo-survey-1" }); }

function out_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

/** Run once from the editor (as Jenny) to grant the Drive + Gmail scopes the waiver path needs. Logs the folder it will file into. */
function authorizeWaiver() {
  var f = waiverFolder_();
  Logger.log("Signed waivers go to: " + f.getName() + " " + f.getUrl());
  Logger.log("Gmail ok, drafts: " + GmailApp.getDrafts().length);
}
