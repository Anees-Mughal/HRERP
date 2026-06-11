import { useEffect, useMemo, useState } from "react";
import { svc } from "../api/service";
import { Modal, StatusBadge, Loading } from "../components/ui";
import { fmt } from "../utils/tax";

const EMPTY = {
  fullName: "", cnic: "", departmentId: "", designation: "",
  employmentType: "Permanent", joiningDate: "", basicSalary: "",
  conveyance: "", bloodGroup: "", phone: "", email: "", isActive: true,
};

const CNIC_RE = /^\d{5}-\d{7}-\d$/;

export default function Employees() {
  const [employees, setEmployees] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [q, setQ] = useState("");
  const [deptFilter, setDeptFilter] = useState("");
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const [emps, depts] = await Promise.all([svc.list("employees"), svc.list("departments")]);
    setEmployees(emps);
    setDepartments(depts);
  };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    if (!employees) return [];
    return employees.filter((e) => {
      const matchQ = !q || e.fullName.toLowerCase().includes(q.toLowerCase()) ||
        e.designation?.toLowerCase().includes(q.toLowerCase()) || e.cnic?.includes(q);
      const matchD = !deptFilter || e.departmentId === Number(deptFilter);
      return matchQ && matchD;
    });
  }, [employees, q, deptFilter]);

  const openAdd = () => { setForm(EMPTY); setEditing("new"); setErr(""); };
  const openEdit = (e) => { setForm({ ...e }); setEditing(e.id); setErr(""); };

  const save = async () => {
    if (!form.fullName.trim()) return setErr("Employee name is required.");
    if (form.cnic && !CNIC_RE.test(form.cnic)) return setErr("CNIC must be in 00000-0000000-0 format.");
    if (!form.basicSalary || Number(form.basicSalary) <= 0) return setErr("Enter a valid basic salary.");
    setBusy(true);
    try {
      const payload = {
        ...form,
        departmentId: Number(form.departmentId) || null,
        basicSalary: Number(form.basicSalary),
        conveyance: Number(form.conveyance) || 0,
      };
      if (editing === "new") await svc.add("employees", payload);
      else await svc.update("employees", editing, payload);
      setEditing(null);
      await load();
    } finally { setBusy(false); }
  };

  const deactivate = async (e) => {
    if (!confirm(`Mark ${e.fullName} as inactive?`)) return;
    await svc.update("employees", e.id, { isActive: false });
    await load();
  };

  if (!employees) return <Loading />;

  const set = (k) => (ev) => setForm({ ...form, [k]: ev.target.value });

  return (
    <>
      <div className="card">
        <div className="card-head">
          <h2>All employees ({filtered.length})</h2>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <input className="search" placeholder="Search name, CNIC, designation…" value={q} onChange={(e) => setQ(e.target.value)} />
            <select className="search" value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}>
              <option value="">All departments</option>
              {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
            <button className="btn" onClick={openAdd}>+ Add employee</button>
          </div>
        </div>

        <div className="table-wrap">
          <table className="grid">
            <thead>
              <tr>
                <th>Name</th><th>CNIC</th><th>Department</th><th>Designation</th>
                <th>Type</th><th className="num">Basic salary</th><th>Status</th><th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((e) => (
                <tr key={e.id}>
                  <td><b>{e.fullName}</b><div className="muted">{e.email}</div></td>
                  <td>{e.cnic}</td>
                  <td>{departments.find((d) => d.id === e.departmentId)?.name || "—"}</td>
                  <td>{e.designation}</td>
                  <td><StatusBadge status={e.employmentType} /></td>
                  <td className="num">₨ {fmt(e.basicSalary)}</td>
                  <td><StatusBadge status={e.isActive ? "Active" : "Inactive"} /></td>
                  <td style={{ whiteSpace: "nowrap" }}>
                    <button className="btn ghost sm" onClick={() => openEdit(e)}>Edit</button>{" "}
                    {e.isActive && <button className="btn danger sm" onClick={() => deactivate(e)}>Deactivate</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && <div className="empty">No employees match this search.</div>}
      </div>

      {editing && (
        <Modal title={editing === "new" ? "Add employee" : "Edit employee"} onClose={() => setEditing(null)}>
          {err && <div className="error-banner" role="alert"><span>⚠</span><span>{err}</span></div>}
          <div className="form-row">
            <div className="field"><label>Full name *</label><input value={form.fullName} onChange={set("fullName")} /></div>
            <div className="field"><label>CNIC</label><input placeholder="35202-1234567-1" value={form.cnic} onChange={set("cnic")} /></div>
          </div>
          <div className="form-row">
            <div className="field">
              <label>Department</label>
              <select value={form.departmentId} onChange={set("departmentId")}>
                <option value="">Select…</option>
                {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div className="field"><label>Designation</label><input value={form.designation} onChange={set("designation")} /></div>
          </div>
          <div className="form-row">
            <div className="field">
              <label>Employment type</label>
              <select value={form.employmentType} onChange={set("employmentType")}>
                <option>Permanent</option><option>Contract</option><option>Probation</option>
              </select>
            </div>
            <div className="field"><label>Joining date</label><input type="date" value={form.joiningDate} onChange={set("joiningDate")} /></div>
          </div>
          <div className="form-row">
            <div className="field"><label>Basic salary (PKR) *</label><input type="number" value={form.basicSalary} onChange={set("basicSalary")} /></div>
            <div className="field"><label>Conveyance allowance</label><input type="number" value={form.conveyance} onChange={set("conveyance")} /></div>
          </div>
          <div className="form-row">
            <div className="field">
              <label>Blood group</label>
              <select value={form.bloodGroup} onChange={set("bloodGroup")}>
                <option value="">—</option>
                {["A+","A-","B+","B-","AB+","AB-","O+","O-"].map((b) => <option key={b}>{b}</option>)}
              </select>
            </div>
            <div className="field"><label>Phone</label><input value={form.phone} onChange={set("phone")} /></div>
          </div>
          <div className="field"><label>Email</label><input type="email" value={form.email} onChange={set("email")} /></div>
          <div className="modal-actions">
            <button className="btn ghost" onClick={() => setEditing(null)}>Cancel</button>
            <button className="btn" onClick={save} disabled={busy}>{busy ? "Saving…" : "Save employee"}</button>
          </div>
        </Modal>
      )}
    </>
  );
}
