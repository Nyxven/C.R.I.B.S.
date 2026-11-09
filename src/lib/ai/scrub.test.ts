import { describe, expect, it } from "vitest";
import { scrubPii } from "./scrub";

describe("scrubPii", () => {
  it("removes emails, links and phone numbers", () => {
    expect(scrubPii("email me at maria.santos+cribs@example.com").text).toBe("email me at [email]");
    expect(scrubPii("see https://example.com/a?b=1 or www.example.org").text).toBe("see [link] or [link]");
    for (const phone of ["09171234567", "0917 123 4567", "+63 917 123 4567", "0917-123-4567", "(02) 8123 4567", "+639171234567"]) {
      expect(scrubPii(`call ${phone} please`).text).toBe("call [number] please");
    }
  });
  it("removes long ID-like numbers", () => expect(scrubPii("my ID is 1234-5678-9012").text).toBe("my ID is [number]"));
  it("reports whether anything changed", () => {
    expect(scrubPii("hello").redacted).toBe(false);
    expect(scrubPii("hello 09171234567").redacted).toBe(true);
  });
  it("leaves normal parent questions alone", () => {
    for (const ok of [
      "My child is 4 years old and sleeps 8 to 10 hours.", "Bedtime at 8:30 pm, wakes 6:15 am", "He was diagnosed on 2024-11-09",
      "She has 3 meltdowns a day, 5 days a week", "About 12 words, maybe 20 signs", "Grade 2, room 305", "He scored 85/100 on the test",
    ]) expect(scrubPii(ok)).toEqual({ text: ok, redacted: false });
  });
});
