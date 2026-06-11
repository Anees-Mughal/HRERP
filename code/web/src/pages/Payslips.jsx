import { useEffect, useRef, useState } from "react";
import { svc } from "../api/service";
import { useAuth } from "../auth/AuthContext";
import { Loading, StatusBadge } from "../components/ui";
import { fmt } from "../utils/tax";

export default function Payslips() {
  const { user, isAdmin } = useAuth();
  const [payslips, setPayslips] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [selected, setSelected] = useState(null);
  const docRef = useRef(null);

  useEffect(() => {
    (async () => {
      const [ps, emps] = await Promise.all([svc.list("payslips"), svc.list("employees")]);
      const visible = isAdmin ? ps : ps.filter((p) => p.employeeId === (user.employeeId || 1));
      // newest first
      visible.sort((a, b) => (b.generatedOn || "").localeCompare(a.generatedOn || ""));
      setPayslips(visible);
      setEmployees(emps);
      setSelected(visible[0] || null);
    })();
  }, []);

  if (!payslips) return <Loading />;

  const empOf = (p) => employees.find((e) => e.id === p?.employeeId);

  // Export: downloads the payslip as a standalone HTML file (opens/prints anywhere)
  const exportSlip = () => {
    if (!selected || !docRef.current) return;
    const emp = empOf(selected);
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
<title>Payslip ${emp?.fullName} ${selected.month}</title>
<style>body{font-family:Arial,sans-serif;max-width:640px;margin:30px auto;color:#0f1420}
table{width:100%;border-collapse:collapse;font-size:14px}td{padding:7px 4px}
.total td{border-top:1.5px dashed #ccc;font-weight:700;padding-top:12px}
.ph{display:flex;justify-content:space-between;border-bottom:2px solid #0f1420;padding-bottom:14px;margin-bottom:18px}
.net{margin-top:16px;background:#e0f7f2;border-radius:10px;padding:14px 18px;display:flex;justify-content:space-between}
.net b{font-size:22px;color:#009e88}.muted{color:#888;font-size:12px}.neg{color:#e5484d}</style></head>
<body>${docRef.current.innerHTML}</body></html>`;
    const blob = new Blob([html], { type: "text/html" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `payslip-${emp?.fullName?.replace(/\s+/g, "-")}-${selected.month.replace(/\s+/g, "-")}.html`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <>
      <div className="card no-print">
        <div className="card-head">
          <h2>{isAdmin ? "All generated payslips" : "My payslips (current + previous)"}</h2>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn ghost" onClick={() => window.print()} disabled={!selected}>Print / Save PDF</button>
            <button className="btn" onClick={exportSlip} disabled={!selected}>⬇ Export</button>
          </div>
        </div>
        {payslips.length === 0 ? (
          <div className="empty">No payslips generated yet. Run payroll first.</div>
        ) : (
          <div className="table-wrap">
            <table className="grid">
              <thead><tr><th>Employee</th><th>Month</th><th className="num">Net pay</th><th>Generated on</th><th></th></tr></thead>
              <tbody>
                {payslips.map((p) => (
                  <tr key={p.id} style={{ background: selected?.id === p.id ? "var(--accent-soft)" : undefined }}>
                    <td><b>{empOf(p)?.fullName}</b></td>
                    <td>{p.month}</td>
                    <td className="num">₨ {fmt(p.net)}</td>
                    <td>{p.generatedOn} <StatusBadge status="Paid" /></td>
                    <td><button className="btn ghost sm" onClick={() => setSelected(p)}>View</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selected && (
        <div className="payslip-doc" ref={docRef}>
          <div className="ph">
            <div>
              <h2 style={{ fontSize: 18 }}>HRstackPK</h2>
              <div className="muted">Salary slip · {selected.month}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <b>{empOf(selected)?.fullName}</b>
              <div className="muted">{empOf(selected)?.designation}</div>
              <div className="muted">CNIC: {empOf(selected)?.cnic}</div>
            </div>
          </div>
          <table>
            <tbody>
              <tr><td>Basic salary</td><td className="num">₨ {fmt(selected.basic)}</td></tr>
              <tr><td>House rent allowance</td><td className="num">₨ {fmt(selected.hra)}</td></tr>
              <tr><td>Medical allowance</td><td className="num">₨ {fmt(selected.medical)}</td></tr>
              <tr><td>Conveyance allowance</td><td className="num">₨ {fmt(selected.conveyance)}</td></tr>
              <tr className="total"><td>Gross salary</td><td className="num">₨ {fmt(selected.gross)}</td></tr>
              <tr><td className="neg" style={{ color: "var(--danger)" }}>Income tax (FBR)</td><td className="num neg" style={{ color: "var(--danger)" }}>− ₨ {fmt(selected.tax)}</td></tr>
              <tr><td className="neg" style={{ color: "var(--danger)" }}>EOBI contribution</td><td className="num neg" style={{ color: "var(--danger)" }}>− ₨ {fmt(selected.eobi)}</td></tr>
              {selected.loan > 0 && <tr><td className="neg" style={{ color: "var(--danger)" }}>Loan instalment</td><td className="num neg" style={{ color: "var(--danger)" }}>− ₨ {fmt(selected.loan)}</td></tr>}
              {selected.lateDeduction > 0 && <tr><td className="neg" style={{ color: "var(--danger)" }}>Late deduction</td><td className="num neg" style={{ color: "var(--danger)" }}>− ₨ {fmt(selected.lateDeduction)}</td></tr>}
              <tr className="total"><td>Total deductions</td><td className="num">− ₨ {fmt(selected.totalDeductions)}</td></tr>
            </tbody>
          </table>
          <div className="net">
            <span>Net pay</span>
            <b>₨ {fmt(selected.net)}</b>
          </div>
          <p className="muted" style={{ marginTop: 16 }}>
            System-generated payslip · {db_note()}
          </p>
        </div>
      )}
    </>
  );
}

function db_note() {
  return "Generated " + new Date().toLocaleDateString("en-PK");
}
