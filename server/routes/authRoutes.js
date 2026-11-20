import express from "express";
import { registerUser, loginUser, getMe } from "../controllers/authController.js";
import {
  sendOtp,
  verifyOtp,
  resendOtp,
} from "../controllers/otpRegistrationController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register/send-otp", sendOtp);
router.post("/register/verify-otp", verifyOtp);
router.post("/register/resend-otp", resendOtp);

router.post("/register", registerUser); // old route, we'll retire it later
router.post("/login", loginUser);
router.get("/me", protect, getMe);

export default router;