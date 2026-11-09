import { describe, expect, it } from "vitest";
import { aiReady, getAiConfig, getSecurityConfig } from "./env";

describe("getSecurityConfig", () => {
  it("has safe defaults", () => expect(getSecurityConfig({})).toEqual({ trustProxy: "vercel", mailDailyCap: 250, turnstileSecret: undefined, cronSecret: undefined }));
  it("reads values and ignores blanks", () => {
    expect(getSecurityConfig({ TRUST_PROXY: "cloudflare", MAIL_DAILY_CAP: "100", TURNSTILE_SECRET_KEY: "", CRON_SECRET: "x".repeat(20) })).toMatchObject({ trustProxy: "cloudflare", mailDailyCap: 100, turnstileSecret: undefined });
  });
  it("falls back instead of throwing on bad values", () => expect(getSecurityConfig({ TRUST_PROXY: "everyone" }).trustProxy).toBe("vercel"));
});

describe("getAiConfig", () => {
  it("is not ready with nothing set, and has small default limits", () => {
    const c = getAiConfig({});
    expect(aiReady(c)).toBe(false);
    expect(c.provider).toBe("openai-compatible");
    expect(c.limits).toEqual({ perHour: 20, perDay: 60, userTokensPerDay: 40000, globalPerMin: 10, globalPerDay: 400, globalTokensPerDay: 400000 });
    expect(c.maxOutputTokens).toBe(450);
  });
  it("openai-compatible needs key, base url and model", () => {
    expect(aiReady(getAiConfig({ AI_API_KEY: "k".repeat(12), AI_BASE_URL: "https://example.test/v1/", AI_MODEL: "free-model" }))).toBe(true);
    expect(aiReady(getAiConfig({ AI_API_KEY: "k".repeat(12), AI_MODEL: "free-model" }))).toBe(false);
    expect(getAiConfig({ AI_BASE_URL: "https://example.test/v1/" }).baseUrl).toBe("https://example.test/v1");
  });
  it("refuses a plain http base url (except localhost)", () => {
    expect(getAiConfig({ AI_BASE_URL: "http://example.test/v1" }).baseUrl).toBeUndefined();
    expect(getAiConfig({ AI_BASE_URL: "http://localhost:11434/v1" }).baseUrl).toBe("http://localhost:11434/v1");
  });
  it("anthropic uses its own key and a default model", () => {
    const c = getAiConfig({ AI_PROVIDER: "anthropic", ANTHROPIC_API_KEY: "k".repeat(30) });
    expect(aiReady(c)).toBe(true);
    expect(c.model).toBe("claude-haiku-5-5");
  });
  it("one bad value never breaks the others", () => {
    const c = getAiConfig({ AI_API_KEY: "k".repeat(12), AI_BASE_URL: "https://example.test/v1", AI_MODEL: "m", AI_GLOBAL_PER_DAY: "banana", AI_PROVIDER: "nonsense" });
    expect(aiReady(c)).toBe(true);
    expect(c.limits.globalPerDay).toBe(400);
  });
  it("lets you change limits and ignores nonsense", () => {
    expect(getAiConfig({ AI_GLOBAL_PER_DAY: "1000" }).limits.globalPerDay).toBe(1000);
    expect(getAiConfig({ AI_GLOBAL_PER_DAY: "banana" }).limits.globalPerDay).toBe(400);
  });
});
