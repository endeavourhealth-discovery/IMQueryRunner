import z from "zod";
import { AccessRequest } from "~~/models/AutoGen";
import Logger from "~~/shared/logger";

const policyRequestSchema = z.object({
  dataSource: z.string(),
  accessRequest: z.enum([
    AccessRequest.DELETE,
    AccessRequest.PUBLISH,
    AccessRequest.READ,
    AccessRequest.WRITE,
  ]),
});

export default defineEventHandler(async (event) => {
  const LOG = Logger("server/api/authorization/policy/remove");
  await globalThis.authenticator.requireUser(event);
  const user = globalThis.authenticator.getUser(event);
  await globalThis.guard.checkPermissions(
    user,
    event.path,
    AccessRequest.DELETE
  );
  const { dataSource, accessRequest } = await readValidatedBody(
    event,
    policyRequestSchema.parse
  );
  await globalThis.guard.removePolicy(user!, dataSource, accessRequest);
});
