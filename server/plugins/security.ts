import type { NitroApp } from "nitropack";
import EndeavourSecurity from "~~/server/utils/security/endeavourSecurity";

export default defineNitroPlugin((nitroApp: NitroApp) => {
  const security = new EndeavourSecurity(process.env.APPLICATION_NAME as string)
  globalThis.authenticator = security;
  globalThis.guard = security;
});
