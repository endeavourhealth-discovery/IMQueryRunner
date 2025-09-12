import {
  oathTokenRequestSchema,
  type OauthTokenRequest,
} from "~~/models/oauth.token.request.schema";

defineRouteMeta({
  openAPI: {
    tags: ["auth", "smartlife"],
    description: "Revoke authentication token",
    parameters: [
      {
        name: "authorization",
        in: "header",
        description: "Bearer token",
        required: true,
        schema: {
          type: "string",
        },
      } as const,
    ],
    requestBody: {
      description: "Credentials",
      content: {
        "application/x-www-form-urlencoded": {
          schema: {
            type: "object",
            properties: {
              token: { type: "string", description: "Token" },
              client_id: { type: "string", description: "Client ID" },
              client_secret: { type: "string", description: "Client Secret" },
            },
            required: ["client_id", "client_secret"] as const,
          },
        },
      },
    },
    responses: {
      200: { description: "OK" },
    },
  },
});

export default defineEventHandler(async (event) => {
  console.log("revoke token");
  await requireUserSession(event);
  const userSession = await getUserSession(event);
  if (userSession.secure?.casdoorAccessToken) {
    const token = await globalThis.casdoor.getToken(
      userSession.secure.casdoorAccessToken
    );
    await globalThis.casdoor.deleteToken(token.data.data);
  }
  return;
});
