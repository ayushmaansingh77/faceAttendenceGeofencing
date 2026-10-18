import { useEffect, useState } from "react";
import { createEmployee, deleteEmployee, listEmployees, setEmployeeActive } from "../../api.js";
import Badge from "../../components/ui/Badge.jsx";
import Button from "../../components/ui/Button.jsx";
import Card from "../../components/ui/Card.jsx";
import FormField from "../../components/ui/FormField.jsx";
import { useToast } from "../../components/ui/Toast.jsx";

export default function EmployeeManagement() {
  const { showToast } = useToast();
  const [employees, setEmployees] = useState([]);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [formError, setFormError] = useState("");
  const [pending, setPending] = useState(false);

  async function refresh() {
    const data = await listEmployees();
    if (!data.ok) {
      setError(data.error || "Failed to load employees.");
      return;
    }
    setError("");
    setEmployees(data.employees || []);
  }

  useEffect(() => {
    refresh();
  }, []);

  async function onCreate(e) {
    e.preventDefault();
    setFormError("");
    setPending(true);
    const data = await createEmployee(form.name.trim(), form.email.trim(), form.password);
    setPending(false);
    if (!data.ok) {
      setFormError(data.error || data.detail || "Failed to create employee.");
      return;
    }
    setForm({ name: "", email: "", password: "" });
    showToast(`${data.user.name} was added as an employee.`, "ok");
    refresh();
  }

  async function onToggleActive(employee) {
    await setEmployeeActive(employee.id, !employee.is_active);
    showToast(`${employee.name} ${employee.is_active ? "deactivated" : "reactivated"}.`, "ok");
    refresh();
  }

  async function onDelete(employee) {
    if (!window.confirm(`Permanently delete ${employee.name}? This also removes their face enrollment and attendance history.`)) {
      return;
    }
    await deleteEmployee(employee.id);
    showToast(`${employee.name} was deleted.`, "ok");
    refresh();
  }

  return (
    <>
      <h1>Employees</h1>
      <p className="sub">Create employee accounts. Employees log in and enroll their own face afterward.</p>

      <Card as="form" onSubmit={onCreate} style={{ maxWidth: 480, marginBottom: 24 }}>
        <h2 style={{ margin: "0 0 12px", fontSize: "1.1rem" }}>Create Employee</h2>
        <FormField label="Full name">
          <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        </FormField>
        <FormField label="Email">
          <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        </FormField>
        <FormField label="Initial password" hint="At least 6 characters.">
          <input
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            minLength={6}
            required
          />
        </FormField>
        <Button type="submit" loading={pending} style={{ marginTop: 8 }}>
          Create Employee
        </Button>
        {formError && <div className="result bad">{formError}</div>}
      </Card>

      <Card>
        {error && <div className="result bad">{error}</div>}
        {employees.length === 0 ? (
          <p className="sub">No employees yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Face Enrolled</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp) => (
                <tr key={emp.id}>
                  <td>{emp.name}</td>
                  <td>{emp.email}</td>
                  <td>
                    <Badge tone={emp.has_face_enrolled ? "ok" : "bad"}>
                      {emp.has_face_enrolled ? "Yes" : "No"}
                    </Badge>
                  </td>
                  <td>
                    <Badge tone={emp.is_active ? "ok" : "bad"}>
                      {emp.is_active ? "Active" : "Deactivated"}
                    </Badge>
                  </td>
                  <td>
                    <div className="row">
                      <Button variant="secondary" onClick={() => onToggleActive(emp)}>
                        {emp.is_active ? "Deactivate" : "Reactivate"}
                      </Button>
                      <Button variant="danger" onClick={() => onDelete(emp)}>
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </>
  );
}
