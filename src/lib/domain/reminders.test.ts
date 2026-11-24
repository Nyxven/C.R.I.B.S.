import { describe, expect, it } from "vitest";
import { pickReminder, type ReminderInput } from "./reminders";

const now = new Date("2026-11-24T11:00:00Z");
const base: ReminderInput = { now, remindRead: true, remindLog: true, lastReminderAt: null, nextGuide: { slug: "calm-meltdowns", moduleId: "behave" }, loggedToday: false, findMyAddedAt: null };
const nextDay = new Date(now.getTime() + 86_400_000);

describe("pickReminder", () => {
  it("takes turns between reading and logging", () => {
    const a = pickReminder(base)!.kind;
    const b = pickReminder({ ...base, now: nextDay })!.kind;
    expect(new Set([a, b])).toEqual(new Set(["read", "log"]));
  });
  it("links to the guide or the logs", () => {
    expect(pickReminder({ ...base, remindLog: false })).toEqual({ kind: "read", link: "/learn/behave/calm-meltdowns" });
    expect(pickReminder({ ...base, remindRead: false })).toEqual({ kind: "log", link: "/logs" });
  });
  it("skips what is done or switched off", () => {
    expect(pickReminder({ ...base, nextGuide: null, loggedToday: true })).toBeNull();
    expect(pickReminder({ ...base, remindRead: false, remindLog: false })).toBeNull();
  });
  it("sends at most one a day", () => {
    expect(pickReminder({ ...base, lastReminderAt: new Date(now.getTime() - 3_600_000) })).toBeNull();
    expect(pickReminder({ ...base, lastReminderAt: new Date(now.getTime() - 21 * 3_600_000) })).not.toBeNull();
  });
  it("puts an expiring Find My link first, even with reminders off", () => {
    const added = new Date(now.getTime() - 6.5 * 86_400_000);
    expect(pickReminder({ ...base, remindRead: false, remindLog: false, findMyAddedAt: added })).toEqual({ kind: "findmy", link: "/find" });
  });
});
