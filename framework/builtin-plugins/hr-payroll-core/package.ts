import { definePackage } from "@platform/kernel";

export default definePackage({
  "id": "hr-payroll-core",
  "kind": "plugin",
  "version": "0.1.0",
  "contractVersion": "1.0.0",
  "sourceRepo": "gutu-plugin-hr-payroll-core",
  "displayName": "HR & Payroll Core",
  "domainGroup": "Operational Data",
  "defaultCategory": {
    "id": "business",
    "label": "Business",
    "subcategoryId": "hr_payroll",
    "subcategoryLabel": "HR & Payroll"
  },
  "description": "Employee lifecycle, attendance posture, leave and claims, payroll processing, and payout exception truth with governed accounting handoff.",
  "extends": [],
  "dependsOn": [
    "auth-core",
    "org-tenant-core",
    "role-policy-core",
    "audit-core",
    "workflow-core",
    "traceability-core",
    "accounting-core"
  ],
  "dependencyContracts": [
    {
      "packageId": "auth-core",
      "class": "required",
      "rationale": "Required for HR & Payroll Core to keep its boundary governed and explicit."
    },
    {
      "packageId": "org-tenant-core",
      "class": "required",
      "rationale": "Required for HR & Payroll Core to keep its boundary governed and explicit."
    },
    {
      "packageId": "role-policy-core",
      "class": "required",
      "rationale": "Required for HR & Payroll Core to keep its boundary governed and explicit."
    },
    {
      "packageId": "audit-core",
      "class": "required",
      "rationale": "Required for HR & Payroll Core to keep its boundary governed and explicit."
    },
    {
      "packageId": "workflow-core",
      "class": "required",
      "rationale": "Required for HR & Payroll Core to keep its boundary governed and explicit."
    },
    {
      "packageId": "traceability-core",
      "class": "required",
      "rationale": "Required for HR & Payroll Core to keep its boundary governed and explicit."
    },
    {
      "packageId": "accounting-core",
      "class": "required",
      "rationale": "Required for HR & Payroll Core to keep its boundary governed and explicit."
    }
  ],
  "optionalWith": [],
  "conflictsWith": [],
  "providesCapabilities": [
    "hr.employees",
    "hr.payroll-runs",
    "hr.leave-state"
  ],
  "requestedCapabilities": [
    "ui.register.admin",
    "api.rest.mount",
    "data.write.hr",
    "events.publish.hr"
  ],
  "ownsData": [
    "hr.employees",
    "hr.payroll-runs",
    "hr.leave-state",
    "hr.claims"
  ],
  "extendsData": [],
  "publicCommands": [
    "hr.employees.onboard",
    "hr.payroll.process",
    "hr.leave.approve"
  ],
  "publicQueries": [
    "hr.workforce-summary",
    "hr.payroll-summary"
  ],
  "publicEvents": [
    "hr.employee-onboarded.v1",
    "hr.payroll-processed.v1",
    "hr.leave-approved.v1"
  ],
  "domainCatalog": {
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
  },
  "slotClaims": [],
  "trustTier": "first-party",
  "reviewTier": "R1",
  "isolationProfile": "same-process-trusted",
  "compatibility": {
    "framework": "^0.1.0",
    "runtime": "bun>=1.3.12",
    "db": [
      "postgres",
      "sqlite"
    ]
  }
});
