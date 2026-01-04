import type { NitroApp } from "nitropack";

export default defineNitroPlugin((nitroApp: NitroApp) => {
  globalThis.security = new EndeavourSecurity("IMQueryRunner");
});
