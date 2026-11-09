import { describe, expect, it } from "vitest";
import { cleanMessages, MAX_HISTORY_MESSAGES, MAX_INPUT_CHARS } from "./limits";

const u = (content: string) => ({ role: "user" as const, content });
const a = (content: string) => ({ role: "assistant" as const, content });

describe("cleanMessages", () => {
  it("accepts a simple question and returns it as the question", () => {
    const r = cleanMessages([u("  How do I help with bedtime?  ")]);
    expect(r).toEqual({ ok: true, messages: [u("How do I help with bedtime?")], question: "How do I help with bedtime?" });
  });
  it("rejects empty input", () => {
    expect(cleanMessages([])).toEqual({ ok: false, error: "empty" });
    expect(cleanMessages([u("   ")])).toEqual({ ok: false, error: "empty" });
  });
  it("rejects a question over the limit, accepts exactly the limit", () => {
    expect(cleanMessages([u("x".repeat(MAX_INPUT_CHARS + 1))])).toEqual({ ok: false, error: "too_long" });
    expect(cleanMessages([u("x".repeat(MAX_INPUT_CHARS))]).ok).toBe(true);
  });
  it("removes control characters", () => {
    const r = cleanMessages([u("hi\u0000 there\u0007")]);
    expect(r.ok && r.question).toBe("hi there");
  });
  it("keeps only the last turns and starts with a user turn", () => {
    const many = Array.from({ length: 10 }, (_, i) => (i % 2 === 0 ? u(`q${i}`) : a(`a${i}`)));
    many.push(u("last"));
    const r = cleanMessages(many);
    expect(r.ok && r.messages.length).toBeLessThanOrEqual(MAX_HISTORY_MESSAGES);
    expect(r.ok && r.messages[0]!.role).toBe("user");
    expect(r.ok && r.messages.at(-1)!.content).toBe("last");
  });
  it("joins two user turns in a row (an earlier answer failed)", () => {
    const r = cleanMessages([u("first"), u("second")]);
    expect(r.ok && r.messages).toEqual([u("first\n\nsecond")]);
  });
  it("rejects when the last turn is not the user's", () => {
    expect(cleanMessages([u("hi"), a("hello")])).toEqual({ ok: false, error: "bad_order" });
  });
  it("caps earlier assistant answers", () => {
    const r = cleanMessages([u("q"), a("y".repeat(9000)), u("next")]);
    expect(r.ok && r.messages[1]!.content.length).toBe(2000);
  });
});
