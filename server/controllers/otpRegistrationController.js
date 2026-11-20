import bcrypt from "bcryptjs";
import User from "../models/user.js";
import PendingRegistration from "../models/PendingRegistration.js";
import {
  generateOtp,
  hashOtp,
  verifyOtpHash,
  OTP_TTL_MS,
} from "../../client/src/utils/otp.js";
import { sendEmail } from "../../client/src/utils/sendEmail.js";
import { verificationEmail } from "../../client/src/utils/emailTemplates.js";

const RESEND_COOLDOWN_MS = 60 * 1000; // 60 seconds between emails
const PENDING_TTL_MS = 30 * 60 * 1000; // pending record lives 30 minutes
const MAX_ATTEMPTS = 5; // wrong guesses allowed per OTP
const MAX_RESENDS = 5; // resends allowed per pending record

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const isString = (value) => typeof value === "string";

/* ---------- helpers ---------- */

function validateRegistration({ name, email, password, confirmPassword }) {
  const errors = {};

  if (!isString(name) || name.trim().length < 2 || name.trim().length > 50) {
    errors.name = "Name must be between 2 and 50 characters.";
  }
  if (
    !isString(email) ||
    email.trim().length > 254 ||
    !EMAIL_REGEX.test(email.trim())
  ) {
    errors.email = "Please enter a valid email address.";
  }
  if (
    !isString(password) ||
    password.length < 8 ||
    password.length > 72 || // bcrypt only uses the first 72 bytes
    !/[A-Za-z]/.test(password) ||
    !/\d/.test(password)
  ) {
    errors.password =
      "Password must be 8-72 characters and include a letter and a number.";
  } else if (password !== confirmPassword) {
    errors.confirmPassword = "Passwords do not match.";
  }
  return errors;
}

// Case-insensitive duplicate check against real users.
async function emailExists(email) {
  const user = await User.findOne({ email })
    .collation({ locale: "en", strength: 2 })
    .select("_id")
    .lean();
  return Boolean(user);
}

function secondsLeft(lastSentAt) {
  const ms = lastSentAt.getTime() + RESEND_COOLDOWN_MS - Date.now();
  return Math.max(1, Math.ceil(ms / 1000));
}

function cooldownResponse(res, seconds) {
  res.set("Retry-After", String(seconds));
  return res.status(429).json({
    message: `Please wait ${seconds} seconds before requesting another code.`,
    code: "RESEND_COOLDOWN",
    retryAfter: seconds,
  });
}

async function sendOtpEmail({ name, email, otp }) {
  const { subject, html, text } = verificationEmail({ name, otp });
  await sendEmail({ to: email, subject, html, text });
}

// If the email could not be sent, let the user try again right away.
async function rewindCooldown(email) {
  await PendingRegistration.updateOne({ email }, { lastSentAt: new Date(0) });
}

const serverError = (res, label, error) => {
  console.error(`${label}:`, error.message); // never log OTPs
  return res
    .status(500)
    .json({ message: "Something went wrong. Please try again." });
};

/* ---------- POST /api/auth/register/send-otp ---------- */

export const sendOtp = async (req, res) => {
  try {
    const errors = validateRegistration(req.body);
    if (Object.keys(errors).length > 0) {
      return res
        .status(400)
        .json({ message: "Please correct the highlighted fields.", errors });
    }

    const name = req.body.name.trim();
    const emailAsEntered = req.body.email.trim();
    const email = emailAsEntered.toLowerCase();

    if (await emailExists(email)) {
      return res.status(409).json({
        message: "An account with this email already exists. Please log in.",
        code: "EMAIL_EXISTS",
      });
    }

    // Respect the 60-second cooldown even if the form is submitted again.
    const existing = await PendingRegistration.findOne({ email });
    if (existing && existing.lastSentAt.getTime() + RESEND_COOLDOWN_MS > Date.now()) {
      return cooldownResponse(res, secondsLeft(existing.lastSentAt));
    }

    const otp = generateOtp();
    const now = Date.now();
    const passwordHash = await bcrypt.hash(req.body.password, 10);

    // Create the pending record, or overwrite the old one (this also
    // invalidates any previous OTP for this email).
    await PendingRegistration.findOneAndUpdate(
      { email },
      {
        $set: {
          name,
          emailAsEntered,
          passwordHash,
          otpHash: hashOtp(otp, email),
          otpExpiresAt: new Date(now + OTP_TTL_MS),
          attempts: 0,
          lastSentAt: new Date(now),
          expiresAt: new Date(now + PENDING_TTL_MS),
        },
        $setOnInsert: { resendCount: 0 },
      },
      { upsert: true }
    );

    try {
      await sendOtpEmail({ name, email: emailAsEntered, otp });
    } catch (mailError) {
      console.error("Failed to send OTP email:", mailError.message);
      await rewindCooldown(email);
      return res.status(502).json({
        message: "We couldn't send the verification email. Please try again.",
        code: "EMAIL_FAILED",
      });
    }

    return res.status(200).json({
      message: "Verification code sent.",
      email: emailAsEntered,
      resendAfter: RESEND_COOLDOWN_MS / 1000,
      expiresIn: OTP_TTL_MS / 1000,
    });
  } catch (error) {
    return serverError(res, "sendOtp error", error);
  }
};

/* ---------- POST /api/auth/register/verify-otp ---------- */

