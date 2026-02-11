defineRouteMeta({
  openAPI: {
    tags: ["query"],
    description: "Get partial entity given property IRIs",
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
  const queryRequest = await readBody(event)
  return await imapi.queryIMSearch(sessionId, queryRequest);
});
