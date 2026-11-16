import { describe, expect, it } from "vitest";
import { capitalizeFirst } from "./names";

describe("capitalizeFirst", () => {
  it("capitalises only the first letter", () => {
    expect(capitalizeFirst("raven")).toBe("Raven");
    expect(capitalizeFirst("  mary Ann ")).toBe("Mary Ann");
    expect(capitalizeFirst("McKay")).toBe("McKay");
  });
  it("leaves empty text and non-letters alone", () => {
    expect(capitalizeFirst("")).toBe("");
    expect(capitalizeFirst("   ")).toBe("");
    expect(capitalizeFirst("3rd")).toBe("3rd");
  });
});
