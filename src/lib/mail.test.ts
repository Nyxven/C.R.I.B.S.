import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { sendMail } from "./mail";

const KEY = "xkeysib-test-key-1234567890";
beforeEach(() => { vi.stubEnv("MAIL_DRIVER", "brevo"); vi.stubEnv("BREVO_API_KEY", KEY); vi.stubEnv("MAIL_FROM_EMAIL", "sender@example.com"); });
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

describe("sendMail (brevo)", () => {
  it("reports Brevo's reason without leaking the key or recipient", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ code: "unauthorized", message: "Key not found" }), { status: 401 })));
    const err = await sendMail({ to: "parent@example.com", subject: "s", html: "<p>x</p>" }).catch((e: Error) => e);
    expect(String(err)).toContain("401");
    expect(String(err)).toContain("Key not found");
    expect(String(err)).not.toContain(KEY);
    expect(String(err)).not.toContain("parent@example.com");
  });
  it("names missing settings", async () => {
    vi.stubEnv("BREVO_API_KEY", "");
    await expect(sendMail({ to: "a@b.com", subject: "s", html: "x" })).rejects.toThrow("BREVO_API_KEY is not set");
    vi.stubEnv("BREVO_API_KEY", KEY); vi.stubEnv("MAIL_FROM_EMAIL", "");
    await expect(sendMail({ to: "a@b.com", subject: "s", html: "x" })).rejects.toThrow("MAIL_FROM_EMAIL is not set");
  });
});
