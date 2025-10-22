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
  username: z.string(),
});

export default defineEventHandler(async (event) => {
  const LOG = Logger("server/api/authorization/policy/add");
  await globalThis.authenticator.requireUser(event);
  const user = globalThis.authenticator.getUser(event);
  await globalThis.guard.checkPermissions(
    user,
    event.path,
    AccessRequest.WRITE
  );
  const { dataSource, accessRequest, username } = await readValidatedBody(
    event,
    policyRequestSchema.parse
  );
  await globalThis.guard.addPolicy(user!, dataSource, accessRequest);
});
