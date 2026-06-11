import axios from "axios";
import EncryptedStorage from "react-native-encrypted-storage";

// Set API_URL to your ASP.NET Core API to go live. Empty = built-in mock.
const API_URL = ""; // e.g. "https://api.hrstackpk.com"
const BASE_URL = API_URL;
const USE_MOCK = !BASE_URL;

const TOKEN_KEY = "hr_access_token";
const REFRESH_KEY = "hr_refresh_token";
const USER_KEY = "hr_user";
const PHONE_RE = /^03\d{2}-?\d{7}$/;

export const tokenStore = {
  getAccess: () => EncryptedStorage.getItem(TOKEN_KEY),
  getRefresh: () => EncryptedStorage.getItem(REFRESH_KEY),
  getUser: async () => {
    const raw = await EncryptedStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  },
  set: async ({ accessToken, refreshToken, user }) => {
    if (accessToken) await EncryptedStorage.setItem(TOKEN_KEY, accessToken);
    if (refreshToken) await EncryptedStorage.setItem(REFRESH_KEY, refreshToken);
    if (user) await EncryptedStorage.setItem(USER_KEY, JSON.stringify(user));
  },
  clear: async () => {
    for (const k of [TOKEN_KEY, REFRESH_KEY, USER_KEY]) {
      try { await EncryptedStorage.removeItem(k); } catch (e) {}
    }
  },
};

const api = axios.create({ baseURL: `${BASE_URL}/api` });
api.interceptors.request.use(async (config) => {
  const token = await tokenStore.getAccess();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry && !original.url.includes("/auth/")) {
      original._retry = true;
      const refreshToken = await tokenStore.getRefresh();
      if (refreshToken) {
        try {
          const { data } = await axios.post(`${BASE_URL}/api/auth/refresh`, { refreshToken });
          await tokenStore.set(data);
          original.headers.Authorization = `Bearer ${data.accessToken}`;
          return api(original);
        } catch { await tokenStore.clear(); }
      }
    }
    return Promise.reject(error);
  }
);

// ====================== MOCK DB ======================
const today = new Date().toISOString().slice(0, 10);
let seq = 900;
const id = () => ++seq;
const wait = (ms = 320) => new Promise((r) => setTimeout(r, ms));
const cp = (x) => JSON.parse(JSON.stringify(x));

