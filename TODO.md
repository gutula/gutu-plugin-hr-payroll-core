# HR & Payroll Core TODO

**Maturity Tier:** `Hardened`

## Shipped Now

- Exports 7 governed actions: `hr.employees.onboard`, `hr.payroll.process`, `hr.leave.approve`, `hr.employees.hold`, `hr.employees.release`, `hr.employees.amend`, `hr.employees.reverse`.
- Owns 3 resource contracts: `hr.employees`, `hr.payroll-runs`, `hr.leave-state`.
- Publishes 2 job definitions with explicit queue and retry policy metadata.
- Publishes 1 workflow definition with state-machine descriptions and mandatory steps.
- Adds richer admin workspace contributions on top of the base UI surface.
- Ships explicit SQL migration or rollback helpers alongside the domain model.
- Documents 7 owned entity surface(s): `Employee`, `Attendance`, `Leave Ledger`, `Payroll Run`, `Salary Structure`, `Expense Claim`, and more.
- Carries 5 report surface(s) and 4 exception queue(s) for operator parity and reconciliation visibility.
- Tracks ERPNext reference parity against module(s): `HR`, `Payroll`, `Projects`, `Manufacturing`.
- Operational scenario matrix includes `employee-onboarding`, `leave-approval`, `payroll-processing`, `expense-claim-reimbursement`, `off-cycle-payroll`.
- Governs 4 settings or policy surface(s) for operator control and rollout safety.

## Current Gaps

- No additional gaps were identified beyond the plugin’s stated non-goals.

## Recommended Next

- Deepen retro, rerun, and payout-failure handling before payroll moves beyond scaffold coverage.
- Add stronger attendance, benefits, and sensitive-data governance as the HR surface hardens.
- Broaden lifecycle coverage with deeper orchestration, reconciliation, and operator tooling where the business flow requires it.
- Add more explicit domain events or follow-up job surfaces when downstream systems need tighter coupling.
- Convert more ERP parity references into first-class runtime handlers where needed, starting from `Employee`, `Payroll Entry`, `Salary Slip`.

## Later / Optional

- Outbound connectors, richer analytics, or portal-facing experiences once the core domain contracts harden.
