import { describe, expect, it } from "vitest";
import { buildExport, exportFileName, type ExportInput } from "./export";

const input: ExportInput = {
  now: new Date("2026-11-10T08:00:00Z"),
  account: { name: "Ana", email: "ana@example.com", createdAt: new Date("2026-11-01T00:00:00Z") },
  settings: { displayName: "Ana", relationship: "mother", language: "en", theme: "sunrise", textSize: 100, sensoryMode: false, notifOn: true, chatHistoryEnabled: true },
  child: { nickname: "Bunso", ageYears: 4 },
  contact: { name: "Ate Rose", phone: "09171234567", isPublic: true },
  progress: [{ slug: "a", saved: true, read: false }, { slug: "b", saved: false, read: true }, { slug: "c", saved: true, read: true }],
  chats: [{ title: "Bedtime", updatedAt: new Date("2026-11-09T00:00:00Z"), messages: [{ role: "user", content: "Q", feedback: null, createdAt: new Date("2026-11-09T00:00:00Z") }, { role: "assistant", content: "A", feedback: "up", createdAt: new Date("2026-11-09T00:00:01Z") }] }],
  tag: { enabled: true, createdAt: new Date("2026-11-05T00:00:00Z"), accessCount: 3 },
  posts: [{ body: "Bedtime tip", isReply: false, status: "visible", createdAt: new Date("2026-11-08T00:00:00Z") }],
};

describe("buildExport", () => {
  it("includes the person's own data, readable", () => {
    const e = buildExport(input);
    expect(e.account).toEqual({ name: "Ana", email: "ana@example.com", createdAt: "2026-11-01T00:00:00.000Z" });
    expect(e.child).toEqual({ nickname: "Bunso", ageYears: 4 });
    expect(e.emergencyContact?.phone).toBe("09171234567");
    expect(e.guides).toEqual({ saved: ["a", "c"], read: ["b", "c"] });
    expect(e.askChats[0]!.messages.map((m) => m.text)).toEqual(["Q", "A"]);
    expect(e.communityPosts).toEqual([{ text: "Bedtime tip", isReply: false, status: "visible", at: "2026-11-08T00:00:00.000Z" }]);
    expect(e.ifFoundTag).toEqual({ enabled: true, madeAt: "2026-11-05T00:00:00.000Z", timesOpened: 3 });
  });
  it("is plain JSON (dates as text) and never carries secrets", () => {
    const text = JSON.stringify(buildExport(input));
    expect(JSON.parse(text)).toBeTruthy();
    for (const leak of ["passwordHash", "password_hash", "tokenHash", "token_hash", "codeHash"]) expect(text).not.toContain(leak);
  });
  it("copes with an account that has nothing else yet", () => {
    const e = buildExport({ ...input, settings: null, child: null, contact: null, progress: [], chats: [], tag: null, posts: [] });
    expect(e.child).toBeNull();
    expect(e.askChats).toEqual([]);
    expect(e.ifFoundTag).toBeNull();
  });
  it("names the file with the date only", () => expect(exportFileName(input.now)).toBe("cribs-my-data-2026-11-10.json"));
});
