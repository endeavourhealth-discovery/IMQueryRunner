import { type BugReport, type RoleRequest } from "@endeavour/vue-library";

const API_URL = `${useRuntimeConfig().public.imapiUrl}workflow/private`;

const WorkflowService = {
  async createBugReport(sessionId: string, bugReport: BugReport): Promise<void> {
    await $fetch(API_URL + "/createBugReport", {
      headers: { cookie: `session_id=${sessionId}` },
      body: bugReport,
      method: "POST"
    });
  },

  async createRoleRequest(sessionId: string, roleRequest: RoleRequest): Promise<void> {
    await $fetch(API_URL + "/createRoleRequest", {
      headers: { cookie: `session_id=${sessionId}` },
      body: roleRequest,
      method: "POST"
    });
  }
};

if (process.env.NODE_ENV !== "test") Object.freeze(WorkflowService);

export default WorkflowService;
