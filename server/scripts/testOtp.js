import dotenv from "dotenv";
import { fileURLToPath } from "node:url";

dotenv.config({ path: fileURLToPath(new URL("../.env", import.meta.url)) });

const { generateOtp, hashOtp, verifyOtpHash } = await import("../../client/src/utils/otp.js");
const { verificationEmail } = await import("../../client/src/utils/emailTemplates.js");
const { sendEmail } = await import("../../client/src/utils/sendEmail.js");

const email = "test@example.com";
const otp = generateOtp();
const hash = hashOtp(otp, email);

console.log("OTP has 6 digits:", /^\d{6}$/.test(otp));
console.log("Correct OTP accepted:", verifyOtpHash(otp, email, hash));
console.log("Wrong OTP rejected:", !verifyOtpHash("000000", email, hash));
console.log("Wrong email rejected:", !verifyOtpHash(otp, "other@example.com", hash));

// Sends a sample email with a dummy code (not a real OTP).
const to = process.argv[2] || process.env.SMTP_USER;
const { subject, html, text } = verificationEmail({ name: "Test User", otp: "123456" });
await sendEmail({ to, subject, html, text });
console.log("Test email sent to", to);