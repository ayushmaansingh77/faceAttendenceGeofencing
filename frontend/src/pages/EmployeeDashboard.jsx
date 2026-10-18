import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import Badge from "../components/ui/Badge.jsx";
import { CheckInIcon, CheckOutIcon, EnrollIcon, AttendanceIcon } from "../components/ui/Icons.jsx";

export default function EmployeeDashboard() {
  const { user } = useAuth();

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16, marginBottom: 24 }}>
        <div>
          <h1>Welcome, {user?.name || "Employee"}</h1>
          <p className="sub" style={{ marginBottom: 0 }}>
            Biometric ID: <span style={{ fontFamily: "var(--font-mono)", color: "var(--text)" }}>#{user?.id}</span> · Staff Terminal
          </p>
        </div>
        <div>
          {user?.has_face_enrolled ? (
            <Badge tone="ok">Face Enrolled</Badge>
          ) : (
            <Badge tone="bad">Face Not Enrolled</Badge>
          )}
        </div>
      </div>

      <div className="grid">
        <Link to="/check-in" className="card" style={{ borderColor: "rgba(16, 185, 129, 0.4)" }}>
          <div>
            <div style={{ marginBottom: 10, color: "#10b981" }}>
              <CheckInIcon size={24} color="#10b981" />
            </div>
            <div className="stat-value" style={{ fontSize: 20 }}>Check In</div>
            <div className="stat-label">Verify face & location entry</div>
          </div>
        </Link>

        <Link to="/check-out" className="card" style={{ borderColor: "rgba(239, 68, 68, 0.4)" }}>
          <div>
            <div style={{ marginBottom: 10, color: "#ef4444" }}>
              <CheckOutIcon size={24} color="#ef4444" />
            </div>
            <div className="stat-value" style={{ fontSize: 20 }}>Check Out</div>
            <div className="stat-label">Log departure timestamp</div>
          </div>
        </Link>

        <Link to="/enroll" className="card">
          <div>
            <div style={{ marginBottom: 10, color: "var(--accent)" }}>
              <EnrollIcon size={24} />
            </div>
            <div className="stat-value" style={{ fontSize: 20 }}>
              {user?.has_face_enrolled ? "Update Face" : "Enroll Face"}
            </div>
            <div className="stat-label">Generate 128-D SFace vector</div>
          </div>
        </Link>

        <Link to="/my-attendance" className="card">
          <div>
            <div style={{ marginBottom: 10, color: "var(--text-muted)" }}>
              <AttendanceIcon size={24} />
            </div>
            <div className="stat-value" style={{ fontSize: 20 }}>Attendance</div>
            <div className="stat-label">View your past punch history</div>
          </div>
        </Link>
      </div>

      {!user?.has_face_enrolled && (
        <div
          style={{
            padding: "16px 20px",
            background: "rgba(245, 166, 35, 0.08)",
            border: "1px solid rgba(245, 166, 35, 0.3)",
            borderRadius: "var(--radius-md)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
            marginTop: 12,
          }}
        >
          <div>
            <div style={{ fontWeight: 700, color: "var(--accent)", marginBottom: 2 }}>Face Enrollment Required</div>
            <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
              Before checking in at any gate zone, capture your face vector to enable recognition.
            </div>
          </div>
          <Link to="/enroll" className="btn" style={{ fontSize: 13, padding: "8px 18px", textDecoration: "none" }}>
            Enroll Face Now →
          </Link>
        </div>
      )}
    </div>
  );
}

