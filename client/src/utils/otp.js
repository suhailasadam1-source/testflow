import crypto from "node:crypto";

export const OTP_TTL_MS = 5 * 60 * 1000; // an OTP is valid for 5 minutes

// Read the secret when needed (not at the top of the file) because
// dotenv.config() in server.js runs after the imports.
function getSecret() {
  const secret = process.env.OTP_HMAC_SECRET;
  if (!secret) throw new Error("OTP_HMAC_SECRET is not set in server/.env");
  return secret;
}

// Returns a random 6-digit string such as "483920".
export function generateOtp() {
  return crypto.randomInt(100000, 1000000).toString();
}

// Turns an OTP into an irreversible keyed hash. The email is mixed in,
// so a hash made for one email can't be reused for another.
export function hashOtp(otp, email) {
  return crypto
    .createHmac("sha256", getSecret())
    .update(`${email}:${otp}`)
    .digest("hex");
}

// Checks a submitted OTP against the stored hash in constant time.
export function verifyOtpHash(otp, email, storedHash) {
  const candidate = Buffer.from(hashOtp(otp, email), "hex");
  const stored = Buffer.from(storedHash, "hex");
  if (candidate.length !== stored.length) return false;
  return crypto.timingSafeEqual(candidate, stored);
}