const db = {
  departments: [
    { id: 1, name: "Engineering", managerId: 2 },
    { id: 2, name: "Sales & Marketing", managerId: 4 },
    { id: 3, name: "Finance", managerId: 6 },
  ],
  employees: [
    { id: 1, fullName: "Ahmed Raza", cnic: "35202-1234567-1", departmentId: 1, designation: "Senior Developer", employmentType: "Permanent", basicSalary: 180000, email: "ahmed@acme.pk", phone: "0300-1111111", isActive: true },
    { id: 2, fullName: "Sana Khalid", cnic: "35201-7654321-2", departmentId: 1, designation: "Engineering Manager", employmentType: "Permanent", basicSalary: 250000, email: "sana@acme.pk", phone: "0301-2223334", isActive: true },
    { id: 3, fullName: "Bilal Hussain", cnic: "35202-9988776-3", departmentId: 1, designation: "QA Engineer", employmentType: "Contract", basicSalary: 110000, email: "bilal@acme.pk", phone: "0333-9876543", isActive: true },
    { id: 4, fullName: "Fatima Noor", cnic: "35200-1122334-4", departmentId: 2, designation: "Sales Manager", employmentType: "Permanent", basicSalary: 200000, email: "fatima@acme.pk", phone: "0345-1112223", isActive: true },
    { id: 5, fullName: "Usman Tariq", cnic: "35201-5566778-5", departmentId: 2, designation: "Marketing Executive", employmentType: "Permanent", basicSalary: 90000, email: "usman@acme.pk", phone: "0312-4445556", isActive: true },
  ],
  attendance: [
    { id: 1, employeeId: 1, date: today, status: "Present", inTime: "09:02", outTime: "" },
    { id: 2, employeeId: 2, date: today, status: "Present", inTime: "08:55", outTime: "" },
    { id: 3, employeeId: 4, date: today, status: "Late", inTime: "09:48", outTime: "" },
    // history for staff date-range view
    { id: 4, employeeId: 1, date: "2026-06-10", status: "Present", inTime: "09:00", outTime: "17:10" },
    { id: 5, employeeId: 1, date: "2026-06-09", status: "Late", inTime: "09:40", outTime: "17:30" },
    { id: 6, employeeId: 1, date: "2026-06-08", status: "Present", inTime: "08:58", outTime: "17:02" },
    { id: 7, employeeId: 1, date: "2026-06-05", status: "Absent", inTime: "", outTime: "" },
  ],
  leaves: [
    { id: 1, employeeId: 3, type: "Sick", from: "2026-06-08", to: "2026-06-09", days: 2, reason: "Fever", status: "Pending" },
    { id: 2, employeeId: 5, type: "Annual", from: "2026-06-22", to: "2026-06-26", days: 5, reason: "Family trip to Murree", status: "Pending" },
    { id: 3, employeeId: 1, type: "Casual", from: "2026-05-14", to: "2026-05-14", days: 1, reason: "Personal errand", status: "Approved" },
  ],
  loans: [
    { id: 1, employeeId: 4, amount: 300000, instalment: 25000, remaining: 175000, status: "Active", reason: "Home renovation" },
    { id: 2, employeeId: 5, amount: 50000, instalment: 10000, remaining: 50000, status: "Pending", reason: "Advance salary" },
  ],
  balances: [
    { type: "Annual", used: 0, quota: 14 },
    { type: "Sick", used: 2, quota: 8 },
    { type: "Casual", used: 1, quota: 10 },
  ],
  // payslips generated FROM THE ERP — mobile is read-only
  payslips: [
    { id: 1, employeeId: 1, month: "June 2026", basic: 180000, hra: 72000, medical: 18000, conveyance: 10000, gross: 280000, tax: 32833, eobi: 370, loan: 0, totalDeductions: 33203, net: 246797, generatedOn: today },
    { id: 2, employeeId: 1, month: "May 2026", basic: 180000, hra: 72000, medical: 18000, conveyance: 10000, gross: 280000, tax: 32833, eobi: 370, loan: 0, totalDeductions: 33203, net: 246797, generatedOn: "2026-05-31" },
    { id: 3, employeeId: 2, month: "May 2026", basic: 250000, hra: 100000, medical: 25000, conveyance: 15000, gross: 390000, tax: 68250, eobi: 370, loan: 0, totalDeductions: 68620, net: 321380, generatedOn: "2026-05-31" },
    { id: 4, employeeId: 4, month: "May 2026", basic: 200000, hra: 80000, medical: 20000, conveyance: 20000, gross: 320000, tax: 44833, eobi: 370, loan: 25000, totalDeductions: 70203, net: 249797, generatedOn: "2026-05-31" },
  ],
  // Accounts — manual expenses + revenue (salary expenses derived from payslips at report time)
  expenses: [
    { id: 1, date: "2026-06-03", category: "Utilities", description: "Electricity bill — head office", amount: 84500 },
    { id: 2, date: "2026-06-05", category: "Rent", description: "Office rent June", amount: 250000 },
  ],
  revenues: [
    { id: 1, date: "2026-06-02", source: "School fees", description: "June fee collection — batch 1", amount: 2150000 },
    { id: 2, date: "2026-06-09", source: "Admissions", description: "New admissions (14 students)", amount: 420000 },
  ],
};

