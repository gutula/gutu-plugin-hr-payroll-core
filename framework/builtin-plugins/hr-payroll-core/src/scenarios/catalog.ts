export const scenarioDefinitions = [
  {
    "id": "employee-onboarding",
    "owningPlugin": "hr-payroll-core",
    "workflowId": "hr-payroll-lifecycle",
    "actionIds": [
      "hr.employees.onboard",
      "hr.payroll.process",
      "hr.leave.approve",
      "hr.employees.hold",
      "hr.employees.release",
      "hr.employees.amend",
      "hr.employees.reverse"
    ],
    "downstreamTargets": {
      "create": [],
      "advance": [
        "traceability.links.record"
      ],
      "reconcile": [
        "accounting.billing.post",
        "traceability.reconciliation.queue"
      ]
    }
  },
  {
    "id": "leave-approval",
    "owningPlugin": "hr-payroll-core",
    "workflowId": "hr-payroll-lifecycle",
    "actionIds": [
      "hr.employees.onboard",
      "hr.payroll.process",
      "hr.leave.approve",
      "hr.employees.hold",
      "hr.employees.release",
      "hr.employees.amend",
      "hr.employees.reverse"
    ],
    "downstreamTargets": {
      "create": [],
      "advance": [
        "traceability.links.record"
      ],
      "reconcile": [
        "accounting.billing.post",
        "traceability.reconciliation.queue"
      ]
    }
  },
  {
    "id": "payroll-processing",
    "owningPlugin": "hr-payroll-core",
    "workflowId": "hr-payroll-lifecycle",
    "actionIds": [
      "hr.employees.onboard",
      "hr.payroll.process",
      "hr.leave.approve",
      "hr.employees.hold",
      "hr.employees.release",
      "hr.employees.amend",
      "hr.employees.reverse"
    ],
    "downstreamTargets": {
      "create": [],
      "advance": [
        "traceability.links.record"
      ],
      "reconcile": [
        "accounting.billing.post",
        "traceability.reconciliation.queue"
      ]
    }
  },
  {
    "id": "expense-claim-reimbursement",
    "owningPlugin": "hr-payroll-core",
    "workflowId": "hr-payroll-lifecycle",
    "actionIds": [
      "hr.employees.onboard",
      "hr.payroll.process",
      "hr.leave.approve",
      "hr.employees.hold",
      "hr.employees.release",
      "hr.employees.amend",
      "hr.employees.reverse"
    ],
    "downstreamTargets": {
      "create": [],
      "advance": [
        "traceability.links.record"
      ],
      "reconcile": [
        "accounting.billing.post",
        "traceability.reconciliation.queue"
      ]
    }
  },
  {
    "id": "off-cycle-payroll",
    "owningPlugin": "hr-payroll-core",
    "workflowId": "hr-payroll-lifecycle",
    "actionIds": [
      "hr.employees.onboard",
      "hr.payroll.process",
      "hr.leave.approve",
      "hr.employees.hold",
      "hr.employees.release",
      "hr.employees.amend",
      "hr.employees.reverse"
    ],
    "downstreamTargets": {
      "create": [],
      "advance": [
        "traceability.links.record"
      ],
      "reconcile": [
        "accounting.billing.post",
        "traceability.reconciliation.queue"
      ]
    }
  }
] as const;
