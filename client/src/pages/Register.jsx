import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000"; // CRA: process.env.REACT_APP_API_URL

const rules = [
  { label: "At least 8 characters", test: (p) => p.length >= 8 },
  { label: "One uppercase letter", test: (p) => /[A-Z]/.test(p) },
  { label: "One number", test: (p) => /\d/.test(p) },
  { label: "One special character (!@#$%^&*)", test: (p) => /[^A-Za-z0-9]/.test(p) },
];

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const results = rules.map((r) => ({ ...r, ok: r.test(form.password) }));
  const passwordValid = results.every((r) => r.ok);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!passwordValid) {
      setError("Password does not meet all requirements.");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Registration failed");
        return;
      }

      navigate("/login"); // only reached when everything is valid and saved
    } catch {
      setError("Cannot reach server. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "60px auto", padding: 20 }}>
      <h2>Create account</h2>
      <form onSubmit={handleSubmit}>
        <input
          name="name" placeholder="Full name" value={form.name}
          onChange={handleChange} required style={{ width: "100%", marginBottom: 12 }}
        />
        <input
          name="email" type="email" placeholder="Email" value={form.email}
          onChange={handleChange} required style={{ width: "100%", marginBottom: 12 }}
        />
        <input
          name="password" type={showPassword ? "text" : "password"}
          placeholder="Password" value={form.password}
          onChange={handleChange} required style={{ width: "100%" }}
        />
        <label style={{ fontSize: 13 }}>
          <input type="checkbox" checked={showPassword}
            onChange={() => setShowPassword(!showPassword)} /> Show password
        </label>

        <ul style={{ listStyle: "none", padding: 0, margin: "12px 0" }}>
          {results.map((r) => (
            <li key={r.label} style={{ color: r.ok ? "green" : "#b00020", fontSize: 14 }}>
              {r.ok ? "✔" : "✖"} {r.label}
            </li>
          ))}
        </ul>

        {error && <p style={{ color: "#b00020" }}>{error}</p>}

        <button type="submit" disabled={!passwordValid || loading} style={{ width: "100%" }}>
          {loading ? "Creating..." : "Register"}
        </button>
      </form>
      <p>Already have an account? <Link to="/login">Login</Link></p>
    </div>
  );
}
