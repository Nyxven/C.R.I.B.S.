// Removes contact details from a question before it leaves for the model provider. Pure.
// Free model tiers may keep or learn from prompts, so phone numbers, emails and links never go out.
export function scrubPii(text: string): { text: string; redacted: boolean } {
  let out = text;
  out = out.replace(/[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g, "[email]");
  out = out.replace(/\bhttps?:\/\/\S+|\bwww\.\S+/gi, "[link]");
  // Nine or more digits in a row, with spaces, dashes, dots or brackets between them: phone and ID numbers.
  out = out.replace(/(?<![\w])[+(]?\d(?:[\s().-]{0,2}\d){8,14}(?!\w)/g, "[number]");
  return { text: out, redacted: out !== text };
}
