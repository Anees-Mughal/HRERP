import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { svc } from "../api/service";
import { tokenStore } from "../api/client";
import "./Login.css";

const PHONE_RE = /^03\d{2}-?\d{7}$/;

export default function Signup() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ companyName: "", ownerName: "", phone: "", email: "", password: "", confirm: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async () => {
    setError("");
    if (!form.companyName.trim()) return setError("Enter your company / school name.");
    if (!form.ownerName.trim()) return setError("Enter the owner's name.");
    if (!PHONE_RE.test(form.phone)) return setError("Mobile number must be like 0300-1234567 — the head signs in with this.");
    if (!form.email.includes("@")) return setError("Enter a valid email.");
    if (form.password.length < 6) return setError("Password must be at least 6 characters.");
    if (form.password !== form.confirm) return setError("Passwords don't match.");
    setBusy(true);
    try {
      const data = await svc.signup(form);
      tokenStore.set(data);
      window.location.assign("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't create the account. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="login-shell">
      <aside className="ledger">
        <div className="lbrand"><span className="brand-mark">H</span>HRstackPK</div>
        <div className="ledger-body">
          <p className="ledger-eyebrow">Create your company</p>
          <h2 className="ledger-head">Set up HR for your team today.</h2>
          <div className="payslip">
            <div className="payslip-row"><span>1 · Create your account</span><b>now</b></div>
            <div className="payslip-row"><span>2 · Add departments &amp; staff</span><b>5 min</b></div>
            <div className="payslip-row"><span>3 · Mark attendance</span><b>daily</b></div>
            <div className="payslip-net"><span>4 · Run payroll</span><b>1 click</b></div>
          </div>
        </div>
        <div className="ledger-foot">
          <span><b>Head</b> signs in with mobile number</span>
          <span><b>Staff</b> sign in with email</span>
        </div>
      </aside>

      <main className="panel">
        <div className="form-wrap">
          <h1>Create account</h1>
          <p className="sub">Sign up your company — web only. Staff use the mobile app to sign in.</p>

          {error && <div className="error-banner" role="alert"><span aria-hidden>⚠</span><span>{error}</span></div>}

          <div className="field"><label>Company / school name</label>
            <input value={form.companyName} onChange={set("companyName")} placeholder="The Educators — Canal Campus" disabled={busy} /></div>
          <div className="field"><label>Owner / head name</label>
            <input value={form.ownerName} onChange={set("ownerName")} placeholder="Muhammad Ali" disabled={busy} /></div>
          <div className="field"><label>Head mobile number (used to sign in)</label>
            <input value={form.phone} onChange={set("phone")} placeholder="0300-1234567" disabled={busy} /></div>
          <div className="field"><label>Email</label>
            <input type="email" value={form.email} onChange={set("email")} placeholder="owner@school.pk" disabled={busy} /></div>
          <div className="field"><label>Password</label>
            <input type="password" value={form.password} onChange={set("password")} disabled={busy} /></div>
          <div className="field"><label>Confirm password</label>
            <input type="password" value={form.confirm} onChange={set("confirm")} disabled={busy} /></div>

          <button className="submit" onClick={submit} disabled={busy}>
            {busy ? <span className="spinner" /> : "Create company account"}
          </button>
          <p className="foot-note">Already have an account? <Link to="/login">Sign in</Link></p>
        </div>
      </main>
    </div>
  );
}
