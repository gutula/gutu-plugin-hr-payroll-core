import { describe, expect, it } from "bun:test";

import {
  buildHrPayrollCoreMigrationSql,
  buildHrPayrollCoreRollbackSql,
  getHrPayrollCoreLookupIndexName,
  getHrPayrollCoreStatusIndexName
} from "../../src/postgres";

describe("hr-payroll-core postgres helpers", () => {
  it("creates the business tables and indexes", () => {
    const sql = buildHrPayrollCoreMigrationSql().join("\n");

    expect(sql).toContain("CREATE TABLE IF NOT EXISTS hr_payroll_core.primary_records");
    expect(sql).toContain("CREATE TABLE IF NOT EXISTS hr_payroll_core.secondary_records");
    expect(sql).toContain("CREATE TABLE IF NOT EXISTS hr_payroll_core.exception_records");
    expect(sql).toContain(getHrPayrollCoreLookupIndexName());
    expect(sql).toContain(getHrPayrollCoreStatusIndexName());
  });

  it("rolls the schema back safely", () => {
    const sql = buildHrPayrollCoreRollbackSql({ schemaName: "hr_payroll_core_preview", dropSchema: true }).join("\n");
    expect(sql).toContain("DROP TABLE IF EXISTS hr_payroll_core_preview.exception_records");
    expect(sql).toContain("DROP SCHEMA IF EXISTS hr_payroll_core_preview CASCADE");
  });
});
