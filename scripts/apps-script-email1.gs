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
 * Flow: Vercel /api/apply POSTs {secret, tab, columns, row, dupCols}. The script appends the row (header on first use),
 * sends the email for that tab from Jenny's inbox, and stamps the sent time in the row. One call, no trigger.
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

    var line = header.map(function (h) { return p.row[h] != null ? p.row[h] : ""; });
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
        return out_({ ok: true, duplicate: false, emailed: false, warn: String(err) });
      }
    }
    return out_({ ok: true, duplicate: false, emailed: Boolean(m && to) });
  } catch (err) {
    return out_({ error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function doGet() { return out_({ ok: true, service: "marlo-survey-1" }); }

function out_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
