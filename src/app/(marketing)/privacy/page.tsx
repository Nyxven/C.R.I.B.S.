import { LegalPage } from "@/components/ui/LegalPage";

export const metadata = { title: "Privacy Policy" };

// TODO(team): replace with reviewed text (check the Philippine Data Privacy Act of 2012) before real users.
export default function Page() {
  return (
    <LegalPage title="Privacy Policy">
      <p><b>What we keep.</b> Your name and email, so we can make your account and send you a sign-in code.</p>
      <p><b>Your password.</b> We never store it as plain text. It is scrambled with a secret that is kept apart from the database.</p>
      <p><b>Your child's information.</b> Details about your child are sensitive. We only ask for what the app needs, and we do not share your child's name or details with outside services. We use an email service only to deliver your sign-in codes.</p>
      <p><b>Questions.</b> Ask the C.R.I.B.S. team at Taguig Science High School.</p>
    </LegalPage>
  );
}
