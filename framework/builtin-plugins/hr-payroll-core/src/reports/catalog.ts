export const reportDefinitions = [
  {
    "id": "hr-payroll-core.report.01",
    "label": "Payroll Register",
    "owningPlugin": "hr-payroll-core",
    "source": "erpnext-parity",
    "exceptionQueues": [
      "payroll-lock-review",
      "retro-pay-adjustments",
      "leave-balance-corrections",
      "payout-failure-review"
    ]
  },
  {
    "id": "hr-payroll-core.report.02",
    "label": "Salary Register",
    "owningPlugin": "hr-payroll-core",
    "source": "erpnext-parity",
    "exceptionQueues": [
      "payroll-lock-review",
      "retro-pay-adjustments",
      "leave-balance-corrections",
      "payout-failure-review"
    ]
  },
  {
    "id": "hr-payroll-core.report.03",
    "label": "Leave Ledger",
    "owningPlugin": "hr-payroll-core",
    "source": "erpnext-parity",
    "exceptionQueues": [
      "payroll-lock-review",
      "retro-pay-adjustments",
      "leave-balance-corrections",
      "payout-failure-review"
    ]
  },
  {
    "id": "hr-payroll-core.report.04",
    "label": "Expense Claim Summary",
    "owningPlugin": "hr-payroll-core",
    "source": "erpnext-parity",
    "exceptionQueues": [
      "payroll-lock-review",
      "retro-pay-adjustments",
      "leave-balance-corrections",
      "payout-failure-review"
    ]
  },
  {
    "id": "hr-payroll-core.report.05",
    "label": "Attendance Summary",
    "owningPlugin": "hr-payroll-core",
    "source": "erpnext-parity",
    "exceptionQueues": [
      "payroll-lock-review",
      "retro-pay-adjustments",
      "leave-balance-corrections",
      "payout-failure-review"
    ]
  }
] as const;
