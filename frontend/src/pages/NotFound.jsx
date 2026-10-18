import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import FaceGateLogo from "../components/FaceGateLogo.jsx";
import Card from "../components/ui/Card.jsx";
import Button from "../components/ui/Button.jsx";

export default function NotFound() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const destination = user
    ? user.role === "admin"
      ? "/admin"
      : "/dashboard"
    : "/";

  const destinationLabel = user
    ? user.role === "admin"
      ? "Return to Admin Console"
      : "Return to Dashboard"
    : "Back to Home";

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
      <main style={{ width: "100%", maxWidth: 460, textAlign: "center" }}>
        <div style={{ marginBottom: 24 }}>
          <Link to="/" style={{ textDecoration: "none", display: "inline-block", marginBottom: 16 }}>
            <FaceGateLogo size={36} />
          </Link>
          <div
            style={{
              display: "inline-block",
              padding: "4px 12px",
              borderRadius: "var(--radius-full)",
              background: "rgba(239, 68, 68, 0.12)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              color: "var(--danger)",
              fontFamily: "var(--font-mono)",
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: "0.08em",
              marginBottom: 12,
            }}
          >
            HTTP 404 · ROUTE UNRECOGNIZED
          </div>
          <h1 style={{ fontSize: 32, margin: "0 0 8px", letterSpacing: "-0.02em" }}>
            Endpoint Not Found
          </h1>
          <p className="sub" style={{ margin: 0, fontSize: 14 }}>
            The biometric terminal path or page you requested does not exist or has been relocated.
          </p>
        </div>

        <Card style={{ padding: 28, boxShadow: "var(--shadow-md)" }}>
          <div
            style={{
              padding: "16px",
              background: "var(--surface-2)",
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--border)",
              fontFamily: "var(--font-mono)",
              fontSize: 13,
              color: "var(--text-muted)",
              marginBottom: 20,
              wordBreak: "break-all",
            }}
          >
            <span style={{ color: "var(--text-subtle)" }}>PATH: </span>
            {window.location.pathname}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <Button onClick={() => navigate(destination)}>
              {destinationLabel} →
            </Button>
            <button
              type="button"
              className="btn-secondary"
              style={{ width: "100%", padding: "10px 14px", fontSize: 14 }}
              onClick={() => navigate(-1)}
            >
              ← Go Back to Previous Page
            </button>
          </div>
        </Card>
      </main>
    </div>
  );
}
