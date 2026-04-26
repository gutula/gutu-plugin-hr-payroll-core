/** HRMS REST API.
 *
 *  Routes:
 *    Employees:
 *      GET   /employees              ?status=
 *      GET   /employees/:id
 *      POST  /employees
 *      PATCH /employees/:id
 *
 *    Attendance:
 *      POST  /attendance
 *      GET   /attendance             ?employeeId=&from=&to=
 *
 *    Leave:
 *      GET   /leave-types
 *      POST  /leave-types
 *      POST  /leave-entries
 *      GET   /leave-balance/:employeeId   ?upTo=&type=
 *
 *    Payroll:
 *      GET   /payroll-runs           ?status=
 *      GET   /payroll-runs/:id
 *      POST  /payroll-runs           (compute)
 *      POST  /payroll-runs/:id/post  (post to GL)
 *      POST  /payroll-runs/:id/cancel
 */

import { Hono } from "@gutu-host";
import { requireAuth, currentUser } from "@gutu-host";
import { getTenantContext } from "@gutu-host";
import {
  HrmsError,
  cancelPayrollRun,
  computePayrollRun,
  createEmployee,
  createLeaveType,
  getEmployee,
  getPayrollRun,
  leaveBalance,
  listAttendance,
  listEmployees,
  listLeaveTypes,
  listPayrollRuns,
  postPayrollRun,
  recordAttendance,
  recordLeave,
  updateEmployee,
} from "@gutu-plugin/hr-payroll-core";

export const hrmsRoutes = new Hono();
hrmsRoutes.use("*", requireAuth);

function tenantId(): string {
  return getTenantContext()?.tenantId ?? "default";
}

function handle(err: unknown, c: Parameters<Parameters<typeof hrmsRoutes.get>[1]>[0]) {
  if (err instanceof HrmsError) return c.json({ error: err.message, code: err.code }, 400);
  throw err;
}

/* --- Employees ---------------------------------------------------------- */

hrmsRoutes.get("/employees", (c) =>
  c.json({
    rows: listEmployees(tenantId(), (c.req.query("status") as never) ?? undefined),
  }),
);

hrmsRoutes.get("/employees/:id", (c) => {
  const e = getEmployee(tenantId(), c.req.param("id"));
  if (!e) return c.json({ error: "not found" }, 404);
  return c.json(e);
});

hrmsRoutes.post("/employees", async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  const user = currentUser(c);
  try {
    const e = createEmployee({
      tenantId: tenantId(),
      employeeNo: String(body.employeeNo ?? ""),
      firstName: String(body.firstName ?? ""),
      lastName: String(body.lastName ?? ""),
      email: typeof body.email === "string" ? body.email : undefined,
      department: typeof body.department === "string" ? body.department : undefined,
      designation: typeof body.designation === "string" ? body.designation : undefined,
      hireDate: String(body.hireDate ?? new Date().toISOString().slice(0, 10)),
      baseSalaryMinor: typeof body.baseSalaryMinor === "number" ? body.baseSalaryMinor : 0,
      currency: typeof body.currency === "string" ? body.currency : undefined,
      bankAccount: typeof body.bankAccount === "string" ? body.bankAccount : undefined,
      createdBy: user.email,
    });
    return c.json(e, 201);
  } catch (err) {
    return handle(err, c) as never;
  }
});

hrmsRoutes.patch("/employees/:id", async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as never;
  const e = updateEmployee(tenantId(), c.req.param("id"), body);
  if (!e) return c.json({ error: "not found" }, 404);
  return c.json(e);
});

/* --- Attendance --------------------------------------------------------- */

hrmsRoutes.post("/attendance", async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  try {
    const a = recordAttendance({
      tenantId: tenantId(),
      employeeId: String(body.employeeId ?? ""),
      date: String(body.date ?? ""),
      checkIn: typeof body.checkIn === "string" ? body.checkIn : undefined,
      checkOut: typeof body.checkOut === "string" ? body.checkOut : undefined,
      status: (body.status as never) ?? undefined,
      hours: typeof body.hours === "number" ? body.hours : undefined,
      memo: typeof body.memo === "string" ? body.memo : undefined,
    });
    return c.json(a, 201);
  } catch (err) {
    return handle(err, c) as never;
  }
});

