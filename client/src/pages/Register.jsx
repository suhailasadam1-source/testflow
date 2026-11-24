import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { isStrongPassword } from "../utils/passwordRules";
import AuthShell from "../components/auth/AuthShell";
import PasswordField from "../components/auth/PasswordField";
import PasswordStrength from "../components/auth/PasswordStrength";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Register() {
  const { user, register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirm: "",
  });
  const [agree, setAgree] = useState(false);
  const [touched, setTouched] = useState({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const nameOk = form.name.trim().length >= 2;
  const emailOk = emailPattern.test(form.email.trim());
  const strong = isStrongPassword(form.password);
  const matches = form.confirm !== "" && form.password === form.confirm;
  const valid = nameOk && emailOk && strong && matches && agree;

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const markTouched = (e) =>
    setTouched({ ...touched, [e.target.name]: true });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({
      name: true,
      email: true,
      password: true,
      confirm: true,
      agree: true,
    });

    if (!valid) {
      setError("Please complete the highlighted fields.");
      return;
    }

    setError("");
    setLoading(true);
    try {
      const data = await register(
        form.name.trim(),
        form.email.trim(),
        form.password,
        form.confirm
      );
      sessionStorage.setItem("pendingRegistrationEmail", data.email);
      navigate("/verify", {
        state: { email: data.email, channel: data.channel },
      });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          (err.response
            ? "Unexpected server reply (" + err.response.status + "). Please try again."
            : "Cannot reach the server. It may be waking up, so please wait a minute and try again.")
      );
    } finally {
      setLoading(false);
    }
  };

  if (user) return <Navigate to="/" replace />;

  return (
    <AuthShell>
      <header className="tf-head">
        <h1>Create your workspace</h1>
        <p>Start organizing your work today.</p>
      </header>

      {error && (
        <div className="tf-alert" role="alert">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <div className="tf-field">
          <label htmlFor="name">Full name</label>
          <div className="tf-input">
            <input
              id="name"
              name="name"
              autoComplete="name"
              placeholder="Your full name"
              value={form.name}
              onChange={handleChange}
              onBlur={markTouched}
              aria-invalid={touched.name && !nameOk ? true : undefined}
              aria-describedby="name-error"
              required
            />
          </div>
          {touched.name && !nameOk && (
            <p className="tf-error" id="name-error">
              Enter your full name.
            </p>
          )}
        </div>

        <div className="tf-field">
          <label htmlFor="email">Email address</label>
          <div className="tf-input">
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              onBlur={markTouched}
              aria-invalid={touched.email && !emailOk ? true : undefined}
              aria-describedby="email-error"
              required
            />
          </div>
          {touched.email && !emailOk && (
            <p className="tf-error" id="email-error">
              Enter a valid email address.
            </p>
          )}
        </div>

        <PasswordField
          id="password"
          label="Password"
          placeholder="Create a strong password"
          autoComplete="new-password"
          value={form.password}
          onChange={handleChange}
          onBlur={markTouched}
          invalid={touched.password && !strong}
          describedBy="password-strength"
        />
        <PasswordStrength id="password-strength" password={form.password} />

        <PasswordField
          id="confirm"
          label="Confirm password"
          placeholder="Type the password again"
          autoComplete="new-password"
          value={form.confirm}
          onChange={handleChange}
          onBlur={markTouched}
          invalid={touched.confirm && !matches}
          describedBy="confirm-note"
        />
        {form.confirm !== "" && (
          <p
            id="confirm-note"
            className={"tf-note " + (matches ? "ok" : "bad")}
            aria-live="polite"
          >
            {matches ? "Passwords match" : "Passwords do not match yet"}
          </p>
        )}

        <label className="tf-check">
          <input
            type="checkbox"
            checked={agree}
            onChange={(e) => setAgree(e.target.checked)}
          />
          <span>
            I agree to the{" "}
            <Link to="/terms" target="_blank" rel="noopener noreferrer">
              Terms
            </Link>{" "}
            and{" "}
            <Link to="/privacy" target="_blank" rel="noopener noreferrer">
              Privacy Policy
            </Link>
            .
          </span>
        </label>
        {touched.agree && !agree && (
          <p className="tf-error">Please accept the Terms to continue.</p>
        )}

        <button type="submit" className="tf-btn" disabled={loading}>
          {loading && <span className="tf-spin" aria-hidden="true" />}
          <span>{loading ? "Creating account..." : "Create account"}</span>
          {!loading && <ArrowRight size={16} />}
        </button>
      </form>

      <p className="tf-switch">
        Already have an account? <Link to="/login">Log in</Link>
      </p>
    </AuthShell>
  );
}