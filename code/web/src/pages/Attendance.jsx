import { useEffect, useState } from "react";
import { svc } from "../api/service";
import { Stat, StatusBadge, Loading } from "../components/ui";

const today = new Date().toISOString().slice(0, 10);

export default function Attendance() {
  const [employees, setEmployees] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [date, setDate] = useState(today);
  const [busyId, setBusyId] = useState(null);

  const load = async () => {
    const [emps, att] = await Promise.all([svc.list("employees"), svc.list("attendance")]);
    setEmployees(emps.filter((e) => e.isActive));
    setAttendance(att);
  };
  useEffect(() => { load(); }, []);

  if (!employees) return <Loading />;

  const dayRows = attendance.filter((a) => a.date === date);
  const recordFor = (empId) => dayRows.find((a) => a.employeeId === empId);

  const mark = async (emp, status) => {
    setBusyId(emp.id);
    try {
      const existing = recordFor(emp.id);
      const now = new Date().toTimeString().slice(0, 5);
      if (existing) {
        await svc.update("attendance", existing.id, {
          status,
          inTime: status === "Absent" ? "" : existing.inTime || now,
          outTime: status === "Absent" ? "" : existing.outTime,
        });
      } else {
        await svc.add("attendance", {
          employeeId: emp.id, date, status,
          inTime: status === "Absent" ? "" : now, outTime: "",
        });
      }
      await load();
    } finally { setBusyId(null); }
  };

  // Editable time in / time out — saves on change
  const setTime = async (emp, field, value) => {
    const existing = recordFor(emp.id);
    if (existing) {
      await svc.update("attendance", existing.id, { [field]: value });
    } else {
      await svc.add("attendance", {
        employeeId: emp.id, date, status: "Present",
        inTime: field === "inTime" ? value : "",
        outTime: field === "outTime" ? value : "",
      });
    }
    await load();
  };

  const counts = {
    Present: dayRows.filter((a) => a.status === "Present").length,
    Late: dayRows.filter((a) => a.status === "Late").length,
    Absent: dayRows.filter((a) => a.status === "Absent").length,
  };

  return (
    <>
      <div className="stat-grid">
        <Stat accent label="Present" value={counts.Present} />
        <Stat label="Late" value={counts.Late} />
        <Stat label="Absent" value={counts.Absent} />
        <Stat label="Unmarked" value={employees.length - dayRows.length} />
      </div>

      <div className="card">
        <div className="card-head">
          <h2>Daily attendance — in/out times editable</h2>
          <input className="search" type="date" value={date} max={today} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="table-wrap">
          <table className="grid">
            <thead>
              <tr><th>Employee</th><th>Designation</th><th>Time in</th><th>Time out</th><th>Status</th><th>Mark</th></tr>
            </thead>
            <tbody>
              {employees.map((emp) => {
                const rec = recordFor(emp.id);
                return (
                  <tr key={emp.id}>
                    <td><b>{emp.fullName}</b></td>
                    <td>{emp.designation}</td>
                    <td>
                      <input type="time" className="time-input" value={rec?.inTime || ""}
                        disabled={rec?.status === "Absent"}
                        onChange={(e) => setTime(emp, "inTime", e.target.value)} />
                    </td>
                    <td>
                      <input type="time" className="time-input" value={rec?.outTime || ""}
                        disabled={rec?.status === "Absent"}
                        onChange={(e) => setTime(emp, "outTime", e.target.value)} />
                    </td>
                    <td>{rec ? <StatusBadge status={rec.status} /> : <span className="badge gray">Unmarked</span>}</td>
                    <td style={{ whiteSpace: "nowrap" }}>
                      {["Present", "Late", "Absent"].map((s) => (
                        <button key={s} className="btn ghost sm" disabled={busyId === emp.id}
                          style={{ marginRight: 6, opacity: rec?.status === s ? 1 : 0.65, borderColor: rec?.status === s ? "var(--accent)" : undefined }}
                          onClick={() => mark(emp, s)}>
                          {s}
                        </button>
                      ))}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="muted" style={{ marginTop: 10 }}>
          Click a time to edit it directly — changes save automatically. Marking Absent clears both times.
        </p>
      </div>
    </>
  );
}
