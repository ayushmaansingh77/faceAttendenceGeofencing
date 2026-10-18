import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import Button from "../components/ui/Button.jsx";
import Card from "../components/ui/Card.jsx";
import FormField from "../components/ui/FormField.jsx";
import FaceGateLogo from "../components/FaceGateLogo.jsx";

export default function Login() {
  const { user, login, logout } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const navigate = useNavigate();

  if (user) {
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
            <h1 style={{ fontSize: 24, margin: "0 0 6px" }}>Currently Authenticated</h1>
            <p className="sub" style={{ margin: 0 }}>
              Signed in as <strong style={{ color: "var(--text)" }}>{user.name}</strong> ({user.role})
            </p>
          </div>
          <Card style={{ padding: 24, display: "flex", flexDirection: "column", gap: 12 }}>
            <Button
              onClick={() => navigate(user.role === "admin" ? "/admin" : "/dashboard", { replace: true })}
            >
              Continue to {user.role === "admin" ? "Admin Console" : "Employee Dashboard"} →
            </Button>
            <button
              type="button"
              className="btn-secondary"
              style={{ width: "100%", padding: "10px 14px", fontSize: 14 }}
              onClick={logout}
            >
              Sign Out to Switch Account
            </button>
          </Card>
        </main>
      </div>
    );
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setPending(true);
    const data = await login(email.trim(), password);
    setPending(false);
    if (!data || !data.ok) {
      setError(data?.error || "Login failed. Check your credentials.");
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
      <main style={{ width: "100%", maxWidth: 400 }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <Link to="/" style={{ textDecoration: "none", display: "inline-block", marginBottom: 16 }}>
            <FaceGateLogo size={32} />
          </Link>
          <h1 style={{ fontSize: 24, margin: "0 0 6px" }}>Access Terminal</h1>
          <p className="sub" style={{ margin: 0 }}>Authenticate with your employee or admin credentials</p>
        </div>

        <Card as="form" onSubmit={onSubmit} style={{ padding: 28, boxShadow: "var(--shadow-md)" }}>
          <FormField label="Email Address">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. employee@example.com"
              autoComplete="email"
              required
            />
          </FormField>
          <FormField label="Password">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </FormField>

          <Button type="submit" loading={pending} style={{ width: "100%", marginTop: 12 }}>
            Authenticate →
          </Button>

          {error && <div className="result bad">{error}</div>}

          {/* Quick preset hints for user convenience */}
          <div
            style={{
              marginTop: 20,
              padding: "12px",
              background: "var(--surface-2)",
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--border)",
              fontSize: 12,
              color: "var(--text-muted)",
              lineHeight: 1.6,
            }}
          >
            <div><strong>Demo Quick-Fill:</strong></div>
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <button
                type="button"
                className="btn-secondary"
                style={{ flex: 1, padding: "6px 8px", fontSize: 12, cursor: "pointer" }}
                onClick={() => {
                  setEmail("employee@example.com");
                  setPassword("employee123");
                }}
              >
                Fill Staff
              </button>
              <button
                type="button"
                className="btn-secondary"
                style={{ flex: 1, padding: "6px 8px", fontSize: 12, cursor: "pointer" }}
                onClick={() => {
                  setEmail("admin@example.com");
                  setPassword("admin123");
                }}
              >
                Fill Admin
              </button>
            </div>
            <div style={{ marginTop: 8, fontSize: 11, color: "var(--text-subtle)" }}>
              Staff: <code>employee@example.com</code> / <code>employee123</code><br/>
              Admin: <code>admin@example.com</code> / <code>admin123</code>
            </div>
          </div>
        </Card>

        <p className="sub" style={{ textAlign: "center", marginTop: 20 }}>
          New to FaceGate? <Link to="/signup" style={{ color: "var(--accent)", fontWeight: 600 }}>Create employee account</Link>
        </p>
      </main>
    </div>
  );
}

