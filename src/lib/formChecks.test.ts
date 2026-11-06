import { describe, expect, it } from "vitest";
import { checkSignUp, looksLikeEmail } from "./formChecks";

const good = { name: "Ana", email: "ana@example.com", password: "abcdefghij", consent: true };

describe("checkSignUp", () => {
  it("passes a complete form", () => expect(checkSignUp(good)).toEqual({}));
  it("asks for a name", () => expect(checkSignUp({ ...good, name: "  " }).name).toBeDefined());
  it("rejects a bad email", () => {
    expect(checkSignUp({ ...good, email: "ana@" }).email).toBeDefined();
    expect(checkSignUp({ ...good, email: "ana example.com" }).email).toBeDefined();
  });
  it("needs 10 characters", () => {
    expect(checkSignUp({ ...good, password: "123456789" }).password).toBeDefined();
    expect(checkSignUp({ ...good, password: "1234567890" }).password).toBeUndefined();
  });
  it("needs the consent box", () => expect(checkSignUp({ ...good, consent: false }).consent).toBeDefined());
  it("reports every problem at once", () => {
    expect(Object.keys(checkSignUp({ name: "", email: "", password: "", consent: false })).sort()).toEqual(["consent", "email", "name", "password"]);
  });
});

describe("looksLikeEmail", () => {
  it("ignores spaces around the address", () => expect(looksLikeEmail("  a@b.co ")).toBe(true));
});
