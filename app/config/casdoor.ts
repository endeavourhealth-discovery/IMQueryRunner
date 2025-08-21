import type { SdkConfig } from "casdoor-js-sdk/lib/cjs/sdk";

export const sdkConfig: SdkConfig = {
  serverUrl: process.env.CASDOOR_URL!,
  clientId: process.env.CASDOOR_CLIENT_ID!,
  organizationName: "casbin",
  appName: "QueryRunner",
  redirectPath: "/callback",
};
