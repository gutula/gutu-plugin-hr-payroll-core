/** HRMS — Employees, Attendance, Leave, and Payroll Runs.
 *
 *  Employee = person record with a base salary in minor units.
 *  Attendance = one row per (employee, date). Hours derive from check
 *    in/out (when both exist) or from `hours` directly (manual entry).
 *  Leave = leave types + entries. Each entry is one of:
 *      'accrual'      (+days)  — typically posted by a monthly job,
 *      'consumption'  (-days)  — when a leave is taken,
 *      'adjustment'   (±days)  — manual correction.
 *    Net balance = sum of all entries up to a date.
 *  Payroll Run = a period (typically a month) that produces one
 *    payroll line per active employee, computes gross/tax/deductions/
 *    net, and (on post) writes a balanced GL journal:
 *
 *      Dr  Salary Expense                       sum(gross)
 *        Cr  Tax Withholding Liability          sum(tax)
 *        Cr  Other Deductions Liability         sum(deductions)
 *        Cr  Payroll Payable                    sum(net)
 *
 *  Tax rate for the demo computation is a flat percentage configurable
 *  per run; production deployments swap this for a tax-template lookup.
 */

import { db, nowIso } from "@gutu-host";
import { uuid } from "@gutu-host";
import { recordAudit } from "@gutu-host";
import { postJournal, type JournalLineInput } from "@gutu-plugin/accounting-core";

export type EmployeeStatus = "active" | "on-leave" | "terminated";
export type AttendanceStatus =
  | "present"
  | "absent"
  | "half-day"
  | "leave"
  | "holiday"
  | "work-from-home";
export type PayrollRunStatus = "draft" | "computed" | "posted" | "cancelled";

