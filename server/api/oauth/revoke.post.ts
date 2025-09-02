import {oathTokenRequestSchema, type OauthTokenRequest} from "~~/models/oauth.token.request.schema";
import {authenticator} from "~~/server/services/auth/authenticator";

defineRouteMeta({
  openAPI: {
    tags: ["auth", "smartlife"],
    description: "Revoke authentication token",
    requestBody: {
      description: "Credentials",
      content: {
        "application/x-www-form-urlencoded": {
          schema: {
            type: "object",
            properties: {
              "token": {type: "string", description: "Token"},
              "client_id": {type: "string", description: "Client ID"},
              "client_secret": {type: "string", description: "Client Secret"},
            },
            required: ["client_id", "client_secret"] as const,
          }
        },
      }
    },
    responses: {
      200: { description: "OK" }
    }
  },
});

export default defineEventHandler(async (event) => {
  console.log("revoke token");
  const data: OauthTokenRequest = await readValidatedBody(event, oathTokenRequestSchema.parse);
  return await authenticator.revokeToken(data.token!);
});
