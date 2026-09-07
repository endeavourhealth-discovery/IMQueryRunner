import WorkflowService from "~~/server/services/WorkflowService";

import { Browser, BugReportSchema, OperatingSystem, Severity, Status, TaskModule, TaskState, TaskType } from "@endeavour/vue-library";

defineRouteMeta({
  openAPI: {
    tags: ["bugReport"],
    description: "Submit a bug report",
    parameters: [{ name: "session_id", description: "User session id", in: "cookie" }],
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            additionalProperties: false,
            required: [
              "id",
              "createdBy",
              "type",
              "state",
              "assignedTo",
              "dateCreated",
              "hostUrl",
              "product",
              "version",
              "module",
              "os",
              "browser",
              "severity",
              "status",
              "error",
              "description",
              "reproduceSteps",
              "expectedResult",
              "actualResult"
            ],
            properties: {
              id: {
                type: "string",
                description: "Task IRI reference"
              },
              createdBy: {
                type: "string"
              },
              type: {
                type: "string",
                enum: Object.values(TaskType)
              },
              state: {
                type: "string",
                enum: Object.values(TaskState)
              },
              assignedTo: {
                type: "string"
              },
              dateCreated: {
                type: "string",
                format: "date-time"
              },
              history: {
                type: "array",
                items: {
                  type: "object",
                  additionalProperties: false,
                  required: ["predicate", "originalObject", "newObject", "changeDate", "modifiedBy", "dateTime"],
                  properties: {
                    predicate: {
                      type: "string"
                    },
                    originalObject: {
                      type: "string"
                    },
                    newObject: {
                      type: "string"
                    },
                    changeDate: {
                      type: "string"
                    },
                    modifiedBy: {
                      type: "string"
                    },
                    dateTime: {
                      type: "string"
                    }
                  }
                }
              },
              hostUrl: {
                type: "string",
                format: "uri"
              },

              // BugReportSchema
              product: {
                type: "string"
              },
              version: {
                type: "string"
              },
              module: {
                type: "string",
                enum: Object.values(TaskModule)
              },
              os: {
                type: "string",
                enum: Object.values(OperatingSystem)
              },
              osOther: {
                type: "string"
              },
              browser: {
                type: "string",
                enum: Object.values(Browser)
              },
              browserOther: {
                type: "string"
              },
              severity: {
                type: "string",
                enum: Object.values(Severity)
              },
              status: {
                type: "string",
                enum: Object.values(Status)
              },
              error: {
                type: "string"
              },
              description: {
                type: "string"
              },
              reproduceSteps: {
                type: "string"
              },
              expectedResult: {
                type: "string"
              },
              actualResult: {
                type: "string"
              }
            }
          }
        }
      }
    }
  }
});

export default defineEventHandler(async (event): Promise<void> => {
  const sessionId = getCookie(event, "session_id")!;
  const bugReport = await readBody(event);
  return await WorkflowService.createBugReport(sessionId, bugReport);
});
