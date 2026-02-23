import {getIp} from "~~/server/helpers/getIp";

defineRouteMeta({
  openAPI: {
    tags: ["query"],
    description: "Get missing arguments for given query request",
    parameters: [
      {name: "session_id", description: "User session id", in: "cookie"},
    ],
    requestBody: {
      description: "Query Request object",
      content: {
        "application/json": {
          description: "Query Request object",
          schema: {type: "object"},
        },
      },
    },
  },
});
export default defineEventHandler(async (event): Promise<any> => {
  const sessionId = getCookie(event, "session_id")!
  const ip = getIp(event);
  const queryRequest = await readBody(event)
  return await imapi.findRequestMissingArguments(sessionId, ip, queryRequest);
});
