// Google Sheet: raw log of every submission + Email 1 sender.
// Reached through the Apps Script web app that lives in the sheet (runs as jenny@saymarlo.com).
// No service account: the org policy iam.disableServiceAccountKeyCreation blocks JSON keys, and the
// script sends the email from Jenny's inbox anyway — so one POST does both the row and the email.

export function sheetEnabled() {
  return Boolean(process.env.APPS_SCRIPT_URL && process.env.APPS_SCRIPT_SECRET);
}

/** Append a row to `tab` (header written on first use) and send the matching email. Returns duplicate=true if `dupCols` already match a row. */
export async function sheetAppend(tab: string, columns: readonly string[], row: Record<string, string>, dupCols: string[] = []): Promise<{ duplicate: boolean; rowUrl: string }> {
  const res = await fetch(process.env.APPS_SCRIPT_URL!, {
    method: "POST",
    // text/plain avoids the CORS preflight that Apps Script cannot answer; redirect: follow is required (script.google.com → script.googleusercontent.com).
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ secret: process.env.APPS_SCRIPT_SECRET, tab, columns, row, dupCols }),
    redirect: "follow",
  });
  const text = await res.text();
  let data: { ok?: boolean; duplicate?: boolean; error?: string; rowIndex?: number; gid?: number; sheetId?: string } = {};
  try { data = JSON.parse(text); } catch { throw new Error(`apps_script_bad_response ${res.status}: ${text.slice(0, 200)}`); }
  if (!res.ok || data.error) throw new Error(`apps_script_failed: ${data.error || res.status}`);
  const rowUrl = data.sheetId && data.gid !== undefined && data.rowIndex ? `https://docs.google.com/spreadsheets/d/${data.sheetId}/edit#gid=${data.gid}&range=A${data.rowIndex}` : "";
  return { duplicate: Boolean(data.duplicate), rowUrl };
}

/**
 * Signed waiver: the Apps Script files the PDF in Drive (02_Acceptance/signed), emails it from Jenny's inbox to the
 * participant (cc Jenny), and logs a row in tab "Waiver". Returns the Drive URL of the copy and the log row.
 */
export async function waiverDeliver(input: { to: string; name: string; first_name: string; filename: string; pdfBase64: string; row: Record<string, string> }): Promise<{ driveUrl: string; rowUrl: string }> {
  const res = await fetch(process.env.APPS_SCRIPT_URL!, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ secret: process.env.APPS_SCRIPT_SECRET, action: "waiver", ...input }),
    redirect: "follow",
  });
  const text = await res.text();
  let data: { ok?: boolean; error?: string; driveUrl?: string; rowIndex?: number; gid?: number; sheetId?: string } = {};
  try { data = JSON.parse(text); } catch { throw new Error(`apps_script_bad_response ${res.status}: ${text.slice(0, 200)}`); }
  if (!res.ok || data.error) throw new Error(`apps_script_failed: ${data.error || res.status}`);
  const rowUrl = data.sheetId && data.gid !== undefined && data.rowIndex ? `https://docs.google.com/spreadsheets/d/${data.sheetId}/edit#gid=${data.gid}&range=A${data.rowIndex}` : "";
  return { driveUrl: data.driveUrl || "", rowUrl };
}
