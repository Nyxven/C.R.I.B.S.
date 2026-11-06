import { describe, expect, it } from "vitest";
import { applyBackspace, applyDelete, applyInput, applyPaste, emptyOtp, fillFrom, isComplete, moveFocus, otpValue, type OtpState } from "./otp";

const state = (digits: string, focus = 0): OtpState => ({ digits: digits.padEnd(6, " ").split("").map((c) => (c === " " ? "" : c)), focus });

describe("typing", () => {
  it("puts the digit in the box and moves to the next one", () => {
    const s = applyInput(emptyOtp(), 0, "4");
    expect(s.digits[0]).toBe("4");
    expect(s.focus).toBe(1);
  });
  it("ignores letters and symbols", () => {
    const s = applyInput(emptyOtp(), 2, "a");
    expect(otpValue(s)).toBe("");
    expect(s.focus).toBe(2);
  });
  it("stays on the last box after the 6th digit and reports complete", () => {
    let s = emptyOtp();
    for (const [i, d] of ["1", "2", "3", "4", "5", "6"].entries()) s = applyInput(s, i, d);
    expect(otpValue(s)).toBe("123456");
    expect(isComplete(s)).toBe(true);
    expect(s.focus).toBe(5);
  });
  it("typing over a filled box keeps only the new digit", () => {
    const s = applyInput(state("5", 0), 0, "57");
    expect(s.digits[0]).toBe("7");
    expect(s.focus).toBe(1);
  });
  it("empty text clears the box", () => {
    const s = applyInput(state("123", 2), 1, "");
    expect(otpValue(s)).toBe("13");
    expect(s.focus).toBe(1);
  });
});

describe("paste and autofill", () => {
  it("fills all boxes from a 6-digit paste into any box", () => {
    const s = applyPaste(emptyOtp(), 3, "482913");
    expect(otpValue(s)).toBe("482913");
    expect(isComplete(s)).toBe(true);
    expect(s.focus).toBe(5);
  });
  it("strips spaces and dashes", () => {
    expect(otpValue(applyPaste(emptyOtp(), 0, "482 913"))).toBe("482913");
    expect(otpValue(applyPaste(emptyOtp(), 0, "482-913"))).toBe("482913");
  });
  it("a short paste fills from the current box", () => {
    const s = applyPaste(emptyOtp(), 2, "12");
    expect(s.digits).toEqual(["", "", "1", "2", "", ""]);
    expect(s.focus).toBe(4);
  });
  it("cuts off extra digits", () => {
    expect(otpValue(applyPaste(emptyOtp(), 0, "12345678"))).toBe("123456");
  });
  it("a paste with no digits changes nothing", () => {
    const s = emptyOtp();
    expect(applyPaste(s, 0, "abc")).toBe(s);
  });
  it("autofill of a whole code into the first box fills everything", () => {
    expect(otpValue(applyInput(emptyOtp(), 0, "123456"))).toBe("123456");
  });
  it("fillFrom does not run past the last box", () => {
    const s = fillFrom(emptyOtp(), 4, "9876");
    expect(s.digits).toEqual(["", "", "", "", "9", "8"]);
    expect(s.focus).toBe(5);
  });
});

describe("backspace and delete", () => {
  it("clears the current box and stays", () => {
    const s = applyBackspace(state("123", 2), 2);
    expect(otpValue(s)).toBe("12");
    expect(s.focus).toBe(2);
  });
  it("on an empty box, goes back and clears the previous one", () => {
    const s = applyBackspace(state("12", 2), 2);
    expect(otpValue(s)).toBe("1");
    expect(s.focus).toBe(1);
  });
  it("does nothing on the first empty box", () => {
    const s = applyBackspace(emptyOtp(), 0);
    expect(s.focus).toBe(0);
    expect(otpValue(s)).toBe("");
  });
  it("delete clears the current box and stays", () => {
    const s = applyDelete(state("123456", 3), 3);
    expect(s.digits[3]).toBe("");
    expect(s.focus).toBe(3);
  });
});

describe("arrow keys", () => {
  it("moves left and right without going past the ends", () => {
    const s = emptyOtp();
    expect(moveFocus(s, 0, "left").focus).toBe(0);
    expect(moveFocus(s, 2, "left").focus).toBe(1);
    expect(moveFocus(s, 2, "right").focus).toBe(3);
    expect(moveFocus(s, 5, "right").focus).toBe(5);
    expect(moveFocus(s, 3, "first").focus).toBe(0);
    expect(moveFocus(s, 3, "last").focus).toBe(5);
  });
  it("does not change the digits", () => {
    const s = state("123456");
    expect(moveFocus(s, 2, "right").digits).toEqual(s.digits);
  });
});
