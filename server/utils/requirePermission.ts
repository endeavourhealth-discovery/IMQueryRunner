import { ErrorCode } from "~~/enums";

import type { User } from "@endeavour/vue-library/models";

import type { H3Event } from "h3";

import { casdoorEnforce } from "./casdoor";
import { toEnforceSubject } from "./enforceSubject";

export type EnforceResource = "JOB";
export type EnforceAction = "EXECUTE";

/** Requires a session and that the Casdoor enforcer permits the user to perform `action` on `resource`. Returns the user. */
export async function requirePermission(event: H3Event, resource: EnforceResource, action: EnforceAction): Promise<User> {
  const { enforcerId } = useRuntimeConfig(event).casdoor;
  if (!enforcerId) throw createError({ statusCode: 500, statusMessage: "Misconfigured", message: "CASDOOR_ENFORCER_ID is not set" });

  const user = await getCurrentUser(event);
  if (!(await casdoorEnforce(enforcerId, toEnforceSubject(user), resource, action))) {
    throw createError({ statusCode: 403, statusMessage: ErrorCode.AuthorisationError, message: `You do not have permission to ${action} ${resource}` });
  }
  return user;
}
