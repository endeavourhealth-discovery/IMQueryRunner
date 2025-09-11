import {oathTokenRequestSchema, type OauthTokenRequest} from "~~/models/oauth.token.request.schema";

defineRouteMeta({
  openAPI: {
    tags: ["auth", "smartlife"],
    description: "Get authentication token",
    requestBody: {
      description: "Credentials",
      content: {
        "application/x-www-form-urlencoded": {
          schema: {
            type: "object",
            properties: {
              "client_id": {type: "string", description: "Client ID"},
              "client_secret": {type: "string", description: "Client Secret"},
            },
            required: ["client_id", "client_secret"] as const,
          }
        },
      }
    },
    responses: {
      200: {
        description: "OK",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                "access_token": {type: "string"},
                "token_type": {type: "string"},
                "expires_in": {type: "number"}
              }
            }
          }
        }
      }
    }
  },
});

export default defineEventHandler(async (event) => {
  console.log("get token");
  const data: OauthTokenRequest = await readValidatedBody(event, oathTokenRequestSchema.parse);

  const tokenResponse = await apiAuth.getMachineToken(data.client_id, data.client_secret);

  const {access_token, token_type, expires_in} = tokenResponse

  return {
    success: true,
    token: access_token,
    type: token_type,
    expiresIn: expires_in,
    timestamp: new Date().toISOString()
  }
});
