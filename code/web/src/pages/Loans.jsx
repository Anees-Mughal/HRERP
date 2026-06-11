import { useEffect, useState } from "react";
import { svc } from "../api/service";
import { Modal, StatusBadge, Loading } from "../components/ui";
import { fmt } from "../utils/tax";

export default function Loans() {
  const [loans, setLoans] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ employeeId: "", amount: "", instalment: "", reason: "" });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const [ls, emps] = await Promise.all([svc.list("loans"), svc.list("employees")]);
    setLoans(ls); setEmployees(emps.filter((e) => e.isActive));
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    setErr("");
    const amount = Number(form.amount), instalment = Number(form.instalment);
    if (!form.employeeId) return setErr("Select an employee.");
    if (!amount || amount <= 0) return setErr("Enter a valid loan amount.");
    if (!instalment || instalment <= 0 || instalment > amount) return setErr("Instalment must be between 1 and the loan amount.");
    setBusy(true);
    try {
      await svc.add("loans", {
        employeeId: Number(form.employeeId), amount, instalment,
        remaining: amount, reason: form.reason.trim(),
        status: "Pending", date: new Date().toISOString().slice(0, 10),
      });
      setAdding(false);
      setForm({ employeeId: "", amount: "", instalment: "", reason: "" });
      await load();
    } finally { setBusy(false); }
  };

  const decide = async (l, status) => { await svc.update("loans", l.id, { status }); await load(); };

  if (!loans) return <Loading />;

  return (
    <>
      <div className="card">
        <div className="card-head">
          <h2>Loans & advances</h2>
          <button className="btn" onClick={() => setAdding(true)}>+ New loan request</button>
        </div>
        <div className="table-wrap">
          <table className="grid">
            <thead>
              <tr><th>Employee</th><th>Reason</th><th className="num">Amount</th><th className="num">Instalment/mo</th><th className="num">Remaining</th><th>Status</th><th>Action</th></tr>
            </thead>
            <tbody>
              {loans.map((l) => (
                <tr key={l.id}>
                  <td><b>{employees.find((e) => e.id === l.employeeId)?.fullName || "—"}</b></td>
                  <td>{l.reason}</td>
                  <td className="num">₨ {fmt(l.amount)}</td>
                  <td className="num">₨ {fmt(l.instalment)}</td>
                  <td className="num">₨ {fmt(l.remaining)}</td>
                  <td><StatusBadge status={l.status} /></td>
                  <td style={{ whiteSpace: "nowrap" }}>
                    {l.status === "Pending" && (
                      <>
                        <button className="btn sm" onClick={() => decide(l, "Active")}>Approve</button>{" "}
                        <button className="btn danger sm" onClick={() => decide(l, "Rejected")}>Reject</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="muted" style={{ marginTop: 10 }}>
          Active loans auto-deduct their instalment in each payroll run until the balance hits zero.
        </p>
      </div>

      {adding && (
        <Modal title="New loan / advance request" onClose={() => setAdding(false)}>
          {err && <div className="error-banner" role="alert"><span>⚠</span><span>{err}</span></div>}
          <div className="field"><label>Employee *</label>
            <select value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })}>
              <option value="">Select…</option>
              {employees.map((e) => <option key={e.id} value={e.id}>{e.fullName}</option>)}
            </select>
          </div>
          <div className="form-row">
            <div className="field"><label>Loan amount (PKR) *</label><input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></div>
            <div className="field"><label>Monthly instalment *</label><input type="number" value={form.instalment} onChange={(e) => setForm({ ...form, instalment: e.target.value })} /></div>
          </div>
          <div className="field"><label>Reason</label><input value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} /></div>
          <div className="modal-actions">
            <button className="btn ghost" onClick={() => setAdding(false)}>Cancel</button>
            <button className="btn" onClick={save} disabled={busy}>{busy ? "Saving…" : "Submit"}</button>
          </div>
        </Modal>
      )}
    </>
  );
}
