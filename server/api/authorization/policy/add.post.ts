import z from "zod";
import { Resource, Action } from "~~/models/AutoGen";
import { userSchema } from "~~/models/User";
import Logger from "~~/shared/logger";

const policyRequestSchema = z.object({
  resource: z.enum(Resource),
  action: z.enum(Action),
  policyUser: userSchema,
});

export default defineEventHandler(async (event) => {
  const LOG = Logger("server/api/authorization/policy/add");
  await globalThis.authenticator.requireUser(event);
  const user = globalThis.authenticator.getUser(event);
  await globalThis.guard.requirePermission(
    user!,
    Resource.POLICY,
    Action.WRITE
  );
  const { resource, action, policyUser } = await readValidatedBody(
    event,
    policyRequestSchema.parse
  );
  await globalThis.guard.addPolicy(policyUser, resource, action);
});