const mock = {
  // Head → mobile number · Staff → email. No signup in the app (web only).
  async login(identifier, password) {
    await wait(450);
    const ident = (identifier || "").trim();
    if (!ident || !password) { const e = new Error("bad"); e.status = 401; throw e; }
    if (PHONE_RE.test(ident)) {
      return { accessToken: "mock", refreshToken: "mock", user: { id: 99, role: "Head", fullName: "Head (Owner)", identifier: ident, employeeId: null } };
    }
    if (!ident.includes("@")) { const e = new Error("format"); e.status = 401; throw e; }
    return { accessToken: "mock", refreshToken: "mock", user: { id: 1, role: "Staff", fullName: "Ahmed Raza", identifier: ident, employeeId: 1 } };
  },

  // ---- shared ----
  async departments() { await wait(); return cp(db.departments); },
  async employees() { await wait(); return cp(db.employees); },

  // ---- Head ----
  async addEmployee(item) { await wait(); const row = { id: id(), isActive: true, ...item }; db.employees.push(row); return cp(row); },
  async updateEmployee(empId, patch) { await wait(); Object.assign(db.employees.find((e) => e.id === empId), patch); return { ok: true }; },
  async addDepartment(item) { await wait(); const row = { id: id(), ...item }; db.departments.push(row); return cp(row); },
  async updateDepartment(depId, patch) { await wait(); Object.assign(db.departments.find((d) => d.id === depId), patch); return { ok: true }; },
  async attendanceFor(date) {
    await wait();
    return db.employees.filter((e) => e.isActive).map((e) => ({
      employee: cp(e),
      record: cp(db.attendance.find((a) => a.employeeId === e.id && a.date === date) || null),
    }));
  },
  async markAttendance(employeeId, date, patch) {
    await wait(200);
    let rec = db.attendance.find((a) => a.employeeId === employeeId && a.date === date);
    if (rec) Object.assign(rec, patch);
    else db.attendance.push({ id: id(), employeeId, date, status: "Present", inTime: "", outTime: "", ...patch });
    return { ok: true };
  },
  async leavesAll() {
    await wait();
    return db.leaves.map((l) => ({ ...cp(l), employee: cp(db.employees.find((e) => e.id === l.employeeId)) }));
  },
  async decideLeave(leaveId, status) { await wait(); db.leaves.find((l) => l.id === leaveId).status = status; return { ok: true }; },
  async loansAll() {
    await wait();
    return db.loans.map((l) => ({ ...cp(l), employee: cp(db.employees.find((e) => e.id === l.employeeId)) }));
  },
  async decideLoan(loanId, status) { await wait(); db.loans.find((l) => l.id === loanId).status = status; return { ok: true }; },
  // payroll view-only: every active employee + whether this month's slip is generated
  async payslipsOverview(month) {
    await wait();
    return db.employees.filter((e) => e.isActive).map((e) => {
      const slip = db.payslips.find((p) => p.employeeId === e.id && p.month === month);
      return { employee: cp(e), slip: cp(slip || null), generated: !!slip };
    });
  },
  async payslipsOf(employeeId) { await wait(); return cp(db.payslips.filter((p) => p.employeeId === employeeId)); },

  // ---- Accounts reports (Head, read-only) ----
  // month = "" for all, or "YYYY-MM". Salary expenses come ONLY from generated payslips.
  async accountsReport(month) {
    await wait();
    const monthKey = (ym) => {
      // payslip month is "May 2026" → convert to YYYY-MM for filtering
      const [mName, yr] = (ym || "").split(" ");
      const mi = ["January","February","March","April","May","June","July","August","September","October","November","December"].indexOf(mName);
      return mi >= 0 ? `${yr}-${String(mi + 1).padStart(2, "0")}` : "";
    };
    const inMonth = (d) => !month || (d || "").slice(0, 7) === month;

    const salaryRows = db.payslips
      .filter((p) => !month || monthKey(p.month) === month)
      .map((p) => ({
        category: "Salaries",
        name: db.employees.find((e) => e.id === p.employeeId)?.fullName || "Staff",
        amount: p.net,
      }));
    const otherExpenses = db.expenses.filter((e) => inMonth(e.date));
    const revenues = db.revenues.filter((r) => inMonth(r.date));

    const group = (rows, keyFn) => {
      const m = {};
      rows.forEach((r) => { const k = keyFn(r); m[k] = (m[k] || 0) + r.amount; });
      return Object.entries(m).map(([head, amount]) => ({ head, amount })).sort((a, b) => b.amount - a.amount);
    };

    const salaryTotal = salaryRows.reduce((s, r) => s + r.amount, 0);
    const expenseGroups = group(otherExpenses, (e) => e.category);
    if (salaryTotal > 0) expenseGroups.unshift({ head: "Salaries (generated payslips)", amount: salaryTotal });
    const revenueGroups = group(revenues, (r) => r.source);

    const totalExpenses = salaryTotal + otherExpenses.reduce((s, e) => s + e.amount, 0);
    const totalRevenue = revenues.reduce((s, r) => s + r.amount, 0);

    return {
      month,
      expenses: { total: totalExpenses, groups: expenseGroups },
      revenue: { total: totalRevenue, groups: revenueGroups },
      pl: { revenue: totalRevenue, expenses: totalExpenses, net: totalRevenue - totalExpenses },
      salaryCount: salaryRows.length,
    };
  },

  // ---- Staff ----
  async profile() { await wait(); return cp(db.employees.find((e) => e.id === 1)); },
  async myPayslips() { await wait(); return cp(db.payslips.filter((p) => p.employeeId === 1)); },
  async myAttendance(from, to) {
    await wait();
    return cp(db.attendance
      .filter((a) => a.employeeId === 1 && (!from || a.date >= from) && (!to || a.date <= to))
      .sort((a, b) => b.date.localeCompare(a.date)));
  },
  async checkIn() {
    await wait(250);
    const t = new Date().toTimeString().slice(0, 5);
    const rec = { id: id(), employeeId: 1, date: today, status: t > "09:15" ? "Late" : "Present", inTime: t, outTime: "" };
    db.attendance.unshift(rec);
    return cp(rec);
  },
  async balances() { await wait(); return cp(db.balances); },
  async myLeaves() { await wait(); return cp(db.leaves.filter((l) => l.employeeId === 1)); },
  async applyLeave(item) { await wait(); const row = { id: id(), employeeId: 1, status: "Pending", ...item }; db.leaves.unshift(row); return cp(row); },
  async myLoans() { await wait(); return cp(db.loans.filter((l) => l.employeeId === 1)); },
  async applyLoan(item) { await wait(); const row = { id: id(), employeeId: 1, status: "Pending", remaining: item.amount, ...item }; db.loans.unshift(row); return cp(row); },
};

