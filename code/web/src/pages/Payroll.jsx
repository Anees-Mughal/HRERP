import { useEffect, useMemo, useState } from "react";
import { svc } from "../api/service";
import { Stat, Loading, Modal } from "../components/ui";
import { calcPayroll, fmt, EOBI } from "../utils/tax";

const MONTH = new Date().toLocaleString("en-PK", { month: "long", year: "numeric" });
const FIELDS = [
  ["basic", "Basic salary"], ["hra", "House rent allowance"], ["medical", "Medical allowance"],
  ["conveyance", "Conveyance"], ["tax", "Income tax"], ["eobi", "EOBI"],
  ["loan", "Loan instalment"], ["lateDeduction", "Late deduction"],
];

export default function Payroll() {
  const [employees, setEmployees] = useState(null);
  const [loans, setLoans] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [overrides, setOverrides] = useState({});
  const [editing, setEditing] = useState(null); // employee being edited
  const [form, setForm] = useState({});
  const [ran, setRan] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const [emps, lns, att, ov] = await Promise.all([
      svc.list("employees"), svc.list("loans"), svc.list("attendance"), svc.getOverrides(),
    ]);
    setEmployees(emps.filter((e) => e.isActive));
    setLoans(lns); setAttendance(att); setOverrides(ov);
  };
  useEffect(() => { load(); }, []);

  // Computed values, then per-field overrides applied on top
  const rows = useMemo(() => {
    if (!employees) return [];
    return employees.map((e) => {
      const activeLoan = loans.find((l) => l.employeeId === e.id && l.status === "Active");
      const lateMarks = attendance.filter((a) => a.employeeId === e.id && a.status === "Late").length;
      const auto = calcPayroll(e, { loanInstalment: activeLoan?.instalment || 0, lateMarks });
      const ov = overrides[e.id] || {};
      const v = { ...auto, ...ov };
      v.gross = v.basic + v.hra + v.medical + v.conveyance;
      v.totalDeductions = v.tax + v.eobi + v.loan + v.lateDeduction;
      v.net = v.gross - v.totalDeductions;
      return { emp: e, v, edited: !!overrides[e.id] };
    });
  }, [employees, loans, attendance, overrides]);

  const totals = rows.reduce(
    (t, { v }) => ({ gross: t.gross + v.gross, tax: t.tax + v.tax, eobi: t.eobi + v.eobi, net: t.net + v.net }),
    { gross: 0, tax: 0, eobi: 0, net: 0 }
  );

  const openEdit = ({ emp, v }) => {
    setForm(Object.fromEntries(FIELDS.map(([k]) => [k, v[k]])));
    setEditing(emp);
  };

  const saveEdit = async () => {
    setBusy(true);
    try {
      const values = Object.fromEntries(FIELDS.map(([k]) => [k, Number(form[k]) || 0]));
      await svc.setOverride(editing.id, values);
      setEditing(null);
      await load();
    } finally { setBusy(false); }
  };

  const resetEdit = async () => {
    setBusy(true);
    try {
      await svc.setOverride(editing.id, null);
      setEditing(null);
      await load();
    } finally { setBusy(false); }
  };

  const runPayroll = async () => {
    setBusy(true);
    try {
      await svc.generatePayslips(rows.map(({ emp, v }) => ({ employeeId: emp.id, ...v })));
      for (const l of loans.filter((l) => l.status === "Active")) {
        const remaining = Math.max(0, l.remaining - l.instalment);
        await svc.update("loans", l.id, { remaining, status: remaining === 0 ? "Completed" : "Active" });
      }
      setRan(true);
    } finally { setBusy(false); }
  };

  if (!employees) return <Loading />;

  return (
    <>
      <div className="stat-grid">
        <Stat accent label={`Payroll — ${MONTH}`} value={`₨ ${fmt(totals.net)}`} sub="Total net payable" />
        <Stat label="Gross salaries" value={`₨ ${fmt(totals.gross)}`} />
        <Stat label="Income tax (FBR)" value={`₨ ${fmt(totals.tax)}`} sub="Withheld this month" />
        <Stat label="EOBI" value={`₨ ${fmt(totals.eobi)}`} sub={`+ ₨ ${fmt(EOBI.employer * rows.length)} employer share`} />
      </div>

      <div className="card">
        <div className="card-head">
          <h2>Salary sheet — {MONTH} (every value editable)</h2>
          <button className="btn" onClick={runPayroll} disabled={busy || ran}>
            {ran ? "✓ Payslips generated" : busy ? "Running…" : "Run payroll & generate payslips"}
          </button>
        </div>
        <div className="table-wrap">
          <table className="grid">
            <thead>
              <tr>
                <th>Employee</th>
                <th className="num">Basic</th><th className="num">HRA</th><th className="num">Medical</th>
                <th className="num">Gross</th><th className="num">Tax</th><th className="num">EOBI</th>
                <th className="num">Loan</th><th className="num">Late</th><th className="num">Net pay</th><th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const { emp, v, edited } = row;
                return (
                  <tr key={emp.id}>
                    <td>
                      <b>{emp.fullName}</b>
                      <div className="muted">{emp.designation}{edited && " · edited"}</div>
                    </td>
                    <td className="num">{fmt(v.basic)}</td>
                    <td className="num">{fmt(v.hra)}</td>
                    <td className="num">{fmt(v.medical)}</td>
                    <td className="num"><b>{fmt(v.gross)}</b></td>
                    <td className="num" style={{ color: "var(--danger)" }}>−{fmt(v.tax)}</td>
                    <td className="num" style={{ color: "var(--danger)" }}>−{fmt(v.eobi)}</td>
                    <td className="num" style={{ color: "var(--danger)" }}>{v.loan ? "−" + fmt(v.loan) : "—"}</td>
                    <td className="num" style={{ color: "var(--danger)" }}>{v.lateDeduction ? "−" + fmt(v.lateDeduction) : "—"}</td>
                    <td className="num"><b style={{ color: "var(--accent-deep)" }}>₨ {fmt(v.net)}</b></td>
                    <td><button className="btn ghost sm" onClick={() => openEdit(row)}>Edit</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="muted" style={{ marginTop: 12 }}>
          Auto-calculated: HRA 40% · Medical 10% · FBR FY2025-26 slabs · EOBI ₨{EOBI.employee}/₨{EOBI.employer} ·
          3 late marks = 1 day's basic. Edit any employee to override any value — overrides persist until reset.
        </p>
      </div>

      {editing && (
        <Modal title={`Edit payroll — ${editing.fullName}`} onClose={() => setEditing(null)}>
          <div className="form-row">
            {FIELDS.map(([k, label]) => (
              <div className="field" key={k}>
                <label>{label} (PKR)</label>
                <input type="number" value={form[k]}
                  onChange={(e) => setForm({ ...form, [k]: e.target.value })} />
              </div>
            ))}
          </div>
          <p className="muted">
            Net pay recalculates automatically: (basic + HRA + medical + conveyance) − (tax + EOBI + loan + late).
          </p>
          <div className="modal-actions">
            <button className="btn ghost" onClick={resetEdit} disabled={busy}>Reset to auto</button>
            <button className="btn ghost" onClick={() => setEditing(null)}>Cancel</button>
            <button className="btn" onClick={saveEdit} disabled={busy}>{busy ? "Saving…" : "Save values"}</button>
          </div>
        </Modal>
      )}
    </>
  );
}
