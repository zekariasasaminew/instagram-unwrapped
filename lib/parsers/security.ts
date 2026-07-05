// Port of the ACCOUNT & SECURITY section of instagram_analysis.py.
import type { ZipEntry } from "../zip/zipReader";
import { pamBlocks, tableRows } from "../utils/htmlBlocks";
import { parseTimestamp } from "../utils/date";
import type { SecurityInfo } from "../types";

const BASE = "security_and_login_information/login_and_profile_creation/";

export async function parseSecurity(entries: ZipEntry[]): Promise<SecurityInfo> {
  const byFilename = new Map(entries.map((e) => [e.filename, e]));

  const loginRows: { time: string; ip: string; language: string }[] = [];
  const loginEntry = byFilename.get(`${BASE}login_activity.html`);
  if (loginEntry) {
    const html = await loginEntry.getText();
    for (const record of tableRows(html)) {
      loginRows.push({
        time: record["Time"] ?? "",
        ip: record["IP Address"] ?? "",
        language: record["Language Code"] ?? "",
      });
    }
  }

  let accountCreated: string | null = null;
  const signupEntry = byFilename.get(`${BASE}signup_details.html`);
  if (signupEntry) {
    const html = await signupEntry.getText();
    for (const record of tableRows(html)) {
      if (record["Time"]) accountCreated = record["Time"];
    }
  }

  let accountAgeDays: number | null = null;
  if (accountCreated) {
    const dt = parseTimestamp(accountCreated);
    if (dt) {
      accountAgeDays = Math.floor((Date.now() - dt.getTime()) / 86_400_000);
    }
  }

  const distinctIps = new Set(loginRows.map((r) => r.ip).filter(Boolean));

  const privacyChanges: { change: string; time: string }[] = [];
  const privacyEntry = byFilename.get(`${BASE}profile_privacy_changes.html`);
  if (privacyEntry) {
    const html = await privacyEntry.getText();
    for (const { header, timestamp } of pamBlocks(html)) {
      if (header && timestamp) privacyChanges.push({ change: header, time: timestamp });
    }
  }

  let passwordChangeCount = 0;
  const passwordEntry = byFilename.get(`${BASE}password_change_activity.html`);
  if (passwordEntry) {
    const html = await passwordEntry.getText();
    passwordChangeCount = tableRows(html).filter((r) => "Time" in r).length;
  }

  return {
    account_created: accountCreated,
    account_age_days: accountAgeDays,
    login_count: loginRows.length,
    distinct_ip_count: distinctIps.size,
    password_change_count: passwordChangeCount,
    privacy_changes: privacyChanges.slice(0, 20),
  };
}
