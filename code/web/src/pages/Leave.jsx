import { useEffect, useState } from "react";
import { svc } from "../api/service";
import { useAuth } from "../auth/AuthContext";
import { Modal, StatusBadge, Loading, Stat } from "../components/ui";

const daysBetween = (a, b) =>
  Math.round((new Date(b) - new Date(a)) / 86400000) + 1;

export default function Leave() {
  const { user, isAdmin } = useAuth();
  const [leaves, setLeaves] = useState(null);
  const [types, setTypes] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [applying, setApplying] = useState(false);
  const [form, setForm] = useState({ typeId: 1, from: "", to: "", reason: "" });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const [ls, ts, emps] = await Promise.all([
      svc.list("leaves"), svc.list("leaveTypes"), svc.list("employees"),
    ]);
    setLeaves(ls); setTypes(ts); setEmployees(emps);
  };
  useEffect(() => { load(); }, []);

  if (!leaves) return <Loading />;

  const myId = user.employeeId || 1;
  const visible = isAdmin ? leaves : leaves.filter((l) => l.employeeId === myId);

  // balances for the current employee
  const usedByType = (typeId) =>
    leaves.filter((l) => l.employeeId === myId && l.typeId === typeId && l.status === "Approved")
      .reduce((s, l) => s + l.days, 0);

  const apply = async () => {
    setErr("");
    if (!form.from || !form.to) return setErr("Select both dates.");
    if (new Date(form.to) < new Date(form.from)) return setErr("End date can't be before start date.");
    if (!form.reason.trim()) return setErr("Add a short reason.");
    const days = daysBetween(form.from, form.to);
    const type = types.find((t) => t.id === Number(form.typeId));
    if (type && usedByType(type.id) + days > type.quota)
      return setErr(`Only ${type.quota - usedByType(type.id)} ${type.name} days remaining.`);
    setBusy(true);
    try {
      await svc.add("leaves", {
        employeeId: myId, typeId: Number(form.typeId),
        from: form.from, to: form.to, days,
        reason: form.reason.trim(), status: "Pending",
        appliedOn: new Date().toISOString().slice(0, 10),
      });
      setApplying(false);
      setForm({ typeId: 1, from: "", to: "", reason: "" });
      await load();
    } finally { setBusy(false); }
  };

  const decide = async (l, status) => {
    await svc.update("leaves", l.id, { status });
    await load();
  };

  return (
    <>
      {!isAdmin && (
        <div className="stat-grid">
          {types.slice(0, 4).map((t) => (
            <Stat key={t.id} label={`${t.name} leave`} value={`${t.quota - usedByType(t.id)} / ${t.quota}`} sub="Remaining this year" />
          ))}
        </div>
      )}

      <div className="card">
        <div className="card-head">
          <h2>{isAdmin ? "All leave requests" : "My leave requests"}</h2>
          <button className="btn" onClick={() => setApplying(true)}>+ Apply for leave</button>
        </div>
        {visible.length === 0 ? (
          <div className="empty">No leave requests yet. Apply for one to get started.</div>
        ) : (
          <div className="table-wrap">
            <table className="grid">
              <thead>
                <tr>
                  {isAdmin && <th>Employee</th>}
                  <th>Type</th><th>Dates</th><th>Days</th><th>Reason</th><th>Status</th>
                  {isAdmin && <th>Action</th>}
                </tr>
              </thead>
              <tbody>
                {visible.map((l) => (
                  <tr key={l.id}>
                    {isAdmin && <td><b>{employees.find((e) => e.id === l.employeeId)?.fullName}</b></td>}
                    <td>{types.find((t) => t.id === l.typeId)?.name}</td>
                    <td>{l.from} → {l.to}</td>
                    <td>{l.days}</td>
                    <td>{l.reason}</td>
                    <td><StatusBadge status={l.status} /></td>
                    {isAdmin && (
                      <td style={{ whiteSpace: "nowrap" }}>
                        {l.status === "Pending" && (
                          <>
                            <button className="btn sm" onClick={() => decide(l, "Approved")}>Approve</button>{" "}
                            <button className="btn danger sm" onClick={() => decide(l, "Rejected")}>Reject</button>
                          </>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {applying && (
        <Modal title="Apply for leave" onClose={() => setApplying(false)}>
          {err && <div className="error-banner" role="alert"><span>⚠</span><span>{err}</span></div>}
          <div className="field">
            <label>Leave type</label>
            <select value={form.typeId} onChange={(e) => setForm({ ...form, typeId: e.target.value })}>
              {types.map((t) => <option key={t.id} value={t.id}>{t.name} ({t.quota} days/year)</option>)}
            </select>
          </div>
          <div className="form-row">
            <div className="field"><label>From</label><input type="date" value={form.from} onChange={(e) => setForm({ ...form, from: e.target.value })} /></div>
            <div className="field"><label>To</label><input type="date" value={form.to} onChange={(e) => setForm({ ...form, to: e.target.value })} /></div>
          </div>
          <div className="field"><label>Reason</label>
            <textarea rows={3} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
          </div>
          <div className="modal-actions">
            <button className="btn ghost" onClick={() => setApplying(false)}>Cancel</button>
            <button className="btn" onClick={apply} disabled={busy}>{busy ? "Submitting…" : "Submit request"}</button>
          </div>
        </Modal>
      )}
    </>
  );
}
