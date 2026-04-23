export const exceptionQueueDefinitions = [
  {
    "id": "payroll-lock-review",
    "label": "Payroll Lock Review",
    "severity": "medium",
    "owner": "hr-operator",
    "reconciliationJobId": "hr.reconciliation.run"
  },
  {
    "id": "retro-pay-adjustments",
    "label": "Retro Pay Adjustments",
    "severity": "medium",
    "owner": "hr-operator",
    "reconciliationJobId": "hr.reconciliation.run"
  },
  {
    "id": "leave-balance-corrections",
    "label": "Leave Balance Corrections",
    "severity": "medium",
    "owner": "hr-operator",
    "reconciliationJobId": "hr.reconciliation.run"
  },
  {
    "id": "payout-failure-review",
    "label": "Payout Failure Review",
    "severity": "medium",
    "owner": "hr-operator",
    "reconciliationJobId": "hr.reconciliation.run"
  }
] as const;
