// ---- Mock data layer ----
// Runs the whole app out of the box. Same shapes as the real API —
// set VITE_USE_MOCK=0 + VITE_API_URL to switch, no page code changes.

let seq = 500;
const id = () => ++seq;
const today = new Date().toISOString().slice(0, 10);
const THIS_MONTH = new Date().toLocaleString("en-PK", { month: "long", year: "numeric" });

export const db = {
  company: { name: "Demo School System", ownerPhone: "0300-1234567" },
  departments: [
    { id: 1, name: "Engineering", managerId: 2 },
    { id: 2, name: "Sales & Marketing", managerId: 4 },
    { id: 3, name: "Finance", managerId: 6 },
    { id: 4, name: "Human Resources", managerId: 7 },
  ],
  employees: [
    { id: 1, fullName: "Ahmed Raza", cnic: "35202-1234567-1", departmentId: 1, designation: "Senior Developer", employmentType: "Permanent", joiningDate: "2023-02-01", basicSalary: 180000, conveyance: 10000, bloodGroup: "B+", phone: "0300-1234567", email: "ahmed@acme.pk", isActive: true },
    { id: 2, fullName: "Sana Khalid", cnic: "35201-7654321-2", departmentId: 1, designation: "Engineering Manager", employmentType: "Permanent", joiningDate: "2022-06-15", basicSalary: 250000, conveyance: 15000, bloodGroup: "O+", phone: "0301-2223334", email: "sana@acme.pk", isActive: true },
    { id: 3, fullName: "Bilal Hussain", cnic: "35202-9988776-3", departmentId: 1, designation: "QA Engineer", employmentType: "Contract", joiningDate: "2024-01-10", basicSalary: 110000, conveyance: 8000, bloodGroup: "A+", phone: "0333-9876543", email: "bilal@acme.pk", isActive: true },
    { id: 4, fullName: "Fatima Noor", cnic: "35200-1122334-4", departmentId: 2, designation: "Sales Manager", employmentType: "Permanent", joiningDate: "2022-09-01", basicSalary: 200000, conveyance: 20000, bloodGroup: "AB+", phone: "0345-1112223", email: "fatima@acme.pk", isActive: true },
    { id: 5, fullName: "Usman Tariq", cnic: "35201-5566778-5", departmentId: 2, designation: "Marketing Executive", employmentType: "Permanent", joiningDate: "2024-03-20", basicSalary: 90000, conveyance: 6000, bloodGroup: "B-", phone: "0312-4445556", email: "usman@acme.pk", isActive: true },
    { id: 6, fullName: "Hira Shahid", cnic: "35202-3344556-6", departmentId: 3, designation: "Finance Manager", employmentType: "Permanent", joiningDate: "2021-12-01", basicSalary: 220000, conveyance: 12000, bloodGroup: "O-", phone: "0321-7778889", email: "hira@acme.pk", isActive: true },
    { id: 7, fullName: "Imran Sheikh", cnic: "35200-9900112-7", departmentId: 4, designation: "HR Manager", employmentType: "Permanent", joiningDate: "2022-01-15", basicSalary: 190000, conveyance: 10000, bloodGroup: "A-", phone: "0302-6665554", email: "imran@acme.pk", isActive: true },
    { id: 8, fullName: "Zara Ali", cnic: "35201-2211009-8", departmentId: 1, designation: "Junior Developer", employmentType: "Probation", joiningDate: "2026-01-05", basicSalary: 70000, conveyance: 5000, bloodGroup: "B+", phone: "0334-1234987", email: "zara@acme.pk", isActive: true },
  ],
  attendance: [],
  leaveTypes: [
    { id: 1, name: "Annual", quota: 14 },
    { id: 2, name: "Sick", quota: 8 },
    { id: 3, name: "Casual", quota: 10 },
    { id: 4, name: "Hajj", quota: 40 },
    { id: 5, name: "Maternity", quota: 90 },
  ],
  leaves: [
    { id: 1, employeeId: 3, typeId: 2, from: "2026-06-08", to: "2026-06-09", days: 2, reason: "Fever", status: "Pending", appliedOn: "2026-06-07" },
    { id: 2, employeeId: 5, typeId: 1, from: "2026-06-22", to: "2026-06-26", days: 5, reason: "Family trip to Murree", status: "Pending", appliedOn: "2026-06-05" },
    { id: 3, employeeId: 1, typeId: 3, from: "2026-05-14", to: "2026-05-14", days: 1, reason: "Personal errand", status: "Approved", appliedOn: "2026-05-12" },
  ],
  loans: [
    { id: 1, employeeId: 4, amount: 300000, instalment: 25000, remaining: 175000, status: "Active", reason: "Home renovation", date: "2026-01-10" },
    { id: 2, employeeId: 8, amount: 50000, instalment: 10000, remaining: 50000, status: "Pending", reason: "Advance salary", date: "2026-06-02" },
  ],
  appraisals: [
    { id: 1, employeeId: 1, cycle: "H1 2026", goals: "Ship payroll module; mentor 2 juniors", rating: 4, managerComment: "Strong delivery, on track for promotion.", status: "Completed" },
    { id: 2, employeeId: 5, cycle: "H1 2026", goals: "20 qualified leads/month", rating: 3, managerComment: "Meets expectations; improve follow-ups.", status: "Completed" },
    { id: 3, employeeId: 8, cycle: "H1 2026", goals: "Complete onboarding curriculum", rating: 0, managerComment: "", status: "In Review" },
  ],
  // Per-employee payroll overrides (set from the editable salary sheet)
  payrollOverrides: {},
  // Generated payslips — feed Accounts salary expenses + mobile "generated" status
  payslips: [
    { id: 1, employeeId: 1, month: "May 2026", basic: 180000, hra: 72000, medical: 18000, conveyance: 10000, gross: 280000, tax: 32833, eobi: 370, loan: 0, lateDeduction: 0, totalDeductions: 33203, net: 246797, generatedOn: "2026-05-31" },
    { id: 2, employeeId: 2, month: "May 2026", basic: 250000, hra: 100000, medical: 25000, conveyance: 15000, gross: 390000, tax: 68250, eobi: 370, loan: 0, lateDeduction: 0, totalDeductions: 68620, net: 321380, generatedOn: "2026-05-31" },
    { id: 3, employeeId: 4, month: "May 2026", basic: 200000, hra: 80000, medical: 20000, conveyance: 20000, gross: 320000, tax: 44833, eobi: 370, loan: 25000, lateDeduction: 0, totalDeductions: 70203, net: 249797, generatedOn: "2026-05-31" },
  ],
  // Accounts
  expenses: [
    { id: 1, date: "2026-06-03", category: "Utilities", description: "Electricity bill — head office", amount: 84500 },
    { id: 2, date: "2026-06-05", category: "Rent", description: "Office rent June", amount: 250000 },
  ],
  revenues: [
    { id: 1, date: "2026-06-02", source: "School fees", description: "June fee collection — batch 1", amount: 2150000 },
    { id: 2, date: "2026-06-09", source: "Admissions", description: "New admissions (14 students)", amount: 420000 },
  ],
  payrollRuns: [],
};

