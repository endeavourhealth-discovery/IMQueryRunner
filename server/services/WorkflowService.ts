import { type BugReport, type RoleRequest } from "@endeavour/vue-library";

const API_URL = `${useRuntimeConfig().public.imapiUrl}workflow/private`;

const WorkflowService = {
  async createBugReport(accessToken: string, bugReport: BugReport): Promise<void> {
    await $fetch(API_URL + "/createBugReport", {
      headers: { Authorization: `Bearer ${accessToken}` },
      body: bugReport,
      method: "POST"
    });
  },

  async createRoleRequest(accessToken: string, roleRequest: RoleRequest): Promise<void> {
    await $fetch(API_URL + "/createRoleRequest", {
      headers: { Authorization: `Bearer ${accessToken}` },
      body: roleRequest,
      method: "POST"
    });
  }
};

if (process.env.NODE_ENV !== "test") Object.freeze(WorkflowService);

export default WorkflowService;
