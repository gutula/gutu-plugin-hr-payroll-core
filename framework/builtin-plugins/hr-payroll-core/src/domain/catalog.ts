export const domainCatalog = {
  "erpnextModules": [
    "HR",
    "Payroll",
    "Projects",
    "Manufacturing"
  ],
  "erpnextDoctypes": [
    "Employee",
    "Payroll Entry",
    "Salary Slip",
    "Salary Structure",
    "Leave Application",
    "Expense Claim",
    "Shift Assignment",
    "Attendance"
  ],
  "ownedEntities": [
    "Employee",
    "Attendance",
    "Leave Ledger",
    "Payroll Run",
    "Salary Structure",
    "Expense Claim",
    "Loan or Advance"
  ],
  "reports": [
    "Payroll Register",
    "Salary Register",
    "Leave Ledger",
    "Expense Claim Summary",
    "Attendance Summary"
  ],
  "exceptionQueues": [
    "payroll-lock-review",
    "retro-pay-adjustments",
    "leave-balance-corrections",
    "payout-failure-review"
  ],
  "operationalScenarios": [
    "employee-onboarding",
    "leave-approval",
    "payroll-processing",
    "expense-claim-reimbursement",
    "off-cycle-payroll"
  ],
  "settingsSurfaces": [
    "Payroll Settings",
    "Salary Structure",
    "Leave Type",
    "Shift Type"
  ],
  "edgeCases": [
    "retro salary changes",
    "off-cycle payroll",
    "unpaid leave correction",
    "bank payout failure",
    "payroll reversal and rerun"
  ]
} as const;
