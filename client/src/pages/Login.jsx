import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Lock, LogIn, Mail } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { user, login, resendOtp } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success("Welcome back");
      navigate("/");
    } catch (err) {
      const data = err.response?.data;
      if (err.response?.status === 403 && data?.requiresVerification) {
        try {
          await resendOtp(data.email);
        } catch (resendError) {
          console.log("Code was not resent");
        }
        toast("Please verify your email first");
        navigate("/verify", { state: { email: data.email } });
      } else {
        setError(
          data?.message ||
            "Cannot reach the server. It may be waking up, so please wait a minute and try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  if (user) return <Navigate to="/" replace />;

  return (
    <div className="auth-card">
      <div className="auth-icon">
        <LogIn size={22} />
      </div>
      <h1>Welcome back</h1>
      <p className="auth-sub">Log in to continue to your projects.</p>

      {error && <p className="error">{error}</p>}

      <form onSubmit={handleSubmit}>
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
            placeholder="Your password"
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

        <button type="submit" disabled={loading}>
          {loading ? "Logging in..." : "Log in"}
        </button>
      </form>

      <p className="auth-switch">
        New to TaskFlow? <Link to="/register">Create an account</Link>
      </p>
    </div>
  );
}