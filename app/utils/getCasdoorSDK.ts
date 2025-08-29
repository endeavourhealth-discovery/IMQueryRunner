import Sdk from "casdoor-js-sdk";
import type { SdkConfig } from "casdoor-js-sdk/lib/cjs/sdk";

export default function () {
  const config = useRuntimeConfig();
  const sdkConfig: SdkConfig = {
    serverUrl: config.public.casdoorUrl,
    clientId: config.public.casdoorClientId,
    organizationName: "casbin",
    appName: "QueryRunner",
    redirectPath: "/callback",
  };

  const CasdoorSDK = new Sdk(sdkConfig);
  return CasdoorSDK;
}
