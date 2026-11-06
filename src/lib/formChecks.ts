// Friendly checks run in the browser before the form is sent. The server still checks everything again.

export const PASSWORD_MIN = 10;

export type SignUpFields = { name: string; email: string; password: string; consent: boolean };
export type FieldErrors = Partial<Record<keyof SignUpFields, string>>;

export const looksLikeEmail = (v: string) => /^\S+@\S+\.\S+$/.test(v.trim());

export function checkSignUp(f: SignUpFields): FieldErrors {
  const e: FieldErrors = {};
  if (!f.name.trim()) e.name = "Please tell us your name.";
  if (!looksLikeEmail(f.email)) e.email = "Please enter an email like name@example.com.";
  if (f.password.length < PASSWORD_MIN) e.password = `Please use at least ${PASSWORD_MIN} characters.`;
  if (!f.consent) e.consent = "Please tick the box to continue.";
  return e;
}
