import { describe, expect, it } from "bun:test";

import {
  buildHrPayrollCoreSqliteMigrationSql,
  buildHrPayrollCoreSqliteRollbackSql,
  getHrPayrollCoreSqliteLookupIndexName,
  getHrPayrollCoreSqliteStatusIndexName
} from "../../src/sqlite";

describe("hr-payroll-core sqlite helpers", () => {
  it("creates the business tables and indexes", () => {
    const sql = buildHrPayrollCoreSqliteMigrationSql().join("\n");

    expect(sql).toContain("CREATE TABLE IF NOT EXISTS hr_payroll_core_primary_records");
    expect(sql).toContain("CREATE TABLE IF NOT EXISTS hr_payroll_core_secondary_records");
    expect(sql).toContain("CREATE TABLE IF NOT EXISTS hr_payroll_core_exception_records");
    expect(sql).toContain(getHrPayrollCoreSqliteLookupIndexName("hr_payroll_core_"));
    expect(sql).toContain(getHrPayrollCoreSqliteStatusIndexName("hr_payroll_core_"));
  });

  it("rolls the sqlite tables back safely", () => {
    const sql = buildHrPayrollCoreSqliteRollbackSql({ tablePrefix: "hr_payroll_core_preview_" }).join("\n");
    expect(sql).toContain("DROP TABLE IF EXISTS hr_payroll_core_preview_exception_records");
  });
});
