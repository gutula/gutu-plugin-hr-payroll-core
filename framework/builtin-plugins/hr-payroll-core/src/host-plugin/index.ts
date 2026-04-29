/** Host-plugin contribution for hr-payroll-core.
 *
 *  Mounts at /api/<routes> via the shell's plugin loader. */
import type { HostPlugin } from "@gutu-host/plugin-contract";

import { hrmsRoutes } from "./routes/hrms";


export const hostPlugin: HostPlugin = {
  id: "hr-payroll-core",
  version: "1.0.0",
  dependsOn: ["accounting-core"],
  
  routes: [
    { mountPath: "/hrms", router: hrmsRoutes }
  ],
  resources: [
    "hr-payroll.advance",
    "hr-payroll.appraisal",
    "hr-payroll.attendance",
    "hr-payroll.department",
    "hr-payroll.designation",
    "hr-payroll.employee",
    "hr-payroll.expense-claim",
    "hr-payroll.holiday-list",
    "hr-payroll.job-requisition",
    "hr-payroll.leave-application",
    "hr-payroll.leave-balance",
    "hr-payroll.leave-type",
    "hr-payroll.offboarding",
    "hr-payroll.onboarding",
    "hr-payroll.payroll",
    "hr-payroll.salary-component",
    "hr-payroll.salary-slip",
    "hr-payroll.salary-structure",
    "hr-payroll.shift",
    "hr-payroll.training-event",
  ],
};

// Re-export the lib API so other plugins can `import` from
// "@gutu-plugin/hr-payroll-core".
export * from "./lib";
