import { useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

const ADMIN_NAV = [
  { section: "Overview" },
  { to: "/dashboard", label: "Dashboard", ico: "▦" },
  { section: "People" },
  { to: "/employees", label: "Employees", ico: "◉" },
  { to: "/departments", label: "Departments", ico: "▤" },
  { to: "/attendance", label: "Attendance", ico: "✓" },
  { to: "/leave", label: "Leave", ico: "✈" },
  { section: "Money" },
  { to: "/payroll", label: "Payroll", ico: "₨" },
  { to: "/payslips", label: "Payslips", ico: "▥" },
  { to: "/loans", label: "Loans & Advances", ico: "↺" },
  { to: "/accounts", label: "Accounts", ico: "Σ" },
  { section: "Growth" },
  { to: "/appraisals", label: "Appraisals", ico: "★" },
];

const EMP_NAV = [
  { section: "My workspace" },
  { to: "/me", label: "My dashboard", ico: "▦" },
  { to: "/payslips", label: "My payslips", ico: "▥" },
  { to: "/leave", label: "My leave", ico: "✈" },
];

const TITLES = {
  "/dashboard": "Dashboard", "/employees": "Employees", "/departments": "Departments",
  "/attendance": "Attendance", "/leave": "Leave management", "/payroll": "Payroll",
  "/payslips": "Payslips", "/loans": "Loans & advances", "/accounts": "Accounts", "/appraisals": "Appraisals",
  "/me": "My dashboard",
};

export default function Layout() {
  const { user, logout, isAdmin } = useAuth();
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const nav = user?.role === "Employee" ? EMP_NAV : ADMIN_NAV;

  return (
    <div className="shell">
      <aside className={"sidebar" + (open ? " open" : "")}>
        <div className="brand">
          <span className="brand-mark">H</span> HRstackPK
        </div>
        {nav.map((item, i) =>
          item.section ? (
            <div key={i} className="nav-section">{item.section}</div>
          ) : (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}
              onClick={() => setOpen(false)}
            >
              <i className="ico">{item.ico}</i> {item.label}
            </NavLink>
          )
        )}
        <div className="sidebar-foot">
          <div className="who">{user?.fullName}</div>
          <div className="role">{user?.role}</div>
          <button className="btn-logout" onClick={logout}>Sign out</button>
        </div>
      </aside>

      <div className={"scrim" + (open ? " show" : "")} onClick={() => setOpen(false)} />

      <div className="main">
        <header className="topbar">
          <button className="hamburger" onClick={() => setOpen(true)} aria-label="Open menu">☰</button>
          <h1>{TITLES[pathname] || "HRstackPK"}</h1>
        </header>
        <main className="page">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
