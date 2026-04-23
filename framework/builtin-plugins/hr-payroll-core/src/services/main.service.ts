import {
  createBusinessDomainStateStore,
  createBusinessOrchestrationState,
  createBusinessPluginService,
  type BusinessAdvancePrimaryRecordInput,
  type BusinessCreatePrimaryRecordInput,
  type BusinessFailPendingDownstreamItemInput,
  type BusinessReconcilePrimaryRecordInput,
  type BusinessReplayDeadLetterInput,
  type BusinessResolvePendingDownstreamItemInput
} from "@platform/business-runtime";

import { type ExceptionRecord, type PrimaryRecord, type SecondaryRecord } from "../model";

export type CreatePrimaryRecordInput = BusinessCreatePrimaryRecordInput;
export type AdvancePrimaryRecordInput = BusinessAdvancePrimaryRecordInput;
export type ReconcilePrimaryRecordInput = BusinessReconcilePrimaryRecordInput;
export type ResolvePendingDownstreamItemInput = BusinessResolvePendingDownstreamItemInput;
export type FailPendingDownstreamItemInput = BusinessFailPendingDownstreamItemInput;
export type ReplayDeadLetterInput = BusinessReplayDeadLetterInput;

function seedState() {
  return {
    primaryRecords: [
      {
        id: "hr-payroll-core:seed",
        tenantId: "tenant-platform",
        title: "HR & Payroll Core Seed Record",
        counterpartyId: "party:seed",
        companyId: "company:primary",
        branchId: "branch:head-office",
        recordState: "active",
        approvalState: "approved",
        postingState: "unposted",
        fulfillmentState: "none",
        amountMinor: 125000,
        currencyCode: "USD",
        revisionNo: 1,
        reasonCode: null,
        effectiveAt: "2026-04-23T00:00:00.000Z",
        correlationId: "hr-payroll-core:seed",
        processId: "hr-payroll-lifecycle:seed",
        upstreamRefs: [],
        downstreamRefs: [],
        updatedAt: "2026-04-23T00:00:00.000Z"
      }
    ] satisfies PrimaryRecord[],
    secondaryRecords: [] satisfies SecondaryRecord[],
    exceptionRecords: [] satisfies ExceptionRecord[],
    orchestration: createBusinessOrchestrationState()
  };
}

const store = createBusinessDomainStateStore({
  pluginId: "hr-payroll-core",
  sqlite: {
    primaryTable: "hr_payroll_core_primary_records",
    secondaryTable: "hr_payroll_core_secondary_records",
    exceptionTable: "hr_payroll_core_exception_records",
    dbFileName: "business-runtime.sqlite"
  },
  postgres: {
    schemaName: "hr_payroll_core"
  },
  seedStateFactory: seedState
});

const service = createBusinessPluginService({
  pluginId: "hr-payroll-core",
  displayName: "HR & Payroll Core",
  primaryResourceId: "hr.employees",
  secondaryResourceId: "hr.payroll-runs",
  exceptionResourceId: "hr.leave-state",
  createEvent: "hr.employee-onboarded.v1",
  advanceEvent: "hr.payroll-processed.v1",
  reconcileEvent: "hr.leave-approved.v1",
  projectionJobId: "hr.projections.refresh",
  reconciliationJobId: "hr.reconciliation.run",
  advanceActionLabel: "Process Payroll Run",
  orchestrationTargets: {
  "create": [],
  "advance": [
    "traceability.links.record"
  ],
  "reconcile": [
    "accounting.billing.post",
    "traceability.reconciliation.queue"
  ]
},
  store
});

export const {
  listPrimaryRecords,
  listSecondaryRecords,
  listExceptionRecords,
  listPublishedMessages,
  listPendingDownstreamItems,
  listDeadLetters,
  listProjectionRecords,
  getBusinessOverview,
  createPrimaryRecord,
  advancePrimaryRecord,
  reconcilePrimaryRecord,
  resolvePendingDownstreamItem,
  failPendingDownstreamItem,
  replayDeadLetter
} = service;
