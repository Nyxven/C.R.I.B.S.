import { LegalPage } from "@/components/ui/LegalPage";

export const metadata = { title: "Terms of Use" };

// TODO(team): replace with reviewed text before real users.
export default function Page() {
  return (
    <LegalPage title="Terms of Use">
      <p><b>Who it is for.</b> Parents and guardians aged 18 and over.</p>
      <p><b>Guidance only.</b> C.R.I.B.S. shares general information. It does not diagnose, treat, or replace a licensed doctor, therapist, or teacher.</p>
      <p><b>Sample listings.</b> The directory shows sample listings for demonstration. Always check credentials and availability yourself.</p>
      <p><b>Your account.</b> Please keep your password private and tell us if you think someone else used your account.</p>
    </LegalPage>
  );
}
