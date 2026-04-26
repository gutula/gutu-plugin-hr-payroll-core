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
};

// Re-export the lib API so other plugins can `import` from
// "@gutu-plugin/hr-payroll-core".
export * from "./lib";
