import {
  advancePrimaryRecord,
  createPrimaryRecord,
  reconcilePrimaryRecord,
  type AdvancePrimaryRecordInput,
  type CreatePrimaryRecordInput,
  type ReconcilePrimaryRecordInput
} from "../services/main.service";

export const businessFlowDefinitions = [
  {
    "id": "hr.employees.onboard",
    "label": "Onboard Employee",
    "phase": "create",
    "methodName": "onboardEmployee"
  },
  {
    "id": "hr.payroll.process",
    "label": "Process Payroll Run",
    "phase": "advance",
    "methodName": "processPayrollRun"
  },
  {
    "id": "hr.leave.approve",
    "label": "Approve Leave",
    "phase": "reconcile",
    "methodName": "approveLeave"
  }
] as const;

export async function onboardEmployee(input: CreatePrimaryRecordInput) {
  return createPrimaryRecord(input);
}

export async function processPayrollRun(input: AdvancePrimaryRecordInput) {
  return advancePrimaryRecord(input);
}

export async function approveLeave(input: ReconcilePrimaryRecordInput) {
  return reconcilePrimaryRecord(input);
}
