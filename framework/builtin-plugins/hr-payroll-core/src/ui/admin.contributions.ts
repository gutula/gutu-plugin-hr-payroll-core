import {
  defineAdminNav,
  defineCommand,
  definePage,
  defineWorkspace,
  type AdminContributionRegistry
} from "@platform/admin-contracts";

import { BusinessAdminPage } from "./admin/main.page";

export const adminContributions: Pick<AdminContributionRegistry, "workspaces" | "nav" | "pages" | "commands"> = {
  workspaces: [
    defineWorkspace({
      id: "hr",
      label: "HR & Payroll",
      icon: "users",
      description: "Workforce lifecycle, leave posture, and payroll operations.",
      permission: "hr.employees.read",
      homePath: "/admin/business/hr",
      quickActions: ["hr-payroll-core.open.control-room"]
    })
  ],
  nav: [
    defineAdminNav({
      workspace: "hr",
      group: "control-room",
      items: [
        {
          id: "hr-payroll-core.overview",
          label: "Control Room",
          icon: "users",
          to: "/admin/business/hr",
          permission: "hr.employees.read"
        }
      ]
    })
  ],
  pages: [
    definePage({
      id: "hr-payroll-core.page",
      kind: "dashboard",
      route: "/admin/business/hr",
      label: "HR & Payroll Control Room",
      workspace: "hr",
      group: "control-room",
      permission: "hr.employees.read",
      component: BusinessAdminPage
    })
  ],
  commands: [
    defineCommand({
      id: "hr-payroll-core.open.control-room",
      label: "Open HR & Payroll Core",
      permission: "hr.employees.read",
      href: "/admin/business/hr",
      keywords: ["hr & payroll core","hr & payroll","business"]
    })
  ]
};
