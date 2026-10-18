import { useState } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useTheme } from "../context/ThemeContext.jsx";
import FaceGateLogo from "./FaceGateLogo.jsx";
import {
  DashboardIcon,
  EnrollIcon,
  CheckInIcon,
  CheckOutIcon,
  AttendanceIcon,
  EmployeesIcon,
  GeofenceIcon,
  SunIcon,
  MoonIcon,
  MenuIcon,
} from "./ui/Icons.jsx";

function NavLinks({ role, onNavigate }) {
  return (
    <>
      {role === "employee" && (
        <>
          <NavLink to="/dashboard" end onClick={onNavigate}>
            <DashboardIcon size={16} /> Dashboard
          </NavLink>
          <NavLink to="/enroll" onClick={onNavigate}>
            <EnrollIcon size={16} /> Enroll Face
          </NavLink>
          <NavLink to="/check-in" onClick={onNavigate}>
            <CheckInIcon size={16} color="currentColor" /> Check In
          </NavLink>
          <NavLink to="/check-out" onClick={onNavigate}>
            <CheckOutIcon size={16} color="currentColor" /> Check Out
          </NavLink>
          <NavLink to="/my-attendance" onClick={onNavigate}>
            <AttendanceIcon size={16} /> My Attendance
          </NavLink>
        </>
      )}
      {role === "admin" && (
        <>
          <NavLink to="/admin" end onClick={onNavigate}>
            <DashboardIcon size={16} /> Dashboard
          </NavLink>
          <NavLink to="/admin/employees" onClick={onNavigate}>
            <EmployeesIcon size={16} /> Employees
          </NavLink>
          <NavLink to="/admin/geofences" onClick={onNavigate}>
            <GeofenceIcon size={16} /> Geofencing
          </NavLink>
          <NavLink to="/admin/attendance" onClick={onNavigate}>
            <AttendanceIcon size={16} /> Attendance Log
          </NavLink>
        </>
      )}
    </>
  );
}

export default function Layout() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);

  const isDark = theme === "dark" || (!theme && window.matchMedia?.("(prefers-color-scheme: dark)").matches);

  return (
    <div className="app-shell">
      <div className="topbar">
        <button className="hamburger" aria-label="Open menu" aria-expanded={menuOpen} onClick={() => setMenuOpen(true)}>
          <MenuIcon size={18} />
        </button>
        <Link to="/" style={{ textDecoration: "none" }}>
          <FaceGateLogo size={24} />
        </Link>
        <div style={{ width: 40 }} />
      </div>

      <div className={`sidebar-backdrop ${menuOpen ? "open" : ""}`} onClick={() => setMenuOpen(false)} />

      <aside className={`sidebar ${menuOpen ? "open" : ""}`}>
        <div className="brand">
          <Link to="/" style={{ textDecoration: "none" }}>
            <FaceGateLogo size={28} />
          </Link>
        </div>
        <nav className="nav">
          <NavLinks role={user?.role} onNavigate={() => setMenuOpen(false)} />
        </nav>
        <div className="sidebar-footer">
          <button className="theme-toggle" onClick={toggleTheme} type="button" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            {isDark ? <><SunIcon size={15} /> Light mode</> : <><MoonIcon size={15} /> Dark mode</>}
          </button>
          {user && (
            <div style={{ padding: "8px 0" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 10,
                  padding: "6px 8px",
                  background: "var(--surface-2)",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--border)",
                }}
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    background: "rgba(245, 166, 35, 0.15)",
                    border: "1px solid var(--accent)",
                    color: "var(--accent)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                </div>
                <div style={{ overflow: "hidden" }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                    {user.name}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    {user.role}
                  </div>
                </div>
              </div>
              <button className="btn-secondary" onClick={logout} style={{ width: "100%", fontSize: 13 }}>
                Sign out
              </button>
            </div>
          )}
        </div>
      </aside>

      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
