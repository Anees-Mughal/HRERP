import { useEffect, useState } from "react";
import { svc } from "../api/service";
import { Modal, StatusBadge, Loading } from "../components/ui";

const Stars = ({ n }) => (
  <span style={{ color: "#eab308", letterSpacing: 2 }}>
    {"★".repeat(n)}<span style={{ color: "#d8dce4" }}>{"★".repeat(5 - n)}</span>
  </span>
);

export default function Appraisals() {
  const [appraisals, setAppraisals] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const [aps, emps] = await Promise.all([svc.list("appraisals"), svc.list("employees")]);
    setAppraisals(aps); setEmployees(emps);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    setBusy(true);
    try {
      const payload = {
        ...form,
        employeeId: Number(form.employeeId),
        rating: Number(form.rating) || 0,
        status: Number(form.rating) > 0 ? "Completed" : "In Review",
      };
      if (editing === "new") await svc.add("appraisals", payload);
      else await svc.update("appraisals", editing, payload);
      setEditing(null);
      await load();
    } finally { setBusy(false); }
  };

  if (!appraisals) return <Loading />;

  return (
    <>
      <div className="card">
        <div className="card-head">
          <h2>Appraisal cycles</h2>
          <button className="btn" onClick={() => {
            setForm({ employeeId: "", cycle: "H1 2026", goals: "", rating: 0, managerComment: "" });
            setEditing("new");
          }}>+ Start appraisal</button>
        </div>
        <div className="table-wrap">
          <table className="grid">
            <thead><tr><th>Employee</th><th>Cycle</th><th>Goals</th><th>Rating</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {appraisals.map((a) => (
                <tr key={a.id}>
                  <td><b>{employees.find((e) => e.id === a.employeeId)?.fullName}</b></td>
                  <td>{a.cycle}</td>
                  <td style={{ maxWidth: 280 }}>{a.goals}</td>
                  <td>{a.rating > 0 ? <Stars n={a.rating} /> : <span className="muted">Not rated</span>}</td>
                  <td><StatusBadge status={a.status} /></td>
                  <td><button className="btn ghost sm" onClick={() => { setForm({ ...a }); setEditing(a.id); }}>Review</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editing && (
        <Modal title={editing === "new" ? "Start appraisal" : "Review appraisal"} onClose={() => setEditing(null)}>
          <div className="field"><label>Employee</label>
            <select value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })} disabled={editing !== "new"}>
              <option value="">Select…</option>
              {employees.map((e) => <option key={e.id} value={e.id}>{e.fullName}</option>)}
            </select>
          </div>
          <div className="field"><label>Cycle</label><input value={form.cycle} onChange={(e) => setForm({ ...form, cycle: e.target.value })} /></div>
          <div className="field"><label>Goals</label><textarea rows={3} value={form.goals} onChange={(e) => setForm({ ...form, goals: e.target.value })} /></div>
          <div className="field"><label>Rating (1–5)</label>
            <select value={form.rating} onChange={(e) => setForm({ ...form, rating: e.target.value })}>
              <option value={0}>Not rated yet</option>
              {[1,2,3,4,5].map((n) => <option key={n} value={n}>{n} star{n > 1 ? "s" : ""}</option>)}
            </select>
          </div>
          <div className="field"><label>Manager comments</label><textarea rows={2} value={form.managerComment} onChange={(e) => setForm({ ...form, managerComment: e.target.value })} /></div>
          <div className="modal-actions">
            <button className="btn ghost" onClick={() => setEditing(null)}>Cancel</button>
            <button className="btn" onClick={save} disabled={busy}>{busy ? "Saving…" : "Save"}</button>
          </div>
        </Modal>
      )}
    </>
  );
}
