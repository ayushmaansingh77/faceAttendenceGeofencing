import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { EmployeesIcon, GeofenceIcon, AttendanceIcon } from "../components/ui/Icons.jsx";

export default function AdminDashboard() {
  const { user } = useAuth();

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1>Security Command Center</h1>
        <p className="sub" style={{ margin: 0 }}>
          Administrator: <strong style={{ color: "var(--text)" }}>{user?.name}</strong> (<code style={{ color: "var(--accent)" }}>{user?.email}</code>)
        </p>
      </div>

      <div className="grid">
        <Link to="/admin/employees" className="card">
          <div>
            <div style={{ marginBottom: 10, color: "var(--accent)" }}>
              <EmployeesIcon size={24} />
            </div>
            <div className="stat-value" style={{ fontSize: 22 }}>Staff Directory</div>
            <div className="stat-label">Create, manage, and toggle employees</div>
          </div>
        </Link>

        <Link to="/admin/geofences" className="card">
          <div>
            <div style={{ marginBottom: 10, color: "var(--accent)" }}>
              <GeofenceIcon size={24} />
            </div>
            <div className="stat-value" style={{ fontSize: 22 }}>Geofence Zones</div>
            <div className="stat-label">Configure GPS perimeter boundaries</div>
          </div>
        </Link>

        <Link to="/admin/attendance" className="card">
          <div>
            <div style={{ marginBottom: 10, color: "var(--accent)" }}>
              <AttendanceIcon size={24} />
            </div>
            <div className="stat-value" style={{ fontSize: 22 }}>Live Attendance</div>
            <div className="stat-label">Audit biometric timestamps & zone status</div>
          </div>
        </Link>
      </div>

      <div
        className="panel"
        style={{
          marginTop: 24,
          background: "linear-gradient(135deg, var(--surface) 0%, var(--surface-2) 100%)",
          border: "1px solid var(--border)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: "#10b981", boxShadow: "0 0 10px #10b981" }} />
          <h2 style={{ fontSize: 16, margin: 0 }}>Active Engine Pipeline</h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
          <div style={{ padding: 12, background: "rgba(0,0,0,0.2)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-light)" }}>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>DETECTION MODEL</div>
            <div style={{ fontWeight: 700, fontFamily: "var(--font-mono)", fontSize: 14 }}>YuNet (2023mar)</div>
            <div style={{ fontSize: 12, color: "var(--text-subtle)", marginTop: 2 }}>5 facial landmark points</div>
          </div>
          <div style={{ padding: 12, background: "rgba(0,0,0,0.2)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-light)" }}>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>RECOGNITION BACKBONE</div>
            <div style={{ fontWeight: 700, fontFamily: "var(--font-mono)", fontSize: 14 }}>SFace Recognizer</div>
            <div style={{ fontSize: 12, color: "var(--text-subtle)", marginTop: 2 }}>128-D L2-normalized vector</div>
          </div>
          <div style={{ padding: 12, background: "rgba(0,0,0,0.2)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-light)" }}>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>GEOFENCE VERIFIER</div>
            <div style={{ fontWeight: 700, fontFamily: "var(--font-mono)", fontSize: 14 }}>Haversine Great-Circle</div>
            <div style={{ fontSize: 12, color: "var(--text-subtle)", marginTop: 2 }}>Dynamic radius boundary</div>
          </div>
        </div>
      </div>
    </div>
  );
}

