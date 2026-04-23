# HR & Payroll Core Flows

## Happy paths

- `hr.employees.onboard`: Onboard Employee
- `hr.payroll.process`: Process Payroll Run
- `hr.leave.approve`: Approve Leave

## Operational scenario matrix

- `employee-onboarding`
- `leave-approval`
- `payroll-processing`
- `expense-claim-reimbursement`
- `off-cycle-payroll`

## Action-level flows

### `hr.employees.onboard`

Onboard Employee

Permission: `hr.employees.write`

Business purpose: Expose the plugin’s write boundary through a validated, auditable action contract.

Preconditions:

- Caller input must satisfy the action schema exported by the plugin.
- The caller must satisfy the declared permission and any host-level installation constraints.
- Integration should honor the action’s idempotent semantics.

Side effects:

- Mutates or validates state owned by `hr.employees`, `hr.payroll-runs`, `hr.leave-state`.
- May schedule or describe follow-up background work.

Forbidden shortcuts:

- Do not bypass the action contract with undocumented service mutations in application code.
- Do not document extra hooks, retries, or lifecycle semantics unless they are explicitly exported here.


### `hr.payroll.process`

Process Payroll Run

Permission: `hr.payroll.write`

Business purpose: Expose the plugin’s write boundary through a validated, auditable action contract.

Preconditions:

- Caller input must satisfy the action schema exported by the plugin.
- The caller must satisfy the declared permission and any host-level installation constraints.
- Integration should honor the action’s non-idempotent semantics.

Side effects:

- Mutates or validates state owned by `hr.employees`, `hr.payroll-runs`, `hr.leave-state`.
- May schedule or describe follow-up background work.

Forbidden shortcuts:

- Do not bypass the action contract with undocumented service mutations in application code.
- Do not document extra hooks, retries, or lifecycle semantics unless they are explicitly exported here.


### `hr.leave.approve`

Approve Leave

Permission: `hr.leave.write`

Business purpose: Expose the plugin’s write boundary through a validated, auditable action contract.

Preconditions:

- Caller input must satisfy the action schema exported by the plugin.
- The caller must satisfy the declared permission and any host-level installation constraints.
- Integration should honor the action’s non-idempotent semantics.

Side effects:

- Mutates or validates state owned by `hr.employees`, `hr.payroll-runs`, `hr.leave-state`.
- May schedule or describe follow-up background work.

Forbidden shortcuts:

- Do not bypass the action contract with undocumented service mutations in application code.
- Do not document extra hooks, retries, or lifecycle semantics unless they are explicitly exported here.


## Cross-package interactions

- Direct dependencies: `auth-core`, `org-tenant-core`, `role-policy-core`, `audit-core`, `workflow-core`, `traceability-core`, `accounting-core`
- Requested capabilities: `ui.register.admin`, `api.rest.mount`, `data.write.hr`, `events.publish.hr`
- Integration model: Actions+Resources+Jobs+Workflows+UI
- ERPNext doctypes used as parity references: `Employee`, `Payroll Entry`, `Salary Slip`, `Salary Structure`, `Leave Application`, `Expense Claim`, `Shift Assignment`, `Attendance`
- Recovery ownership should stay with the host orchestration layer when the plugin does not explicitly export jobs, workflows, or lifecycle events.