// ---- Real API (same shapes; controllers use stored procedures) ----
const real = {
  login: (identifier, password) => api.post("/auth/login", { identifier, password }).then((r) => r.data),
  departments: () => api.get("/departments").then((r) => r.data),
  employees: () => api.get("/employees").then((r) => r.data),
  addEmployee: (item) => api.post("/employees", item).then((r) => r.data),
  updateEmployee: (id, patch) => api.put(`/employees/${id}`, patch).then((r) => r.data),
  addDepartment: (item) => api.post("/departments", item).then((r) => r.data),
  updateDepartment: (id, patch) => api.put(`/departments/${id}`, patch).then((r) => r.data),
  attendanceFor: (date) => api.get(`/attendance?date=${date}`).then((r) => r.data),
  markAttendance: (employeeId, date, patch) => api.post("/attendance/mark", { employeeId, date, ...patch }).then((r) => r.data),
  leavesAll: () => api.get("/leaves").then((r) => r.data),
  decideLeave: (id, status) => api.put(`/leaves/${id}/status`, { status }).then((r) => r.data),
  loansAll: () => api.get("/loans").then((r) => r.data),
  decideLoan: (id, status) => api.put(`/loans/${id}/status`, { status }).then((r) => r.data),
  payslipsOverview: (month) => api.get(`/payslips/overview?month=${encodeURIComponent(month)}`).then((r) => r.data),
  payslipsOf: (employeeId) => api.get(`/payslips/employee/${employeeId}`).then((r) => r.data),
  accountsReport: (month) => api.get(`/accounts/report?month=${month || ""}`).then((r) => r.data),
  profile: () => api.get("/employees/me").then((r) => r.data),
  myPayslips: () => api.get("/payslips/me").then((r) => r.data),
  myAttendance: (from, to) => api.get(`/attendance/me?from=${from || ""}&to=${to || ""}`).then((r) => r.data),
  checkIn: () => api.post("/attendance/check-in").then((r) => r.data),
  balances: () => api.get("/leaves/me/balances").then((r) => r.data),
  myLeaves: () => api.get("/leaves/me").then((r) => r.data),
  applyLeave: (item) => api.post("/leaves", item).then((r) => r.data),
  myLoans: () => api.get("/loans/me").then((r) => r.data),
  applyLoan: (item) => api.post("/loans", item).then((r) => r.data),
};

export const svc = USE_MOCK ? mock : real;
export const fmt = (n) => (n ?? 0).toLocaleString("en-PK");
export const THIS_MONTH = new Date().toLocaleString("en-PK", { month: "long", year: "numeric" });
