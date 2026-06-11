import { useEffect, useMemo, useState } from "react";
import { svc } from "../api/service";
import { Modal, Loading, Stat } from "../components/ui";
import { fmt } from "../utils/tax";

const monthOf = (d) => (d || "").slice(0, 7); // YYYY-MM
const MONTH_LABEL = (ym) => {
  if (!ym) return "All months";
  const [y, m] = ym.split("-");
  return new Date(y, m - 1).toLocaleString("en-PK", { month: "long", year: "numeric" });
};

export default function Accounts() {
  const [tab, setTab] = useState("transactions"); // transactions | reports
  const [report, setReport] = useState("pl"); // expenses | revenue | pl
  const [month, setMonth] = useState("");
  const [data, setData] = useState(null);
  const [adding, setAdding] = useState(null); // 'expense' | 'revenue'
  const [form, setForm] = useState({});
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const [expenses, revenues, payslips, employees] = await Promise.all([
      svc.list("expenses"), svc.list("revenues"), svc.list("payslips"), svc.list("employees"),
    ]);
    setData({ expenses, revenues, payslips, employees });
  };
  useEffect(() => { load(); }, []);

  // Salary expenses come ONLY from generated payslips
  const salaryExpenses = useMemo(() => {
    if (!data) return [];
    return data.payslips.map((p) => ({
      id: "ps-" + p.id,
      date: p.generatedOn,
      category: "Salaries",
      description: `Salary — ${data.employees.find((e) => e.id === p.employeeId)?.fullName} (${p.month})`,
      amount: p.net,
      salary: true,
    }));
  }, [data]);

  if (!data) return <Loading />;

  const inMonth = (rows) => (month ? rows.filter((r) => monthOf(r.date) === month) : rows);

  const allExpenses = inMonth([...salaryExpenses, ...data.expenses]).sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  const allRevenues = inMonth(data.revenues).sort((a, b) => (b.date || "").localeCompare(a.date || ""));

  const totalExp = allExpenses.reduce((s, e) => s + e.amount, 0);
  const totalRev = allRevenues.reduce((s, r) => s + r.amount, 0);
  const profit = totalRev - totalExp;

  const save = async () => {
    setErr("");
    if (!form.date) return setErr("Pick a date.");
    if (!form.amount || Number(form.amount) <= 0) return setErr("Enter a valid amount.");
    setBusy(true);
    try {
      if (adding === "expense") {
        await svc.add("expenses", {
          date: form.date, category: form.category || "General",
          description: form.description || "", amount: Number(form.amount),
        });
      } else {
        await svc.add("revenues", {
          date: form.date, source: form.source || "Other",
          description: form.description || "", amount: Number(form.amount),
        });
      }
      setAdding(null); setForm({});
      await load();
    } finally { setBusy(false); }
  };

  return (
    <>
      <div className="stat-grid">
        <Stat label={`Revenue · ${MONTH_LABEL(month)}`} value={`₨ ${fmt(totalRev)}`} accent />
        <Stat label="Expenses (incl. salaries)" value={`₨ ${fmt(totalExp)}`} />
        <Stat label={profit >= 0 ? "Profit" : "Loss"} value={`₨ ${fmt(Math.abs(profit))}`}
          sub={profit >= 0 ? "Revenue exceeds expenses" : "Expenses exceed revenue"} />
        <Stat label="Generated payslips" value={data.payslips.length} sub="Feed salary expenses" />
      </div>

      <div className="tabs">
        <button className={"tab-btn" + (tab === "transactions" ? " on" : "")} onClick={() => setTab("transactions")}>Transactions</button>
        <button className={"tab-btn" + (tab === "reports" ? " on" : "")} onClick={() => setTab("reports")}>Reports</button>
        <input className="search" type="month" value={month} onChange={(e) => setMonth(e.target.value)} style={{ marginLeft: "auto" }} />
      </div>

      {tab === "transactions" && (
        <>
          <div className="card">
            <div className="card-head">
              <h2>Expenses — {MONTH_LABEL(month)}</h2>
              <button className="btn" onClick={() => { setForm({ date: new Date().toISOString().slice(0, 10) }); setAdding("expense"); }}>+ Add expense</button>
            </div>
            <div className="table-wrap">
              <table className="grid">
                <thead><tr><th>Date</th><th>Category</th><th>Description</th><th className="num">Amount</th></tr></thead>
                <tbody>
                  {allExpenses.map((e) => (
                    <tr key={e.id}>
                      <td>{e.date}</td>
                      <td>{e.salary ? <span className="badge info">Salaries</span> : <span className="badge gray">{e.category}</span>}</td>
                      <td>{e.description}</td>
                      <td className="num" style={{ color: "var(--danger)" }}>− ₨ {fmt(e.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {allExpenses.length === 0 && <div className="empty">No expenses in this period.</div>}
            <p className="muted" style={{ marginTop: 10 }}>
              Salary rows appear automatically — only for employees whose payslip has been generated.
            </p>
          </div>

          <div className="card">
            <div className="card-head">
              <h2>Revenue — {MONTH_LABEL(month)}</h2>
              <button className="btn" onClick={() => { setForm({ date: new Date().toISOString().slice(0, 10) }); setAdding("revenue"); }}>+ Add revenue</button>
            </div>
            <div className="table-wrap">
              <table className="grid">
                <thead><tr><th>Date</th><th>Source</th><th>Description</th><th className="num">Amount</th></tr></thead>
                <tbody>
                  {allRevenues.map((r) => (
                    <tr key={r.id}>
                      <td>{r.date}</td>
                      <td><span className="badge ok">{r.source}</span></td>
                      <td>{r.description}</td>
                      <td className="num" style={{ color: "var(--accent-deep)" }}>+ ₨ {fmt(r.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {allRevenues.length === 0 && <div className="empty">No revenue entries in this period.</div>}
          </div>
        </>
      )}

      {tab === "reports" && (
        <div className="card">
          <div className="card-head">
            <h2>Reports — {MONTH_LABEL(month)}</h2>
            <div className="tabs" style={{ marginBottom: 0 }}>
              <button className={"tab-btn" + (report === "expenses" ? " on" : "")} onClick={() => setReport("expenses")}>Expenses report</button>
              <button className={"tab-btn" + (report === "revenue" ? " on" : "")} onClick={() => setReport("revenue")}>Revenue report</button>
              <button className={"tab-btn" + (report === "pl" ? " on" : "")} onClick={() => setReport("pl")}>Profit & loss</button>
            </div>
          </div>

          {report === "expenses" && (
            <ReportTable
              rows={groupBy(allExpenses, (e) => (e.salary ? "Salaries (generated payslips)" : e.category))}
              total={totalExp} negative label="Expense head"
            />
          )}
          {report === "revenue" && (
            <ReportTable rows={groupBy(allRevenues, (r) => r.source)} total={totalRev} label="Revenue source" />
          )}
          {report === "pl" && (
            <div className="table-wrap">
              <table className="grid">
                <tbody>
                  <tr><td><b>Total revenue</b></td><td className="num" style={{ color: "var(--accent-deep)" }}>+ ₨ {fmt(totalRev)}</td></tr>
                  <tr><td><b>Total expenses</b> (salaries + other)</td><td className="num" style={{ color: "var(--danger)" }}>− ₨ {fmt(totalExp)}</td></tr>
                  <tr>
                    <td><b style={{ fontSize: 16 }}>{profit >= 0 ? "Net profit" : "Net loss"}</b></td>
                    <td className="num">
                      <b style={{ fontSize: 16, color: profit >= 0 ? "var(--accent-deep)" : "var(--danger)" }}>
                        ₨ {fmt(Math.abs(profit))}
                      </b>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {adding && (
        <Modal title={adding === "expense" ? "Add expense" : "Add revenue"} onClose={() => setAdding(null)}>
          {err && <div className="error-banner" role="alert"><span>⚠</span><span>{err}</span></div>}
          <div className="form-row">
            <div className="field"><label>Date *</label>
              <input type="date" value={form.date || ""} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </div>
            <div className="field">
              <label>{adding === "expense" ? "Category" : "Source"}</label>
              <input placeholder={adding === "expense" ? "Utilities, Rent, Supplies…" : "Fees, Admissions, Other…"}
                value={(adding === "expense" ? form.category : form.source) || ""}
                onChange={(e) => setForm({ ...form, [adding === "expense" ? "category" : "source"]: e.target.value })} />
            </div>
          </div>
          <div className="field"><label>Description</label>
            <input value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="field"><label>Amount (PKR) *</label>
            <input type="number" value={form.amount || ""} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
          </div>
          <div className="modal-actions">
            <button className="btn ghost" onClick={() => setAdding(null)}>Cancel</button>
            <button className="btn" onClick={save} disabled={busy}>{busy ? "Saving…" : "Save"}</button>
          </div>
        </Modal>
      )}
    </>
  );
}

function groupBy(rows, keyFn) {
  const map = {};
  for (const r of rows) {
    const k = keyFn(r) || "Other";
    map[k] = (map[k] || 0) + r.amount;
  }
  return Object.entries(map).sort((a, b) => b[1] - a[1]);
}

function ReportTable({ rows, total, label, negative }) {
  return (
    <div className="table-wrap">
      <table className="grid">
        <thead><tr><th>{label}</th><th className="num">Amount</th><th className="num">Share</th></tr></thead>
        <tbody>
          {rows.map(([k, amt]) => (
            <tr key={k}>
              <td>{k}</td>
              <td className="num" style={{ color: negative ? "var(--danger)" : "var(--accent-deep)" }}>
                {negative ? "− " : "+ "}₨ {fmt(amt)}
              </td>
              <td className="num">{total ? Math.round((amt / total) * 100) : 0}%</td>
            </tr>
          ))}
          <tr>
            <td><b>Total</b></td>
            <td className="num"><b>{negative ? "− " : "+ "}₨ {fmt(total)}</b></td>
            <td className="num"><b>100%</b></td>
          </tr>
        </tbody>
      </table>
      {rows.length === 0 && <div className="empty">Nothing recorded in this period.</div>}
    </div>
  );
}
