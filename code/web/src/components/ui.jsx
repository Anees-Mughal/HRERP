export function Modal({ title, onClose, children }) {
  return (
    <div className="modal-scrim" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true">
        <h3>{title}</h3>
        {children}
      </div>
    </div>
  );
}

export function Stat({ label, value, sub, accent }) {
  return (
    <div className={"stat" + (accent ? " accent" : "")}>
      <div className="lbl">{label}</div>
      <div className="val">{value}</div>
      {sub && <div className="sub">{sub}</div>}
    </div>
  );
}

export function StatusBadge({ status }) {
  const map = {
    Present: "ok", Approved: "ok", Active: "ok", Completed: "ok", Permanent: "ok",
    Late: "warn", Pending: "warn", "In Review": "warn", Probation: "warn",
    Absent: "bad", Rejected: "bad", Inactive: "bad",
    Contract: "info", Paid: "info",
  };
  return <span className={"badge " + (map[status] || "gray")}>{status}</span>;
}

export function Loading() {
  return (
    <div className="empty">
      <span className="spinner" /> Loading…
    </div>
  );
}
