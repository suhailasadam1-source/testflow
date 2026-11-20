import { useEffect, useRef, useState } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { CheckCircle2, Mail } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const OTP_LENGTH = 6;

export default function VerifyRegistration() {
  const location = useLocation();
  const email =
    location.state?.email || sessionStorage.getItem("pendingRegistrationEmail");
  const { verifyRegistration, resendRegistrationOtp } = useAuth();
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(""));
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [verified, setVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(
    () => location.state?.resendAfter || 0
  );
  const inputs = useRef([]);
  const code = otp.join("");

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const timer = setTimeout(() => {
      setCooldown((remaining) => Math.max(remaining - 1, 0));
    }, 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  if (!email) return <Navigate to="/register" replace />;

  const handleChange = (index, value) => {
    const digits = value.replace(/\D/g, "").slice(0, OTP_LENGTH);
    if (!digits) {
      setOtp((current) =>
        current.map((digit, position) => (position === index ? "" : digit))
      );
      return;
    }

    if (digits.length > 1) {
      setOtp(Array.from({ length: OTP_LENGTH }, (_, position) => digits[position] || ""));
      inputs.current[Math.min(digits.length, OTP_LENGTH) - 1]?.focus();
      return;
    }

    setOtp((current) =>
      current.map((digit, position) => (position === index ? digits : digit))
    );
    if (index < OTP_LENGTH - 1) inputs.current[index + 1]?.focus();
  };

  const handlePaste = (event) => {
    const digits = event.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, OTP_LENGTH);
    if (!digits) return;
    event.preventDefault();
    setOtp(Array.from({ length: OTP_LENGTH }, (_, index) => digits[index] || ""));
    inputs.current[Math.min(digits.length, OTP_LENGTH) - 1]?.focus();
  };

  const handleKeyDown = (event, index) => {
    if (event.key === "Backspace" && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    } else if (event.key === "ArrowLeft" && index > 0) {
      inputs.current[index - 1]?.focus();
    } else if (event.key === "ArrowRight" && index < OTP_LENGTH - 1) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleVerify = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await verifyRegistration(email, code);
      sessionStorage.removeItem("pendingRegistrationEmail");
      setMessage(result.message);
      setVerified(true);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message || "Could not verify the code. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError("");
    setMessage("");
    setResending(true);
    try {
      const result = await resendRegistrationOtp(email);
      setCooldown(result.resendAfter || 60);
      setOtp(Array(OTP_LENGTH).fill(""));
      setMessage(result.message);
      inputs.current[0]?.focus();
    } catch (requestError) {
      const retryAfter = requestError.response?.data?.retryAfter;
      if (retryAfter) setCooldown(retryAfter);
      setError(
        requestError.response?.data?.message || "Could not resend the code. Please try again."
      );
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="auth-card">
      <div className="auth-icon">
        {verified ? <CheckCircle2 size={22} /> : <Mail size={22} />}
      </div>
      <h1>Verify your email</h1>
      <p className="auth-sub">
        Enter the 6-digit code we sent to <strong>{email}</strong>.
      </p>

      {error && <p className="error">{error}</p>}
      {message && <p className="otp-meta">{message}</p>}

      {verified ? (
        <p className="auth-switch">
          <Link to="/login">Continue to log in</Link>
        </p>
      ) : (
        <>
          <form onSubmit={handleVerify}>
            <div className="otp-boxes">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(element) => {
                    inputs.current[index] = element;
                  }}
                  type="text"
                  inputMode="numeric"
                  autoComplete={index === 0 ? "one-time-code" : "off"}
                  aria-label={`Verification digit ${index + 1}`}
                  value={digit}
                  onChange={(event) => handleChange(index, event.target.value)}
                  onPaste={handlePaste}
                  onKeyDown={(event) => handleKeyDown(event, index)}
                  maxLength={OTP_LENGTH}
                  required
                />
              ))}
            </div>
            <button type="submit" disabled={loading || code.length !== OTP_LENGTH}>
              {loading ? "Verifying..." : "Verify email"}
            </button>
          </form>

          <p className="otp-meta">
            {cooldown > 0
              ? `You can request another code in ${cooldown}s.`
              : "Didn't receive the code?"}
          </p>
          <button
            type="button"
            className="text-btn"
            onClick={handleResend}
            disabled={resending || cooldown > 0}
          >
            {resending ? "Sending..." : "Resend code"}
          </button>
        </>
      )}
    </div>
  );
}
