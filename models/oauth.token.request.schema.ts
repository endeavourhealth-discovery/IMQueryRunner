import { z } from "zod";

export const oathTokenRequestSchema = z.object({
  grant_type: z.string().optional(),
  client_id: z.string(),
  client_secret: z.string(),
  token: z.string().optional(),
});

export type OauthTokenRequest = z.infer<typeof oathTokenRequestSchema>;
