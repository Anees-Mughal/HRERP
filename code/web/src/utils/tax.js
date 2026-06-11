// ---- Pakistan payroll calculations (configurable) ----

// FBR salaried tax slabs FY 2025-26 (annual taxable income, PKR).
// Update this array each budget year — nothing else changes.
export const FBR_SLABS = [
  { upTo: 600000, base: 0, rate: 0, over: 0 },
  { upTo: 1200000, base: 0, rate: 0.01, over: 600000 },
  { upTo: 2200000, base: 6000, rate: 0.11, over: 1200000 },
  { upTo: 3200000, base: 116000, rate: 0.23, over: 2200000 },
  { upTo: 4100000, base: 346000, rate: 0.3, over: 3200000 },
  { upTo: Infinity, base: 616000, rate: 0.35, over: 4100000 },
];

// EOBI is contributed on minimum wage, not actual salary.
export const EOBI = { employee: 370, employer: 1850 };

export function monthlyIncomeTax(monthlyGross) {
  const annual = monthlyGross * 12;
  const slab = FBR_SLABS.find((s) => annual <= s.upTo);
  const annualTax = slab.base + (annual - slab.over) * slab.rate;
  return Math.round(Math.max(0, annualTax) / 12);
}

export function calcPayroll(emp, opts = {}) {
  const basic = emp.basicSalary || 0;
  const hra = Math.round(basic * 0.4);
  const medical = Math.round(basic * 0.1);
  const conveyance = emp.conveyance ?? 0;
  const gross = basic + hra + medical + conveyance;

  const tax = monthlyIncomeTax(gross);
  const eobi = EOBI.employee;
  const loan = opts.loanInstalment || 0;
  const lateDeduction = Math.round(((opts.lateMarks || 0) / 3) * (basic / 30));

  const totalDeductions = tax + eobi + loan + lateDeduction;
  const net = gross - totalDeductions;

  return {
    basic, hra, medical, conveyance, gross,
    tax, eobi, loan, lateDeduction, totalDeductions, net,
  };
}

export const fmt = (n) => (n ?? 0).toLocaleString("en-PK");