hrmsRoutes.get("/attendance", (c) =>
  c.json({
    rows: listAttendance({
      tenantId: tenantId(),
      employeeId: c.req.query("employeeId") ?? undefined,
      fromDate: c.req.query("from") ?? undefined,
      toDate: c.req.query("to") ?? undefined,
    }),
  }),
);

/* --- Leave -------------------------------------------------------------- */

hrmsRoutes.get("/leave-types", (c) => c.json({ rows: listLeaveTypes(tenantId()) }));

hrmsRoutes.post("/leave-types", async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  try {
    const lt = createLeaveType({
      tenantId: tenantId(),
      code: String(body.code ?? ""),
      name: String(body.name ?? ""),
      annualDays: typeof body.annualDays === "number" ? body.annualDays : undefined,
      paid: body.paid !== false,
    });
    return c.json(lt, 201);
  } catch (err) {
    return handle(err, c) as never;
  }
});

hrmsRoutes.post("/leave-entries", async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  const user = currentUser(c);
  try {
    const e = recordLeave({
      tenantId: tenantId(),
      employeeId: String(body.employeeId ?? ""),
      leaveTypeId: String(body.leaveTypeId ?? ""),
      kind: (body.kind as never) ?? "consumption",
      days: Number(body.days ?? 0),
      effectiveDate: String(body.effectiveDate ?? ""),
      memo: typeof body.memo === "string" ? body.memo : undefined,
      createdBy: user.email,
    });
    return c.json(e, 201);
  } catch (err) {
    return handle(err, c) as never;
  }
});

hrmsRoutes.get("/leave-balance/:employeeId", (c) => {
  return c.json({
    rows: leaveBalance({
      tenantId: tenantId(),
      employeeId: c.req.param("employeeId"),
      leaveTypeId: c.req.query("type") ?? undefined,
      upToDate: c.req.query("upTo") ?? undefined,
    }),
  });
});

/* --- Payroll ------------------------------------------------------------ */

hrmsRoutes.get("/payroll-runs", (c) =>
  c.json({
    rows: listPayrollRuns(tenantId(), (c.req.query("status") as never) ?? undefined),
  }),
);

hrmsRoutes.get("/payroll-runs/:id", (c) => {
  const p = getPayrollRun(tenantId(), c.req.param("id"));
  if (!p) return c.json({ error: "not found" }, 404);
  return c.json(p);
});

hrmsRoutes.post("/payroll-runs", async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  const user = currentUser(c);
  try {
    const p = computePayrollRun({
      tenantId: tenantId(),
      number: typeof body.number === "string" ? body.number : undefined,
      periodLabel: String(body.periodLabel ?? ""),
      fromDate: String(body.fromDate ?? ""),
      toDate: String(body.toDate ?? ""),
      currency: typeof body.currency === "string" ? body.currency : undefined,
      taxRate: typeof body.taxRate === "number" ? body.taxRate : undefined,
      flatDeductionsMinor: typeof body.flatDeductionsMinor === "number" ? body.flatDeductionsMinor : undefined,
      memo: typeof body.memo === "string" ? body.memo : undefined,
      createdBy: user.email,
    });
    return c.json(p, 201);
  } catch (err) {
    return handle(err, c) as never;
  }
});

hrmsRoutes.post("/payroll-runs/:id/post", async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
  const user = currentUser(c);
  try {
    const p = postPayrollRun({
      tenantId: tenantId(),
      id: c.req.param("id"),
      salaryExpenseAccountId: String(body.salaryExpenseAccountId ?? ""),
      taxLiabilityAccountId: String(body.taxLiabilityAccountId ?? ""),
      deductionsLiabilityAccountId: typeof body.deductionsLiabilityAccountId === "string" ? body.deductionsLiabilityAccountId : undefined,
      payrollPayableAccountId: String(body.payrollPayableAccountId ?? ""),
      postingDate: typeof body.postingDate === "string" ? body.postingDate : undefined,
      postedBy: user.email,
    });
    return c.json(p);
  } catch (err) {
    return handle(err, c) as never;
  }
});

hrmsRoutes.post("/payroll-runs/:id/cancel", (c) => {
  const user = currentUser(c);
  try {
    return c.json(cancelPayrollRun(tenantId(), c.req.param("id"), user.email));
  } catch (err) {
    return handle(err, c) as never;
  }
});
