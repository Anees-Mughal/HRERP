import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { svc } from "../api/service";
import { useAuth } from "../auth/AuthContext";
import { Stat, StatusBadge, Loading } from "../components/ui";
import { calcPayroll, fmt } from "../utils/tax";

export default function EmployeeHome() {
  const { user } = useAuth();
  const [me, setMe] = useState(null);
  const [leaves, setLeaves] = useState([]);
  const [attendance, setAttendance] = useState([]);

  useEffect(() => {
    (async () => {
      const [emps, ls, att] = await Promise.all([
        svc.list("employees"), svc.list("leaves"), svc.list("attendance"),
      ]);
      const myId = user.employeeId || 1;
      setMe(emps.find((e) => e.id === myId) || emps[0]);
      setLeaves(ls.filter((l) => l.employeeId === myId));
      setAttendance(att.filter((a) => a.employeeId === myId));
    })();
  }, []);

  if (!me) return <Loading />;
  const p = calcPayroll(me);
  const todayRec = attendance.find((a) => a.date === new Date().toISOString().slice(0, 10));

  return (
    <>
      <div className="stat-grid">
        <Stat accent label="This month's net pay" value={`₨ ${fmt(p.net)}`} sub="Estimated" />
        <Stat label="Today's attendance" value={todayRec?.status || "Unmarked"} sub={todayRec?.inTime ? `In at ${todayRec.inTime}` : ""} />
        <Stat label="Leave requests" value={leaves.length} sub={`${leaves.filter((l) => l.status === "Pending").length} pending`} />
        <Stat label="Designation" value={me.designation} sub={me.employmentType} />
      </div>

      <div className="card">
        <div className="card-head">
          <h2>My recent leave</h2>
          <Link to="/leave" className="btn ghost sm">Apply for leave</Link>
        </div>
        {leaves.length === 0 ? <div className="empty">No leave history.</div> : (
          <div className="table-wrap">
            <table className="grid">
              <thead><tr><th>Dates</th><th>Days</th><th>Reason</th><th>Status</th></tr></thead>
              <tbody>
                {leaves.map((l) => (
                  <tr key={l.id}>
                    <td>{l.from} → {l.to}</td><td>{l.days}</td><td>{l.reason}</td>
                    <td><StatusBadge status={l.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card">
        <div className="card-head">
          <h2>My latest payslip</h2>
          <Link to="/payslips" className="btn ghost sm">View full payslip</Link>
        </div>
        <div className="table-wrap">
          <table className="grid">
            <tbody>
              <tr><td>Gross salary</td><td className="num">₨ {fmt(p.gross)}</td></tr>
              <tr><td>Total deductions</td><td className="num" style={{ color: "var(--danger)" }}>− ₨ {fmt(p.totalDeductions)}</td></tr>
              <tr><td><b>Net pay</b></td><td className="num"><b style={{ color: "var(--accent-deep)" }}>₨ {fmt(p.net)}</b></td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
