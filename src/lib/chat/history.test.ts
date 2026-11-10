import { describe, expect, it } from "vitest";
import { expiryFrom, hasRoomForTurn, isFeedback, isUuid, MAX_MESSAGES_PER_THREAD, nextFeedback, shouldSave, threadTitle } from "./history";

describe("threadTitle", () => {
  it("uses the question, trimmed and on one line", () => expect(threadTitle("  How do I\n help with   bedtime? ")).toBe("How do I help with bedtime?"));
  it("shortens long questions", () => {
    const t = threadTitle("word ".repeat(40));
    expect(t.length).toBeLessThanOrEqual(60);
    expect(t.endsWith("…")).toBe(true);
  });
  it("never keeps contact details", () => expect(threadTitle("call me 0917 123 4567 about sleep")).toBe("call me [number] about sleep"));
  it("falls back when empty", () => expect(threadTitle("   ")).toBe("New chat"));
});

describe("rules", () => {
  it("keeps chats 30 days from the last message", () => {
    expect(expiryFrom(new Date("2026-11-01T00:00:00Z")).toISOString()).toBe("2026-12-01T00:00:00.000Z");
  });
  it("toggles thumbs", () => {
    expect(nextFeedback(null, "up")).toBe("up");
    expect(nextFeedback("up", "up")).toBeNull();
    expect(nextFeedback("up", "down")).toBe("down");
  });
  it("leaves room for a question and answer", () => {
    expect(hasRoomForTurn(MAX_MESSAGES_PER_THREAD - 2)).toBe(true);
    expect(hasRoomForTurn(MAX_MESSAGES_PER_THREAD - 1)).toBe(false);
  });
  it("never saves emergencies or when history is off", () => {
    expect(shouldSave({ enabled: true, emergency: false })).toBe(true);
    expect(shouldSave({ enabled: true, emergency: true })).toBe(false);
    expect(shouldSave({ enabled: false, emergency: false })).toBe(false);
  });
  it("validates ids and feedback values", () => {
    expect(isUuid("3f2b8c1e-9d4a-4e6b-8a1c-0b5d7e9f1a2b")).toBe(true);
    for (const bad of ["", "abc", "../x", 5, null, "3f2b8c1e-9d4a-4e6b-8a1c-0b5d7e9f1a2bX"]) expect(isUuid(bad)).toBe(false);
    expect(isFeedback("up")).toBe(true);
    for (const bad of ["UP", "", null, 1, "sideways"]) expect(isFeedback(bad)).toBe(false);
  });
});
