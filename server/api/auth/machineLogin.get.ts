import { PermissionSchema, User } from "vue-library/models";
import { object, string } from "zod/v4";
import { getIp } from "~~/server/helpers/getIp";
import { getQueryParams } from "~~/server/helpers/getQueryParams";

const machineLoginSchema = object({
  clientId: string(),
  clientSecret: string(),
});

export default defineEventHandler(async (event): Promise<User> => {
  const EndSecHost = process.env.ENDEAVOUR_SECURITY_HOST;
  const EndSecApp = process.env.ENDEAVOUR_SECURITY_APPLICATION;
  const clientIp = getIp(event);

  const machineLoginParams = await getQueryParams(
    event,
    machineLoginSchema.parse,
  );
  return await $fetch<User>(
    `${EndSecHost}/api/${EndSecApp}/authn/machineLogin`,
    {
      headers: { "x-client-ip": clientIp },
      query: {
        clientId: machineLoginParams.clientId,
        clientSecret: machineLoginParams.clientSecret,
      },
    },
  );
});