// seed today's attendance with in/out times
db.attendance = db.employees.map((e, i) => ({
  id: id(), employeeId: e.id, date: today,
  status: i === 2 ? "Absent" : i === 4 ? "Late" : "Present",
  inTime: i === 2 ? "" : i === 4 ? "09:48" : "09:02",
  outTime: i === 2 ? "" : "17:05",
}));

const wait = (ms = 250) => new Promise((r) => setTimeout(r, ms));
const clone = (x) => JSON.parse(JSON.stringify(x));
const PHONE_RE = /^03\d{2}-?\d{7}$/;

export const mockApi = {
  // Head signs in with mobile number; staff with email.
  async login(identifier, password) {
    await wait(400);
    if (!identifier || !password) throw { response: { status: 401 } };
    const ident = identifier.trim();
    if (PHONE_RE.test(ident)) {
      return {
        accessToken: "mock-token", refreshToken: "mock-refresh",
        user: { id: 99, identifier: ident, role: "CompanyAdmin", tenantId: 1, fullName: "Head (Owner)", employeeId: null },
      };
    }
    if (!ident.includes("@")) throw { response: { status: 401, data: { message: "Use your mobile number (head) or email (staff)." } } };
    const role = ident.startsWith("emp") ? "Employee"
      : ident.startsWith("dept") ? "DeptManager"
      : ident.startsWith("hr") ? "HRManager"
      : "Employee";
    return {
      accessToken: "mock-token", refreshToken: "mock-refresh",
      user: { id: 1, identifier: ident, role, tenantId: 1, fullName: role === "Employee" ? "Ahmed Raza" : "Demo " + role, employeeId: 1 },
    };
  },

  // Web-only company signup
  async signup({ companyName, ownerName, phone, email, password }) {
    await wait(600);
    if (!PHONE_RE.test(phone)) throw { response: { status: 400, data: { message: "Mobile number must be like 0300-1234567." } } };
    db.company = { name: companyName, ownerPhone: phone };
    return {
      accessToken: "mock-token", refreshToken: "mock-refresh",
      user: { id: 99, identifier: phone, role: "CompanyAdmin", tenantId: 1, fullName: ownerName + " (Owner)", employeeId: null },
    };
  },

  async list(name) { await wait(); return clone(db[name]); },
  async add(name, item) { await wait(); const row = { id: id(), ...item }; db[name].push(row); return clone(row); },
  async update(name, itemId, patch) {
    await wait();
    const row = db[name].find((r) => r.id === itemId);
    Object.assign(row, patch);
    return clone(row);
  },
  async remove(name, itemId) { await wait(); db[name] = db[name].filter((r) => r.id !== itemId); return { ok: true }; },

  // Payroll overrides (editable salary sheet)
  async getOverrides() { await wait(120); return clone(db.payrollOverrides); },
  async setOverride(employeeId, values) {
    await wait(150);
    if (values === null) delete db.payrollOverrides[employeeId];
    else db.payrollOverrides[employeeId] = values;
    return clone(db.payrollOverrides);
  },

  // Finalize payroll: write payslip records for the month
  async generatePayslips(rows) {
    await wait(400);
    for (const r of rows) {
      const existing = db.payslips.find((p) => p.employeeId === r.employeeId && p.month === THIS_MONTH);
      const rec = { ...r, month: THIS_MONTH, generatedOn: today };
      if (existing) Object.assign(existing, rec);
      else db.payslips.push({ id: id(), ...rec });
    }
    return clone(db.payslips);
  },
};
