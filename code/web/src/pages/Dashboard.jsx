import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { svc } from "../api/service";
import { Stat, StatusBadge, Loading } from "../components/ui";
import { calcPayroll, fmt } from "../utils/tax";

export default function Dashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    (async () => {
      const [employees, attendance, leaves, loans] = await Promise.all([
        svc.list("employees"), svc.list("attendance"),
        svc.list("leaves"), svc.list("loans"),
      ]);
      setData({ employees, attendance, leaves, loans });
    })();
  }, []);

  if (!data) return <Loading />;
  const { employees, attendance, leaves, loans } = data;

  const present = attendance.filter((a) => a.status === "Present").length;
  const late = attendance.filter((a) => a.status === "Late").length;
  const absent = attendance.filter((a) => a.status === "Absent").length;
  const pendingLeaves = leaves.filter((l) => l.status === "Pending");
  const monthlyPayroll = employees.reduce((s, e) => s + calcPayroll(e).net, 0);

  return (
    <>
      <div className="stat-grid">
        <Stat accent label="Total employees" value={employees.length} sub={`${employees.filter((e) => e.isActive).length} active`} />
        <Stat label="Present today" value={present} sub={`${late} late · ${absent} absent`} />
        <Stat label="Pending leave requests" value={pendingLeaves.length} sub="Awaiting approval" />
        <Stat label="Monthly payroll (net)" value={`₨ ${fmt(monthlyPayroll)}`} sub="Estimated this month" />
      </div>

      <div className="card">
        <div className="card-head">
          <h2>Leave requests waiting on you</h2>
          <Link to="/leave" className="btn ghost sm">Open leave module</Link>
        </div>
        {pendingLeaves.length === 0 ? (
          <div className="empty">All caught up — no pending requests.</div>
        ) : (
          <div className="table-wrap">
            <table className="grid">
              <thead>
                <tr><th>Employee</th><th>Dates</th><th>Days</th><th>Reason</th><th>Status</th></tr>
              </thead>
              <tbody>
                {pendingLeaves.map((l) => {
                  const emp = employees.find((e) => e.id === l.employeeId);
                  return (
                    <tr key={l.id}>
                      <td>{emp?.fullName}</td>
                      <td>{l.from} → {l.to}</td>
                      <td>{l.days}</td>
                      <td>{l.reason}</td>
                      <td><StatusBadge status={l.status} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card">
        <div className="card-head">
          <h2>Active loans</h2>
          <Link to="/loans" className="btn ghost sm">Manage loans</Link>
        </div>
        <div className="table-wrap">
          <table className="grid">
            <thead>
              <tr><th>Employee</th><th className="num">Amount</th><th className="num">Instalment</th><th className="num">Remaining</th><th>Status</th></tr>
            </thead>
            <tbody>
              {loans.map((l) => {
                const emp = employees.find((e) => e.id === l.employeeId);
                return (
                  <tr key={l.id}>
                    <td>{emp?.fullName}</td>
                    <td className="num">₨ {fmt(l.amount)}</td>
                    <td className="num">₨ {fmt(l.instalment)}</td>
                    <td className="num">₨ {fmt(l.remaining)}</td>
                    <td><StatusBadge status={l.status} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
