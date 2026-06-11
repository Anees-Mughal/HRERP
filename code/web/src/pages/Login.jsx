import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth, ROLE_HOME } from "../auth/AuthContext";
import "./Login.css";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSubmit = async () => {
    setError("");
    if (!identifier.trim() || !password) {
      setError("Enter your mobile number or email, and password.");
      return;
    }
    setBusy(true);
    try {
      const user = await login(identifier.trim(), password);
      const dest = location.state?.from?.pathname || ROLE_HOME[user.role] || "/dashboard";
      navigate(dest, { replace: true });
    } catch (err) {
      const status = err.response?.status;
      if (status === 401) setError(err.response?.data?.message || "Credentials are incorrect. Head: mobile number · Staff: email.");
      else if (status === 403) setError("This account is inactive. Contact your administrator.");
      else setError(err.response?.data?.message || "Couldn't sign in. Check your connection and retry.");
    } finally {
      setBusy(false);
    }
  };

  const onKeyDown = (e) => e.key === "Enter" && handleSubmit();

  return (
    <div className="login-shell">
      <aside className="ledger">
        <div className="lbrand"><span className="brand-mark">H</span>HRstackPK</div>
        <div className="ledger-body">
          <p className="ledger-eyebrow">Payroll · Attendance · Leave · Accounts</p>
          <h2 className="ledger-head">Run payday in minutes, not days.</h2>
          <div className="payslip">
            <div className="payslip-top"><span>Payslip · June 2026</span><span>PKR</span></div>
            <div className="payslip-row"><span>Basic salary</span><b>120,000</b></div>
            <div className="payslip-row"><span>Allowances (HRA + medical)</span><b>34,000</b></div>
            <div className="payslip-row minus"><span>EOBI (1%)</span><b>−370</b></div>
            <div className="payslip-row minus"><span>Income tax</span><b>−6,250</b></div>
            <div className="payslip-net"><span>Net pay</span><b>147,380</b></div>
          </div>
        </div>
        <div className="ledger-foot">
          <span><b>Head</b> · mobile number</span>
          <span><b>Staff</b> · email</span>
        </div>
      </aside>

      <main className="panel">
        <div className="form-wrap">
          <h1>Sign in</h1>
          <p className="sub">
            Head signs in with <b>mobile number</b> · staff with <b>email</b>.
            <br />
            <small className="muted">
              Demo — head: <code>0300-1234567</code> · staff: <code>emp@demo.pk</code> / <code>hr@demo.pk</code> (any password)
            </small>
          </p>

          {error && (
            <div className="error-banner" role="alert">
              <span aria-hidden>⚠</span><span>{error}</span>
            </div>
          )}

          <div className="field">
            <label htmlFor="identifier">Mobile number or email</label>
            <input id="identifier" type="text" autoComplete="username"
              placeholder="0300-1234567 or you@company.com" value={identifier}
              onChange={(e) => setIdentifier(e.target.value)} onKeyDown={onKeyDown} disabled={busy} />
          </div>

          <div className="field">
            <label htmlFor="password">Password</label>
            <div className="pw-wrap">
              <input id="password" type={showPw ? "text" : "password"}
                autoComplete="current-password" placeholder="••••••••" value={password}
                onChange={(e) => setPassword(e.target.value)} onKeyDown={onKeyDown} disabled={busy} />
              <button type="button" onClick={() => setShowPw((s) => !s)} tabIndex={-1}>
                {showPw ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <button className="submit" onClick={handleSubmit} disabled={busy}>
            {busy ? <span className="spinner" /> : "Sign in"}
          </button>
          <p className="foot-note">New company? <Link to="/signup">Create your account</Link> (web only)</p>
        </div>
      </main>
    </div>
  );
}
