import { useEffect, useState } from "react";
import { svc } from "../api/service";
import { Modal, Loading } from "../components/ui";

export default function Departments() {
  const [departments, setDepartments] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", managerId: "" });
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const [depts, emps] = await Promise.all([svc.list("departments"), svc.list("employees")]);
    setDepartments(depts);
    setEmployees(emps);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!form.name.trim()) return;
    setBusy(true);
    try {
      const payload = { name: form.name.trim(), managerId: Number(form.managerId) || null };
      if (editing === "new") await svc.add("departments", payload);
      else await svc.update("departments", editing, payload);
      setEditing(null);
      await load();
    } finally { setBusy(false); }
  };

  if (!departments) return <Loading />;

  return (
    <>
      <div className="card">
        <div className="card-head">
          <h2>Departments ({departments.length})</h2>
          <button className="btn" onClick={() => { setForm({ name: "", managerId: "" }); setEditing("new"); }}>
            + Add department
          </button>
        </div>
        <div className="table-wrap">
          <table className="grid">
            <thead><tr><th>Department</th><th>Manager</th><th className="num">Headcount</th><th></th></tr></thead>
            <tbody>
              {departments.map((d) => (
                <tr key={d.id}>
                  <td><b>{d.name}</b></td>
                  <td>{employees.find((e) => e.id === d.managerId)?.fullName || "—"}</td>
                  <td className="num">{employees.filter((e) => e.departmentId === d.id && e.isActive).length}</td>
                  <td>
                    <button className="btn ghost sm"
                      onClick={() => { setForm({ name: d.name, managerId: d.managerId || "" }); setEditing(d.id); }}>
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editing && (
        <Modal title={editing === "new" ? "Add department" : "Edit department"} onClose={() => setEditing(null)}>
          <div className="field"><label>Department name *</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="field"><label>Manager</label>
            <select value={form.managerId} onChange={(e) => setForm({ ...form, managerId: e.target.value })}>
              <option value="">No manager</option>
              {employees.map((e) => <option key={e.id} value={e.id}>{e.fullName}</option>)}
            </select>
          </div>
          <div className="modal-actions">
            <button className="btn ghost" onClick={() => setEditing(null)}>Cancel</button>
            <button className="btn" onClick={save} disabled={busy}>{busy ? "Saving…" : "Save"}</button>
          </div>
        </Modal>
      )}
    </>
  );
}
