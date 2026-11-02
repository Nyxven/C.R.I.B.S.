import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { emailOTP } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { sendMail, otpEmail } from "./mail";

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg", schema }),
  emailAndPassword: { enabled: true, minPasswordLength: 10, requireEmailVerification: true },
  emailVerification: { autoSignInAfterVerification: true },
  rateLimit: { enabled: true, storage: "database" },
  plugins: [
    emailOTP({
      otpLength: 6,
      expiresIn: 600,
      allowedAttempts: 5,
      sendVerificationOnSignUp: true,
      async sendVerificationOTP({ email, otp, type }) {
        const m = otpEmail(type, otp);
        await sendMail({ to: email, ...m });
      },
    }),
    nextCookies(), // keep last
  ],
});
