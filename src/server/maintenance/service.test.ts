import { describe, expect, it, vi } from "vitest";

vi.mock("@/server/security/repo", () => ({ deleteExpiredLimits: async () => 5 }));
vi.mock("./repo", () => ({
  deleteExpiredSessions: async () => 2,
  deleteExpiredCodes: async () => { throw new Error("db down"); },
  deleteStaleUnverifiedUsers: async (days: number) => (days === 7 ? 1 : 99),
  deleteExpiredChats: async () => 3,
}));
import { runCleanup } from "./service";

describe("runCleanup", () => {
  it("reports every step and keeps going when one fails (-1)", async () => {
    const logs: string[] = [];
    expect(await runCleanup((m) => logs.push(m))).toEqual({ limits: 5, sessions: 2, codes: -1, unverifiedUsers: 1, chats: 3 });
    expect(logs).toEqual(["[cleanup] codes failed: Error"]);
  });
});
