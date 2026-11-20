import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import {
  Check,
  Circle,
  Eye,
  EyeOff,
  Lock,
  Mail,
  User,
  UserPlus,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getPasswordChecks, isStrongPassword } from "../utils/passwordRules";

const strengthLabels = ["Too weak", "Weak", "Fair", "Good", "Strong"];

export default function Register() {
  const { user, register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirm: "",
  });
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const checks = getPasswordChecks(form.password);
  const passed = checks.filter((c) => c.ok).length;
  const strong = isStrongPassword(form.password);
  const matches = form.confirm !== "" && form.password === form.confirm;
  const canSubmit = strong && matches && !loading;

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!strong) {
      setError("Please meet all the password rules");
      return;
    }
    if (!matches) {
      setError("The two passwords do not match");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const data = await register(
        form.name,
        form.email,
        form.password,
        form.confirm
      );
      sessionStorage.setItem("pendingRegistrationEmail", data.email);
      navigate("/verify", {
        state: { email: data.email, resendAfter: data.resendAfter },
      });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Cannot reach the server. It may be waking up, so please wait a minute and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  if (user) return <Navigate to="/" replace />;

  return (
    <div className="auth-card">
      <div className="auth-icon">
        <UserPlus size={22} />
      </div>
      <h1>Create your account</h1>
      <p className="auth-sub">
        Join TaskFlow and keep your projects organised in one place.
      </p>

      {error && <p className="error">{error}</p>}

      <form onSubmit={handleSubmit}>
        <label>Full name</label>
        <div className="field">
          <User size={16} />
          <input
            name="name"
            placeholder="Your name"
            value={form.name}
            onChange={handleChange}
            required
          />
        </div>

        <label>Email</label>
        <div className="field">
          <Mail size={16} />
          <input
            type="email"
            name="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={handleChange}
            required
          />
        </div>

        <label>Password</label>
        <div className="field pw">
          <Lock size={16} />
          <input
            type={show ? "text" : "password"}
            name="password"
            placeholder="Create a strong password"
            value={form.password}
            onChange={handleChange}
            required
          />
          <button
            type="button"
            className="pw-toggle"
            aria-label="Show or hide password"
            onClick={() => setShow(!show)}
          >
            {show ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        <div className="pw-meter">
          <div
            className={"pw-meter-fill s" + passed}
            style={{ width: passed * 25 + "%" }}
          />
        </div>
        <div className="pw-strength">
          <span>Password strength</span>
          <span className={"lvl s" + passed}>{strengthLabels[passed]}</span>
        </div>
        <ul className="pw-rules grid">
          {checks.map((c) => (
            <li key={c.label} className={c.ok ? "ok" : "bad"}>
              {c.ok ? <Check size={14} /> : <Circle size={14} />} {c.label}
            </li>
          ))}
        </ul>

        <label>Confirm password</label>
        <div className="field">
          <Lock size={16} />
          <input
            type={show ? "text" : "password"}
            name="confirm"
            placeholder="Type the password again"
            value={form.confirm}
            onChange={handleChange}
            required
          />
        </div>
        {form.confirm !== "" && (
          <p className={"match-msg " + (matches ? "ok" : "bad")}>
            {matches ? "Passwords match" : "Passwords do not match yet"}
          </p>
        )}

        <button type="submit" disabled={!canSubmit}>
          {loading ? "Sending code..." : "Create account"}
        </button>
      </form>

      <p className="auth-switch">
        Already have an account? <Link to="/login">Log in</Link>
      </p>
    </div>
  );
}