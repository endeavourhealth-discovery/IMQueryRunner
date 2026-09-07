import { type BugReport, type RoleRequest } from "@endeavour/vue-library/models";

const API_URL = "api/imapi/workflow";

const WorkflowService = {
  async createBugReport(bugReport: BugReport): Promise<void> {
    bugReport.error = JSON.stringify(bugReport.error);
    return await $fetch<void>(API_URL + "/bugReport", { body: bugReport, method: "POST" });
  },

  async createRoleRequest(roleRequest: RoleRequest): Promise<void> {
    return await $fetch<void>(API_URL + "/roleRequest", { body: roleRequest, method: "POST" });
  }
};

if (process.env.NODE_ENV !== "test") Object.freeze(WorkflowService);

export default WorkflowService;
