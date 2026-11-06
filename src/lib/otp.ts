// Pure logic for the 6-box code input. No React, no DOM: easy to test.
// State = one character ("" or a digit) per box, plus the box that should have focus.

export const OTP_LENGTH = 6;

export type OtpState = { digits: string[]; focus: number };

export const emptyOtp = (length = OTP_LENGTH): OtpState => ({ digits: Array<string>(length).fill(""), focus: 0 });
export const onlyDigits = (value: string): string => value.replace(/\D/g, "");
export const otpValue = (s: OtpState): string => s.digits.join("");
export const isComplete = (s: OtpState): boolean => s.digits.every((d) => d !== "");

const clamp = (n: number, length: number) => Math.min(Math.max(n, 0), length - 1);

/** Write `digits` into the boxes starting at `start`. Focus moves to the next empty spot, or the last box. */
export function fillFrom(s: OtpState, start: number, digits: string): OtpState {
  const clean = onlyDigits(digits);
  if (!clean) return s;
  const next = [...s.digits];
  const from = clamp(start, next.length);
  let written = 0;
  for (let i = from; i < next.length && written < clean.length; i++) next[i] = clean[written++];
  return { digits: next, focus: clamp(from + written, next.length) };
}

/** A box's text changed. Handles typing, deleting, typing over a digit, and autofill of a whole code. */
export function applyInput(s: OtpState, index: number, raw: string): OtpState {
  const length = s.digits.length;
  const d = onlyDigits(raw);
  if (d.length === 0) {
    const next = [...s.digits];
    next[index] = "";
    return { digits: next, focus: index };
  }
  if (d.length >= length) return fillFrom(s, 0, d); // autofill of a full code, whatever box it landed in
  let one = d;
  if (d.length > 1) {
    const old = s.digits[index];
    if (d.length === 2 && old) {
      // Typed over a digit that was not selected: keep the new one.
      one = d[0] === old ? d[1] : d[1] === old ? d[0] : d[1];
    } else {
      return fillFrom(s, index, d); // partial paste or autofill
    }
  }
  const next = [...s.digits];
  next[index] = one;
  return { digits: next, focus: clamp(index + 1, length) };
}

/** Text pasted into box `index`. */
export function applyPaste(s: OtpState, index: number, text: string): OtpState {
  const d = onlyDigits(text);
  if (!d) return s;
  return fillFrom(s, d.length >= s.digits.length ? 0 : index, d);
}

/** Backspace: clear this box, or if it is already empty, go back and clear the previous one. */
export function applyBackspace(s: OtpState, index: number): OtpState {
  const next = [...s.digits];
  if (next[index] !== "") {
    next[index] = "";
    return { digits: next, focus: index };
  }
  if (index === 0) return { digits: next, focus: 0 };
  next[index - 1] = "";
  return { digits: next, focus: index - 1 };
}

/** Delete key: clear this box and stay. */
export function applyDelete(s: OtpState, index: number): OtpState {
  const next = [...s.digits];
  next[index] = "";
  return { digits: next, focus: index };
}

/** Arrow keys, Home and End. `to` is "left", "right", "first" or "last". */
export function moveFocus(s: OtpState, index: number, to: "left" | "right" | "first" | "last"): OtpState {
  const length = s.digits.length;
  const target = to === "left" ? index - 1 : to === "right" ? index + 1 : to === "first" ? 0 : length - 1;
  return { digits: s.digits, focus: clamp(target, length) };
}
