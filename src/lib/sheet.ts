// Google Sheet: raw log of every submission (backup + Jenny's export). One tab per form.
import { google } from "googleapis";

function api() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = (process.env.GOOGLE_PRIVATE_KEY || "").replace(/\\n/g, "\n");
  if (!email || !key) throw new Error("missing_google_credentials");
  const auth = new google.auth.JWT({ email, key, scopes: ["https://www.googleapis.com/auth/spreadsheets"] });
  return google.sheets({ version: "v4", auth });
}

export function sheetEnabled() {
  return Boolean(process.env.SHEET_ID && process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_PRIVATE_KEY);
}

/** Append a row; write the header first if the tab is empty. Returns true if a duplicate (by any of `dupCols`) already exists. */
export async function sheetAppend(tab: string, columns: readonly string[], row: Record<string, string>, dupCols: string[] = []): Promise<{ duplicate: boolean }> {
  const s = api();
  const sheetId = process.env.SHEET_ID!;
  const existing = await s.spreadsheets.values.get({ spreadsheetId: sheetId, range: `'${tab}'!A:Z` });
  const rows = existing.data.values || [];
  if (rows.length === 0) {
    await s.spreadsheets.values.append({ spreadsheetId: sheetId, range: `'${tab}'!A1`, valueInputOption: "RAW", requestBody: { values: [[...columns]] } });
  } else if (dupCols.length) {
    const idx = dupCols.map((c) => columns.indexOf(c)).filter((i) => i >= 0);
    const dup = rows.slice(1).some((r) => idx.some((i) => String(r[i] || "").toLowerCase() === String(row[columns[i]] || "").toLowerCase() && row[columns[i]]));
    if (dup) return { duplicate: true };
  }
  await s.spreadsheets.values.append({
    spreadsheetId: sheetId,
    range: `'${tab}'!A1`,
    valueInputOption: "RAW",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values: [columns.map((c) => row[c] ?? "")] },
  });
  return { duplicate: false };
}