export interface Employee {
  id: string;
  tenantId: string;
  employeeNo: string;
  firstName: string;
  lastName: string;
  email: string | null;
  department: string | null;
  designation: string | null;
  hireDate: string;
  terminationDate: string | null;
  status: EmployeeStatus;
  baseSalaryMinor: number;
  currency: string;
  bankAccount: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceEntry {
  id: string;
  tenantId: string;
  employeeId: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  status: AttendanceStatus;
  hours: number;
  memo: string | null;
  createdAt: string;
}

export interface LeaveType {
  id: string;
  tenantId: string;
  code: string;
  name: string;
  annualDays: number;
  paid: boolean;
}

export interface LeaveEntry {
  id: string;
  tenantId: string;
  employeeId: string;
  leaveTypeId: string;
  kind: "accrual" | "consumption" | "adjustment";
  days: number;
  effectiveDate: string;
  memo: string | null;
}

export interface PayrollLine {
  id: string;
  runId: string;
  employeeId: string;
  grossMinor: number;
  taxMinor: number;
  deductionsMinor: number;
  netMinor: number;
  currency: string;
  details: Record<string, unknown>;
}

export interface PayrollRun {
  id: string;
  tenantId: string;
  number: string;
  periodLabel: string;
  fromDate: string;
  toDate: string;
  currency: string;
  status: PayrollRunStatus;
  glJournalId: string | null;
  totalGrossMinor: number;
  totalTaxMinor: number;
  totalNetMinor: number;
  memo: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  lines: PayrollLine[];
}

export class HrmsError extends Error {
  constructor(public code: string, message: string) {
    super(message);
    this.name = "HrmsError";
  }
}

/* ----------------------------- Employee ---------------------------------- */

interface EmpRow {
  id: string;
  tenant_id: string;
  employee_no: string;
  first_name: string;
  last_name: string;
  email: string | null;
  department: string | null;
  designation: string | null;
  hire_date: string;
  termination_date: string | null;
  status: EmployeeStatus;
  base_salary_minor: number;
  currency: string;
  bank_account: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

function empFromRow(r: EmpRow): Employee {
  return {
    id: r.id,
    tenantId: r.tenant_id,
    employeeNo: r.employee_no,
    firstName: r.first_name,
    lastName: r.last_name,
    email: r.email,
    department: r.department,
    designation: r.designation,
    hireDate: r.hire_date,
    terminationDate: r.termination_date,
    status: r.status,
    baseSalaryMinor: r.base_salary_minor,
    currency: r.currency,
    bankAccount: r.bank_account,
    createdBy: r.created_by,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export interface CreateEmployeeArgs {
  tenantId: string;
  employeeNo: string;
  firstName: string;
  lastName: string;
  email?: string;
  department?: string;
  designation?: string;
  hireDate: string;
  baseSalaryMinor?: number;
  currency?: string;
  bankAccount?: string;
  createdBy: string;
}

export function createEmployee(args: CreateEmployeeArgs): Employee {
  if (!args.employeeNo || !args.firstName || !args.lastName)
    throw new HrmsError("invalid", "employeeNo, firstName, lastName required");
  const id = uuid();
  const now = nowIso();
  try {
    db.prepare(
      `INSERT INTO hr_employees
         (id, tenant_id, employee_no, first_name, last_name, email, department, designation,
          hire_date, termination_date, status, base_salary_minor, currency, bank_account,
          created_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, 'active', ?, ?, ?, ?, ?, ?)`,
    ).run(
      id,
      args.tenantId,
      args.employeeNo,
      args.firstName,
      args.lastName,
      args.email ?? null,
      args.department ?? null,
      args.designation ?? null,
      args.hireDate,
      args.baseSalaryMinor ?? 0,
      args.currency ?? "USD",
      args.bankAccount ?? null,
      args.createdBy,
      now,
      now,
    );
  } catch (err) {
    if (err instanceof Error && /UNIQUE/.test(err.message))
      throw new HrmsError("duplicate", `Employee number "${args.employeeNo}" already exists`);
    throw err;
  }
  return getEmployee(args.tenantId, id)!;
}

export function getEmployee(tenantId: string, id: string): Employee | null {
  const r = db.prepare(`SELECT * FROM hr_employees WHERE id = ? AND tenant_id = ?`)
    .get(id, tenantId) as EmpRow | undefined;
  return r ? empFromRow(r) : null;
}

export function listEmployees(tenantId: string, status?: EmployeeStatus): Employee[] {
  const rows = status
    ? (db.prepare(
        `SELECT * FROM hr_employees WHERE tenant_id = ? AND status = ? ORDER BY employee_no ASC`,
      ).all(tenantId, status) as EmpRow[])
    : (db.prepare(`SELECT * FROM hr_employees WHERE tenant_id = ? ORDER BY employee_no ASC`)
        .all(tenantId) as EmpRow[]);
  return rows.map(empFromRow);
}

export function updateEmployee(
  tenantId: string,
  id: string,
  patch: Partial<Pick<Employee, "firstName" | "lastName" | "email" | "department" | "designation" | "baseSalaryMinor" | "bankAccount" | "status" | "terminationDate">>,
): Employee | null {
  const existing = getEmployee(tenantId, id);
  if (!existing) return null;
  const fields: string[] = [];
  const params: unknown[] = [];
  if (patch.firstName !== undefined) { fields.push("first_name = ?"); params.push(patch.firstName); }
  if (patch.lastName !== undefined) { fields.push("last_name = ?"); params.push(patch.lastName); }
  if (patch.email !== undefined) { fields.push("email = ?"); params.push(patch.email); }
  if (patch.department !== undefined) { fields.push("department = ?"); params.push(patch.department); }
  if (patch.designation !== undefined) { fields.push("designation = ?"); params.push(patch.designation); }
  if (patch.baseSalaryMinor !== undefined) { fields.push("base_salary_minor = ?"); params.push(patch.baseSalaryMinor); }
  if (patch.bankAccount !== undefined) { fields.push("bank_account = ?"); params.push(patch.bankAccount); }
  if (patch.status !== undefined) { fields.push("status = ?"); params.push(patch.status); }
  if (patch.terminationDate !== undefined) { fields.push("termination_date = ?"); params.push(patch.terminationDate); }
  if (fields.length === 0) return existing;
  fields.push("updated_at = ?");
  params.push(nowIso());
  params.push(id);
  db.prepare(`UPDATE hr_employees SET ${fields.join(", ")} WHERE id = ?`).run(...params);
  return getEmployee(tenantId, id);
}

/* ----------------------------- Attendance -------------------------------- */

export interface RecordAttendanceArgs {
  tenantId: string;
  employeeId: string;
  date: string;
  checkIn?: string;
  checkOut?: string;
  status?: AttendanceStatus;
  hours?: number;
  memo?: string;
}

export function recordAttendance(args: RecordAttendanceArgs): AttendanceEntry {
  const emp = getEmployee(args.tenantId, args.employeeId);
  if (!emp) throw new HrmsError("not-found", "Employee not found");
  let hours = args.hours ?? 0;
  if (hours === 0 && args.checkIn && args.checkOut) {
    const inMs = new Date(args.checkIn).getTime();
    const outMs = new Date(args.checkOut).getTime();
    if (Number.isFinite(inMs) && Number.isFinite(outMs) && outMs > inMs) {
      hours = (outMs - inMs) / (60 * 60 * 1000);
    }
  }
  const status = args.status ?? (hours >= 8 ? "present" : hours >= 4 ? "half-day" : "absent");
  const id = uuid();
  const now = nowIso();
  // Upsert by (tenant, employee, date).
  const existing = db.prepare(
    `SELECT id FROM hr_attendance WHERE tenant_id = ? AND employee_id = ? AND date = ?`,
  ).get(args.tenantId, args.employeeId, args.date) as { id: string } | undefined;
  if (existing) {
    db.prepare(
      `UPDATE hr_attendance SET check_in = ?, check_out = ?, status = ?, hours = ?, memo = ? WHERE id = ?`,
    ).run(
      args.checkIn ?? null,
      args.checkOut ?? null,
      status,
      hours,
      args.memo ?? null,
      existing.id,
    );
    return getAttendance(args.tenantId, existing.id)!;
  }
  db.prepare(
    `INSERT INTO hr_attendance
       (id, tenant_id, employee_id, date, check_in, check_out, status, hours, memo, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    id,
    args.tenantId,
    args.employeeId,
    args.date,
    args.checkIn ?? null,
    args.checkOut ?? null,
    status,
    hours,
    args.memo ?? null,
    now,
  );
  return getAttendance(args.tenantId, id)!;
}

export function getAttendance(tenantId: string, id: string): AttendanceEntry | null {
  const r = db.prepare(`SELECT * FROM hr_attendance WHERE id = ? AND tenant_id = ?`)
    .get(id, tenantId) as
      | {
          id: string;
          tenant_id: string;
          employee_id: string;
          date: string;
          check_in: string | null;
          check_out: string | null;
          status: AttendanceStatus;
          hours: number;
          memo: string | null;
          created_at: string;
        }
      | undefined;
  return r
    ? {
        id: r.id,
        tenantId: r.tenant_id,
        employeeId: r.employee_id,
        date: r.date,
        checkIn: r.check_in,
        checkOut: r.check_out,
        status: r.status,
        hours: r.hours,
        memo: r.memo,
        createdAt: r.created_at,
      }
    : null;
}

export function listAttendance(args: {
  tenantId: string;
  employeeId?: string;
  fromDate?: string;
  toDate?: string;
}): AttendanceEntry[] {
  const conditions: string[] = ["tenant_id = ?"];
  const params: unknown[] = [args.tenantId];
  if (args.employeeId) { conditions.push("employee_id = ?"); params.push(args.employeeId); }
  if (args.fromDate) { conditions.push("date >= ?"); params.push(args.fromDate); }
  if (args.toDate) { conditions.push("date <= ?"); params.push(args.toDate); }
  const rows = db.prepare(
    `SELECT id FROM hr_attendance WHERE ${conditions.join(" AND ")}
       ORDER BY date DESC, employee_id ASC`,
  ).all(...params) as Array<{ id: string }>;
  return rows.map((r) => getAttendance(args.tenantId, r.id)!).filter(Boolean);
}

/* ----------------------------- Leave ------------------------------------- */

export function createLeaveType(args: {
  tenantId: string;
  code: string;
  name: string;
  annualDays?: number;
  paid?: boolean;
}): LeaveType {
  const id = uuid();
  try {
    db.prepare(
      `INSERT INTO hr_leave_types
         (id, tenant_id, code, name, annual_days, paid, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      id,
      args.tenantId,
      args.code,
      args.name,
      args.annualDays ?? 0,
      args.paid === false ? 0 : 1,
      nowIso(),
    );
  } catch (err) {
    if (err instanceof Error && /UNIQUE/.test(err.message))
      throw new HrmsError("duplicate", `Leave type "${args.code}" already exists`);
    throw err;
  }
  return getLeaveType(args.tenantId, id)!;
}

export function getLeaveType(tenantId: string, id: string): LeaveType | null {
  const r = db.prepare(`SELECT * FROM hr_leave_types WHERE id = ? AND tenant_id = ?`)
    .get(id, tenantId) as
      | { id: string; tenant_id: string; code: string; name: string; annual_days: number; paid: number }
      | undefined;
  return r
    ? {
        id: r.id,
        tenantId: r.tenant_id,
        code: r.code,
        name: r.name,
        annualDays: r.annual_days,
        paid: r.paid === 1,
      }
    : null;
}

export function listLeaveTypes(tenantId: string): LeaveType[] {
  const rows = db.prepare(`SELECT id FROM hr_leave_types WHERE tenant_id = ? ORDER BY code ASC`)
    .all(tenantId) as Array<{ id: string }>;
  return rows.map((r) => getLeaveType(tenantId, r.id)!).filter(Boolean);
}

export function recordLeave(args: {
  tenantId: string;
  employeeId: string;
  leaveTypeId: string;
  kind: "accrual" | "consumption" | "adjustment";
  days: number;
  effectiveDate: string;
  memo?: string;
  createdBy?: string;
}): LeaveEntry {
  if (!Number.isFinite(args.days) || args.days === 0)
    throw new HrmsError("invalid", "Days must be non-zero");
  const sign = args.kind === "consumption" ? -Math.abs(args.days) : args.kind === "accrual" ? Math.abs(args.days) : args.days;
  const id = uuid();
  db.prepare(
    `INSERT INTO hr_leave_entries
       (id, tenant_id, employee_id, leave_type_id, kind, days, effective_date, memo, created_by, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    id,
    args.tenantId,
    args.employeeId,
    args.leaveTypeId,
    args.kind,
    sign,
    args.effectiveDate,
    args.memo ?? null,
    args.createdBy ?? null,
    nowIso(),
  );
  return getLeaveEntry(args.tenantId, id)!;
}

export function getLeaveEntry(tenantId: string, id: string): LeaveEntry | null {
  const r = db.prepare(`SELECT * FROM hr_leave_entries WHERE id = ? AND tenant_id = ?`)
    .get(id, tenantId) as
      | {
          id: string;
          tenant_id: string;
          employee_id: string;
          leave_type_id: string;
          kind: "accrual" | "consumption" | "adjustment";
          days: number;
          effective_date: string;
          memo: string | null;
        }
      | undefined;
  return r
    ? {
        id: r.id,
        tenantId: r.tenant_id,
        employeeId: r.employee_id,
        leaveTypeId: r.leave_type_id,
        kind: r.kind,
        days: r.days,
        effectiveDate: r.effective_date,
        memo: r.memo,
      }
    : null;
}

/** Net leave balance for an employee (across all types or one type)
 *  up to a given date. */
export function leaveBalance(args: {
  tenantId: string;
  employeeId: string;
  leaveTypeId?: string;
  upToDate?: string;
}): { typeCode: string; typeName: string; balance: number }[] {
  const upTo = args.upToDate ?? nowIso().slice(0, 10);
  const conditions: string[] = ["e.tenant_id = ?", "e.employee_id = ?", "e.effective_date <= ?"];
  const params: unknown[] = [args.tenantId, args.employeeId, upTo];
  if (args.leaveTypeId) { conditions.push("e.leave_type_id = ?"); params.push(args.leaveTypeId); }
  const rows = db.prepare(
    `SELECT t.code as typeCode, t.name as typeName, COALESCE(SUM(e.days), 0) as balance
       FROM hr_leave_types t
       LEFT JOIN hr_leave_entries e ON e.leave_type_id = t.id AND ${conditions.join(" AND ")}
      WHERE t.tenant_id = ?
      GROUP BY t.id
      ORDER BY t.code ASC`,
  ).all(...params, args.tenantId) as Array<{ typeCode: string; typeName: string; balance: number }>;
  return rows;
}

/* ----------------------------- Payroll ----------------------------------- */

export interface PayrollComputeArgs {
  tenantId: string;
  number?: string;
  periodLabel: string;
  fromDate: string;
  toDate: string;
  currency?: string;
  /** Flat tax rate (0..1) — 0.20 = 20 %. Production deployments swap this
   *  for a per-employee tax-template lookup. */
  taxRate?: number;
  /** Flat additional deductions per employee in minor units. */
  flatDeductionsMinor?: number;
  memo?: string;
  createdBy: string;
}

/** Create + compute a payroll run. Generates one line per active
 *  employee whose hire_date ≤ toDate and (termination_date is null or
 *  ≥ fromDate). gross = base salary; tax = round(gross * taxRate);
 *  net = gross − tax − deductions. */
export function computePayrollRun(args: PayrollComputeArgs): PayrollRun {
  const employees = listEmployees(args.tenantId).filter((e) => {
    if (e.hireDate > args.toDate) return false;
    if (e.terminationDate && e.terminationDate < args.fromDate) return false;
    return e.status !== "terminated";
  });
  if (employees.length === 0)
    throw new HrmsError("no-employees", "No active employees in the requested period");

  const id = uuid();
  const now = nowIso();
  const number =
    args.number ?? `PR-${args.periodLabel.replace(/[^A-Z0-9]/gi, "")}-${id.slice(0, 6).toUpperCase()}`;
  const taxRate = args.taxRate ?? 0;
  if (taxRate < 0 || taxRate > 1)
    throw new HrmsError("invalid", "taxRate must be in [0, 1]");
  const flatDeductions = args.flatDeductionsMinor ?? 0;
  const currency = args.currency ?? "USD";

  let totalGross = 0;
  let totalTax = 0;
  let totalNet = 0;

  const tx = db.transaction(() => {
    db.prepare(
      `INSERT INTO hr_payroll_runs
         (id, tenant_id, number, period_label, from_date, to_date, currency, status, gl_journal_id,
          total_gross_minor, total_tax_minor, total_net_minor, memo, created_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'computed', NULL, 0, 0, 0, ?, ?, ?, ?)`,
    ).run(
      id,
      args.tenantId,
      number,
      args.periodLabel,
      args.fromDate,
      args.toDate,
      currency,
      args.memo ?? null,
      args.createdBy,
      now,
      now,
    );
    const stmt = db.prepare(
      `INSERT INTO hr_payroll_lines
         (id, tenant_id, run_id, employee_id, gross_minor, tax_minor, deductions_minor, net_minor, currency, details, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    for (const emp of employees) {
      const gross = emp.baseSalaryMinor;
      const tax = Math.round(gross * taxRate);
      const deductions = flatDeductions;
      const net = gross - tax - deductions;
      const details = {
        employeeNo: emp.employeeNo,
        baseSalaryMinor: emp.baseSalaryMinor,
        taxRate,
        flatDeductionsMinor: deductions,
      };
      stmt.run(
        uuid(),
        args.tenantId,
        id,
        emp.id,
        gross,
        tax,
        deductions,
        net,
        currency,
        JSON.stringify(details),
        now,
      );
      totalGross += gross;
      totalTax += tax;
      totalNet += net;
    }
    db.prepare(
      `UPDATE hr_payroll_runs
         SET total_gross_minor = ?, total_tax_minor = ?, total_net_minor = ?, updated_at = ?
       WHERE id = ?`,
    ).run(totalGross, totalTax, totalNet, now, id);
  });
  try {
    tx();
  } catch (err) {
    if (err instanceof Error && /UNIQUE/.test(err.message))
      throw new HrmsError("duplicate", `Payroll run "${number}" already exists`);
    throw err;
  }
  recordAudit({
    actor: args.createdBy,
    action: "payroll-run.computed",
    resource: "hr-payroll-run",
    recordId: id,
    payload: {
      number,
      periodLabel: args.periodLabel,
      headcount: employees.length,
      totalGrossMinor: totalGross,
      totalNetMinor: totalNet,
    },
  });
  return getPayrollRun(args.tenantId, id)!;
}

export function getPayrollRun(tenantId: string, id: string): PayrollRun | null {
  const row = db.prepare(`SELECT * FROM hr_payroll_runs WHERE id = ? AND tenant_id = ?`)
    .get(id, tenantId) as
      | {
          id: string;
          tenant_id: string;
          number: string;
          period_label: string;
          from_date: string;
          to_date: string;
          currency: string;
          status: PayrollRunStatus;
          gl_journal_id: string | null;
          total_gross_minor: number;
          total_tax_minor: number;
          total_net_minor: number;
          memo: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
        }
      | undefined;
  if (!row) return null;
  const lines = (
    db.prepare(`SELECT * FROM hr_payroll_lines WHERE run_id = ? ORDER BY employee_id ASC`)
      .all(id) as Array<{
        id: string;
        run_id: string;
        employee_id: string;
        gross_minor: number;
        tax_minor: number;
        deductions_minor: number;
        net_minor: number;
        currency: string;
        details: string | null;
      }>
  ).map((r) => ({
    id: r.id,
    runId: r.run_id,
    employeeId: r.employee_id,
    grossMinor: r.gross_minor,
    taxMinor: r.tax_minor,
    deductionsMinor: r.deductions_minor,
    netMinor: r.net_minor,
    currency: r.currency,
    details: (() => {
      try { return JSON.parse(r.details ?? "{}") as Record<string, unknown>; } catch { return {}; }
    })(),
  }));
  return {
    id: row.id,
    tenantId: row.tenant_id,
    number: row.number,
    periodLabel: row.period_label,
    fromDate: row.from_date,
    toDate: row.to_date,
    currency: row.currency,
    status: row.status,
    glJournalId: row.gl_journal_id,
    totalGrossMinor: row.total_gross_minor,
    totalTaxMinor: row.total_tax_minor,
    totalNetMinor: row.total_net_minor,
    memo: row.memo,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lines,
  };
}

export function listPayrollRuns(tenantId: string, status?: PayrollRunStatus): PayrollRun[] {
  const rows = status
    ? (db.prepare(
        `SELECT id FROM hr_payroll_runs WHERE tenant_id = ? AND status = ? ORDER BY from_date DESC`,
      ).all(tenantId, status) as Array<{ id: string }>)
    : (db.prepare(`SELECT id FROM hr_payroll_runs WHERE tenant_id = ? ORDER BY from_date DESC`)
        .all(tenantId) as Array<{ id: string }>);
  return rows.map((r) => getPayrollRun(tenantId, r.id)!).filter(Boolean);
}

export interface PostPayrollArgs {
  tenantId: string;
  id: string;
  /** GL accounts: salaryExpense (debit), taxLiability (credit),
   *  deductionsLiability (credit), payrollPayable (credit). */
  salaryExpenseAccountId: string;
  taxLiabilityAccountId: string;
  deductionsLiabilityAccountId?: string;
  payrollPayableAccountId: string;
  postingDate?: string;
  postedBy: string;
}

export function postPayrollRun(args: PostPayrollArgs): PayrollRun {
  const run = getPayrollRun(args.tenantId, args.id);
  if (!run) throw new HrmsError("not-found", "Payroll run not found");
  if (run.status === "posted") return run;
  if (run.status === "cancelled")
    throw new HrmsError("conflict", "Cannot post a cancelled run");
  const totalDeductions = run.lines.reduce((n, l) => n + l.deductionsMinor, 0);

  const lines: JournalLineInput[] = [];
  if (run.totalGrossMinor > 0) {
    lines.push({
      accountId: args.salaryExpenseAccountId,
      side: "debit",
      amountMinor: run.totalGrossMinor,
      memo: `Salary expense ${run.periodLabel}`,
    });
  }
  if (run.totalTaxMinor > 0) {
    lines.push({
      accountId: args.taxLiabilityAccountId,
      side: "credit",
      amountMinor: run.totalTaxMinor,
      memo: `Tax withholding ${run.periodLabel}`,
    });
  }
  if (totalDeductions > 0) {
    if (!args.deductionsLiabilityAccountId)
      throw new HrmsError(
        "missing-account",
        "deductionsLiabilityAccountId is required when run has deductions",
      );
    lines.push({
      accountId: args.deductionsLiabilityAccountId,
      side: "credit",
      amountMinor: totalDeductions,
      memo: `Deductions ${run.periodLabel}`,
    });
  }
  if (run.totalNetMinor > 0) {
    lines.push({
      accountId: args.payrollPayableAccountId,
      side: "credit",
      amountMinor: run.totalNetMinor,
      memo: `Payroll payable ${run.periodLabel}`,
    });
  }
  if (lines.length < 2)
    throw new HrmsError("zero-amount", "Payroll run has no postable amounts");

  const journal = postJournal({
    tenantId: run.tenantId,
    number: `PR-J-${run.number}`,
    postingDate: args.postingDate ?? run.toDate,
    memo: `Payroll ${run.periodLabel}`,
    sourceResource: "hr.payroll-run",
    sourceRecordId: run.id,
    idempotencyKey: `payroll-run:${run.id}:post`,
    currency: run.currency,
    lines,
    createdBy: args.postedBy,
  });

  db.prepare(
    `UPDATE hr_payroll_runs SET status = 'posted', gl_journal_id = ?, updated_at = ? WHERE id = ?`,
  ).run(journal.id, nowIso(), run.id);
  recordAudit({
    actor: args.postedBy,
    action: "payroll-run.posted",
    resource: "hr-payroll-run",
    recordId: run.id,
    payload: { number: run.number, journalId: journal.id },
  });
  return getPayrollRun(args.tenantId, args.id)!;
}

export function cancelPayrollRun(tenantId: string, id: string, by: string): PayrollRun {
  const run = getPayrollRun(tenantId, id);
  if (!run) throw new HrmsError("not-found", "Payroll run not found");
  if (run.status === "posted")
    throw new HrmsError("conflict", "Cannot cancel a posted run; reverse the GL journal first");
  if (run.status === "cancelled") return run;
  db.prepare(
    `UPDATE hr_payroll_runs SET status = 'cancelled', updated_at = ? WHERE id = ?`,
  ).run(nowIso(), id);
  recordAudit({
    actor: by,
    action: "payroll-run.cancelled",
    resource: "hr-payroll-run",
    recordId: id,
  });
  return getPayrollRun(tenantId, id)!;
}
