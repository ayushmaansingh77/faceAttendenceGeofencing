import { useEffect, useState } from "react";
import { getMyAttendance } from "../api.js";
import Badge from "../components/ui/Badge.jsx";
import Card from "../components/ui/Card.jsx";

function fmt(dt) {
  if (!dt) return "—";
  return dt.replace("T", " ").slice(0, 19);
}

export default function MyAttendance() {
  const [records, setRecords] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      const data = await getMyAttendance();
      if (!data.ok) {
        setError(data.error || "Failed to load attendance.");
        return;
      }
      setRecords(data.records || []);
    }
    load();
  }, []);

  return (
    <>
      <h1>My Attendance</h1>
      <p className="sub">Your check-in / check-out history.</p>
      <Card>
        {error && <div className="result bad">{error}</div>}
        {records.length === 0 ? (
          <p className="sub">No attendance records yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Check In</th>
                <th>Zone</th>
                <th>Check Out</th>
                <th>Zone</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr key={r.id}>
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
