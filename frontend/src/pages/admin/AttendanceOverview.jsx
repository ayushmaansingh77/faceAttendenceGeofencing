import { useEffect, useState } from "react";
import { listAllAttendance, listEmployees } from "../../api.js";
import Badge from "../../components/ui/Badge.jsx";
import Button from "../../components/ui/Button.jsx";
import Card from "../../components/ui/Card.jsx";

function fmt(dt) {
  if (!dt) return "—";
  return dt.replace("T", " ").slice(0, 19);
}

export default function AttendanceOverview() {
  const [employees, setEmployees] = useState([]);
  const [records, setRecords] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ employee_id: "", date_from: "", date_to: "" });

  useEffect(() => {
    listEmployees().then((data) => {
      if (data.ok) setEmployees(data.employees || []);
    });
  }, []);

  async function refresh() {
    setLoading(true);
    const data = await listAllAttendance(filters);
    setLoading(false);
    if (!data.ok) {
      setError(data.error || "Failed to load attendance.");
      return;
    }
    setError("");
    setRecords(data.records || []);
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <h1>Attendance Overview</h1>
      <p className="sub">All employees' check-in / check-out records.</p>

      <Card style={{ marginBottom: 24 }}>
        <div className="row">
          <select
            value={filters.employee_id}
            onChange={(e) => setFilters({ ...filters, employee_id: e.target.value })}
            style={{ maxWidth: 220 }}
          >
            <option value="">All employees</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>{emp.name}</option>
            ))}
          </select>
          <input
            type="text"
            placeholder="From (YYYY-MM-DD)"
            value={filters.date_from}
            onChange={(e) => setFilters({ ...filters, date_from: e.target.value })}
            style={{ maxWidth: 180 }}
          />
          <input
            type="text"
            placeholder="To (YYYY-MM-DD)"
            value={filters.date_to}
            onChange={(e) => setFilters({ ...filters, date_to: e.target.value })}
            style={{ maxWidth: 180 }}
          />
          <Button onClick={refresh} loading={loading}>Filter</Button>
        </div>
      </Card>

      <Card>
        {error && <div className="result bad">{error}</div>}
        {records.length === 0 ? (
          <p className="sub">No attendance records match these filters.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Check In</th>
                <th>Zone</th>
                <th>Check Out</th>
                <th>Zone</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr key={r.id}>
                  <td>{r.user_name}</td>
                  <td>{fmt(r.check_in_at)}</td>
                  <td>{r.check_in_zone_name || "—"}</td>
                  <td>{r.check_out_at ? fmt(r.check_out_at) : <Badge tone="ok">Open</Badge>}</td>
                  <td>{r.check_out_zone_name || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </>
  );
}
