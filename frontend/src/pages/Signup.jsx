import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import Button from "../components/ui/Button.jsx";
import Card from "../components/ui/Card.jsx";
import FormField from "../components/ui/FormField.jsx";
import FaceGateLogo from "../components/FaceGateLogo.jsx";

export default function Signup() {
  const { user, signup } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const navigate = useNavigate();

  if (user) {
    return <Navigate to={user.role === "admin" ? "/admin" : "/dashboard"} replace />;
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setPending(true);
    const data = await signup(form.name.trim(), form.email.trim(), form.password);
    setPending(false);
    if (!data.ok) {
      setError(data.error || data.detail || "Signup failed.");
      return;
    }
    navigate(data.user.role === "admin" ? "/admin" : "/dashboard", { replace: true });
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 16px",
        background: "var(--bg)",
        backgroundImage: "var(--bg-gradient)",
      }}
    >
      <main style={{ width: "100%", maxWidth: 420 }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <Link to="/" style={{ textDecoration: "none", display: "inline-block", marginBottom: 16 }}>
            <FaceGateLogo size={32} />
          </Link>
          <h1 style={{ fontSize: 24, margin: "0 0 6px" }}>Register Employee</h1>
          <p className="sub" style={{ margin: 0 }}>Enroll into the biometric attendance directory</p>
        </div>

        <Card as="form" onSubmit={onSubmit} style={{ padding: 28, boxShadow: "var(--shadow-md)" }}>
          <FormField label="Full Name">
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Sarah Connor"
              required
            />
          </FormField>
          <FormField label="Work Email">
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="e.g. sarah@company.com"
              required
            />
          </FormField>
          <FormField label="Password" hint="At least 6 characters.">
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="••••••••"
              minLength={6}
              required
            />
          </FormField>
          <Button type="submit" loading={pending} style={{ width: "100%", marginTop: 12 }}>
            Register & Continue →
          </Button>
          {error && <div className="result bad">{error}</div>}
        </Card>
        <p className="sub" style={{ textAlign: "center", marginTop: 20 }}>
          Already registered? <Link to="/login" style={{ color: "var(--accent)", fontWeight: 600 }}>Access Terminal</Link>
        </p>
      </main>
    </div>
  );
}