export const verifyOtp = async (req, res) => {
  try {
    const { email: rawEmail, otp: rawOtp } = req.body;

    if (!isString(rawEmail) || !isString(rawOtp) || !/^\d{6}$/.test(rawOtp.trim())) {
      return res.status(400).json({
        message: "Please enter the 6-digit code.",
        code: "OTP_FORMAT",
      });
    }
    const email = rawEmail.trim().toLowerCase();
    const otp = rawOtp.trim();

    // Reserve one attempt atomically BEFORE checking the code. Even if
    // someone fires many requests at once, they can't exceed 5 guesses.
    const pending = await PendingRegistration.findOneAndUpdate(
      {
        email,
        attempts: { $lt: MAX_ATTEMPTS },
        otpExpiresAt: { $gt: new Date() },
      },
      { $inc: { attempts: 1 } },
      { new: true }
    );

    if (!pending) {
      const record = await PendingRegistration.findOne({ email });
      if (!record) {
        return res.status(400).json({
          message: "This verification session has expired. Please register again.",
          code: "NO_PENDING",
        });
      }
      if (record.attempts >= MAX_ATTEMPTS) {
        return res.status(429).json({
          message: "Too many incorrect attempts. Please request a new code.",
          code: "TOO_MANY_ATTEMPTS",
        });
      }
      return res.status(400).json({
        message: "This code has expired. Please request a new one.",
        code: "OTP_EXPIRED",
      });
    }

    if (!verifyOtpHash(otp, email, pending.otpHash)) {
      const attemptsLeft = MAX_ATTEMPTS - pending.attempts;
      if (attemptsLeft <= 0) {
        return res.status(429).json({
          message: "Too many incorrect attempts. Please request a new code.",
          code: "TOO_MANY_ATTEMPTS",
          attemptsLeft: 0,
        });
      }
      return res.status(400).json({
        message: `Incorrect code. ${attemptsLeft} attempt${attemptsLeft === 1 ? "" : "s"} left.`,
        code: "OTP_INVALID",
        attemptsLeft,
      });
    }

    // The code is correct. Make sure nobody registered this email meanwhile.
    if (await emailExists(email)) {
      await PendingRegistration.deleteOne({ _id: pending._id });
      return res.status(409).json({
        message: "An account with this email already exists. Please log in.",
        code: "EMAIL_EXISTS",
      });
    }

    // insertMany does NOT run your pre("save") hook, so the password hash
    // from the pending record is stored as-is (no double hashing).
    try {
      await User.insertMany([
        {
          name: pending.name,
          email: pending.emailAsEntered,
          password: pending.passwordHash,
        },
      ]);
    } catch (insertError) {
      if (insertError.code === 11000) {
        await PendingRegistration.deleteOne({ _id: pending._id });
        return res.status(409).json({
          message: "An account with this email already exists. Please log in.",
          code: "EMAIL_EXISTS",
        });
      }
      throw insertError;
    }

    await PendingRegistration.deleteOne({ _id: pending._id });

    return res.status(201).json({
      message: "Email verified! Your account has been created. Please log in.",
    });
  } catch (error) {
    return serverError(res, "verifyOtp error", error);
  }
};

/* ---------- POST /api/auth/register/resend-otp ---------- */

export const resendOtp = async (req, res) => {
  try {
    const { email: rawEmail } = req.body;
    if (!isString(rawEmail) || !rawEmail.trim()) {
      return res
        .status(400)
        .json({ message: "Email is required.", code: "EMAIL_REQUIRED" });
    }
    const email = rawEmail.trim().toLowerCase();

    const otp = generateOtp();
    const now = Date.now();

    // One atomic step: only succeeds if the cooldown has passed and the
    // resend limit isn't reached. Replacing otpHash invalidates the old OTP.
    const pending = await PendingRegistration.findOneAndUpdate(
      {
        email,
        lastSentAt: { $lte: new Date(now - RESEND_COOLDOWN_MS) },
        resendCount: { $lt: MAX_RESENDS },
      },
      {
        $set: {
          otpHash: hashOtp(otp, email),
          otpExpiresAt: new Date(now + OTP_TTL_MS),
          attempts: 0,
          lastSentAt: new Date(now),
          expiresAt: new Date(now + PENDING_TTL_MS),
        },
        $inc: { resendCount: 1 },
      },
      { new: true }
    );

    if (!pending) {
      const record = await PendingRegistration.findOne({ email });
      if (!record) {
        return res.status(400).json({
          message: "This verification session has expired. Please register again.",
          code: "NO_PENDING",
        });
      }
      if (record.resendCount >= MAX_RESENDS) {
        return res.status(429).json({
          message: "Too many codes requested. Please try again later.",
          code: "RESEND_LIMIT",
        });
      }
      return cooldownResponse(res, secondsLeft(record.lastSentAt));
    }

    try {
      await sendOtpEmail({ name: pending.name, email: pending.emailAsEntered, otp });
    } catch (mailError) {
      console.error("Failed to send OTP email:", mailError.message);
      await rewindCooldown(email);
      return res.status(502).json({
        message: "We couldn't send the verification email. Please try again.",
        code: "EMAIL_FAILED",
      });
    }

    return res.status(200).json({
      message: "A new verification code has been sent.",
      resendAfter: RESEND_COOLDOWN_MS / 1000,
      expiresIn: OTP_TTL_MS / 1000,
    });
  } catch (error) {
    return serverError(res, "resendOtp error", error);
  }
};