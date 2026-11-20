import mongoose from "mongoose";

const pendingRegistrationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },

    // Lowercase copy, used to look up the pending record.
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    // The email exactly as the user typed it (this is what the User gets).
    emailAsEntered: { type: String, required: true, trim: true },

    // bcrypt hash of the password. The plain password is never stored.
    passwordHash: { type: String, required: true },

    // HMAC-SHA256 hash of the OTP. The plain OTP is never stored.
    otpHash: { type: String, required: true },

    otpExpiresAt: { type: Date, required: true }, // 5 minutes after sending
    attempts: { type: Number, default: 0 },
    lastSentAt: { type: Date, required: true },
    resendCount: { type: Number, default: 0 },

    // MongoDB deletes the whole record automatically at this time.
    expiresAt: {
      type: Date,
      required: true,
      index: { expireAfterSeconds: 0 },
    },
  },
  { timestamps: true }
);

export default mongoose.model("PendingRegistration", pendingRegistrationSchema);