import type { NitroApp } from "nitropack";
import { SDK } from "casdoor-nodejs-sdk";

export default defineNitroPlugin((nitroApp: NitroApp) => {
  const authConfig = {
    endpoint: process.env.NUXT_PUBLIC_CASDOOR_URL!,
    clientId: process.env.NUXT_PUBLIC_CASDOOR_CLIENT_ID!,
    clientSecret: process.env.NUXT_PUBLIC_CASDOOR_CLIENT_SECRET!,
    certificate: process.env.NUXT_CASDOOR_CERTIFICATE!,
    orgName: "Endeavour",
    appName: "QueryRunner",
  };
  const sdk = new SDK(authConfig);

  globalThis.casdoor = sdk;
});
