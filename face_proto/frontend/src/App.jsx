import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import RequireAuth from "./components/RequireAuth.jsx";
import RequireRole from "./components/RequireRole.jsx";
import Login from "./pages/Login.jsx";
import Signup from "./pages/Signup.jsx";
import LandingPage from "./pages/LandingPage.jsx";
import EmployeeDashboard from "./pages/EmployeeDashboard.jsx";
import EnrollFace from "./pages/EnrollFace.jsx";
import CheckIn from "./pages/CheckIn.jsx";
import CheckOut from "./pages/CheckOut.jsx";
import MyAttendance from "./pages/MyAttendance.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import EmployeeManagement from "./pages/admin/EmployeeManagement.jsx";
import GeofencePanel from "./pages/admin/GeofencePanel.jsx";
import AttendanceOverview from "./pages/admin/AttendanceOverview.jsx";
import NotFound from "./pages/NotFound.jsx";
import { useAuth } from "./context/AuthContext.jsx";

function HomeRoute() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to={user.role === "admin" ? "/admin" : "/dashboard"} replace />;
  return <LandingPage />;
}

export default function App() {
  return (
    <Routes>
      {/* Public landing & auth */}
      <Route path="/" element={<HomeRoute />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      {/* Protected app */}
      <Route element={<RequireAuth />}>
        <Route element={<Layout />}>
          <Route element={<RequireRole role="employee" redirectTo="/admin" />}>
            <Route path="/dashboard" element={<EmployeeDashboard />} />
            <Route path="/enroll" element={<EnrollFace />} />
            <Route path="/check-in" element={<CheckIn />} />
            <Route path="/check-out" element={<CheckOut />} />
            <Route path="/my-attendance" element={<MyAttendance />} />
          </Route>

          <Route element={<RequireRole role="admin" redirectTo="/dashboard" />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/employees" element={<EmployeeManagement />} />
            <Route path="/admin/geofences" element={<GeofencePanel />} />
            <Route path="/admin/attendance" element={<AttendanceOverview />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
