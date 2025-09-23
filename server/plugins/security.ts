import type { NitroApp } from "nitropack";
import Casdoor from "~~/server/utils/security/auth/auth.casdoor";

export default defineNitroPlugin((nitroApp: NitroApp) => {
  globalThis.authenticator = new Casdoor();
  globalThis.guard = new GuardCasbin();
});
