import { describe, it, expect } from "vitest";
import { parseSecurity } from "../lib/parsers/security";
import type { ZipEntry } from "../lib/zip/zipReader";

function entry(filename: string, html: string): ZipEntry {
  return { filename, getText: async () => html };
}

const BASE = "security_and_login_information/login_and_profile_creation/";

describe("parseSecurity", () => {
  it("extracts login rows (including the colspan=2 IP Address layout), signup date, and derived stats", async () => {
    const loginHtml = `<html><body><main>
      <div class="pam"><h2>2025-01-01T00:00:00+00:00</h2><div class="_a6-p"><table><tr><td colspan="2" class="_a6_q">IP Address<div><div>10.0.0.1</div></div></td></tr><tr><td class="_a6_q">Time</td><td class="_2piu _a6_r">Jan 01, 2025 6:00 am</td></tr></table></div></div>
      <div class="pam"><h2>2025-01-02T00:00:00+00:00</h2><div class="_a6-p"><table><tr><td colspan="2" class="_a6_q">IP Address<div><div>10.0.0.2</div></div></td></tr><tr><td class="_a6_q">Time</td><td class="_2piu _a6_r">Jan 02, 2025 6:00 am</td></tr></table></div></div>
    </main></body></html>`;
    const signupHtml = `<html><body><main><div class="pam"><div class="_a6-p"><table><tr><td colspan="2" class="_a6_q">Username<div><div>Test User</div></div></td></tr><tr><td class="_a6_q">Time</td><td class="_2piu _a6_r">Jan 01, 2020 12:00 am</td></tr></table></div></div></main></body></html>`;
    const privacyHtml = `<html><body><main>
      <div class="pam"><h2>Switched to Private</h2><div class="_a6-p"><div><div>Jan 05, 2020 1:00 pm</div></div></div></div>
    </main></body></html>`;
    const passwordHtml = `<html><body><main>
      <div class="pam"><div class="_a6-p"><table><tr><td class="_a6_q">Time</td><td class="_2piu _a6_r">Jan 10, 2021 1:00 am</td></tr></table></div></div>
    </main></body></html>`;

    const entries: ZipEntry[] = [
      entry(`${BASE}login_activity.html`, loginHtml),
      entry(`${BASE}signup_details.html`, signupHtml),
      entry(`${BASE}profile_privacy_changes.html`, privacyHtml),
      entry(`${BASE}password_change_activity.html`, passwordHtml),
    ];

    const result = await parseSecurity(entries);
    expect(result.login_count).toBe(2);
    expect(result.distinct_ip_count).toBe(2);
    expect(result.account_created).toBe("Jan 01, 2020 12:00 am");
    expect(result.account_age_days).toBeGreaterThan(0);
    expect(result.password_change_count).toBe(1);
    expect(result.privacy_changes).toEqual([{ change: "Switched to Private", time: "Jan 05, 2020 1:00 pm" }]);
  });

  it("returns sensible defaults when files are absent", async () => {
    const result = await parseSecurity([]);
    expect(result.login_count).toBe(0);
    expect(result.account_created).toBeNull();
    expect(result.account_age_days).toBeNull();
  });
});
