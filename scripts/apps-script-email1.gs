/**
 * Marlo alpha — Email 1 trigger.
 * Runs inside the Google Sheet "survey-1-answers" as jenny@saymarlo.com.
 * Install: Extensions → Apps Script → paste → Triggers → add "onChange" (from spreadsheet, On change), authorize as Jenny.
 * On every new row on "Survey 1" with an empty email1_sent_at, sends Email 1 from Jenny's inbox and stamps the time.
 * On every new row on "Later round" with an empty email_sent_at, sends the "Done" note.
 * Text = 02_Acceptance/email-1-we-got-it.md, verbatim. Change it there first, then here.
 */
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

function onChange(e) {
  processTab_("Survey 1", "email", "first_name", "email1_sent_at", EMAIL1_SUBJECT, function(row) { return email1Body(row.first_name || "there"); });
  processTab_("Later round", "email", null, "email_sent_at", LATER_SUBJECT, function() { return laterBody(); });
}

function processTab_(tabName, emailCol, nameCol, sentCol, subject, bodyFn) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(tabName);
  if (!sh) return;
  var values = sh.getDataRange().getValues();
  if (values.length < 2) return;
  var header = values[0];
  var iEmail = header.indexOf(emailCol), iSent = header.indexOf(sentCol), iName = nameCol ? header.indexOf(nameCol) : -1;
  if (iEmail < 0 || iSent < 0) return;
  for (var r = 1; r < values.length; r++) {
    var row = values[r];
    var to = String(row[iEmail] || "").trim();
    if (!to || row[iSent]) continue;
    var rec = {}; header.forEach(function(h, i) { rec[h] = row[i]; });
    try {
      GmailApp.sendEmail(to, subject, bodyFn(rec), { name: FROM_NAME });
      sh.getRange(r + 1, iSent + 1).setValue(new Date().toISOString());
    } catch (err) {
      Logger.log("send failed row " + (r + 1) + ": " + err);
    }
  }
}
