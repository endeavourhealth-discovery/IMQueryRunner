import {object, string} from "zod/v4/mini";
import {createError, getValidatedQuery, H3Event, type InferEventInput, type ValidateFunction} from "h3";

const loginUrlSchema = object({
  redirectUri: string(),
  state: string()
});

const loginSchema = object({
  code: string(),
  state: string()
});

const permissionSchema = object({
  object: string(),
  action: string()
});

async function getQueryParams<T, Event extends H3Event = H3Event, _T = InferEventInput<"query", Event, T>>(event: Event, validate: ValidateFunction<_T>): Promise<_T> {
  try {
    return await getValidatedQuery(event, validate)
  } catch (e) {
    console.error(e)
    throw createError({statusCode: 400, statusMessage: 'missing parameter(s)'});
  }
}

export default defineEventHandler(async (event): Promise<any> => {
  const sessionId = getCookie(event, "session_id");
  const EndSecHost = process.env.ENDEAVOUR_SECURITY_HOST;
  const EndSecApp = process.env.ENDEAVOUR_SECURITY_APPLICATION;
  const method = event.method;
  const name = getRouterParam(event, "EndSecApi")
  const req = event?.node?.req
  const clientIp = req?.headers['x-real-ip']?.[0] || req?.headers['x-forwarded-for']?.[0] || req?.socket?.remoteAddress || "UNKNOWN"


  if (method == "POST") {
    switch (name) {
      case "hasPermission": {
        const permissionParams = await getQueryParams(event, permissionSchema.parse)
        return await $fetch<string>(`${EndSecHost}/api/${EndSecApp}/authz/hasPermission`, {
          headers: {"x-client-ip": clientIp},
          query: {
            sessionId: sessionId,
            object: permissionParams.object,
            action: permissionParams.action
          }
        });
      }
    }
  } else if (method == "GET") {
    switch (name) {
      case "getLoginUrl": {
        const loginParams = await getQueryParams(event, loginUrlSchema.parse)
        return await $fetch<string>(`${EndSecHost}/api/${EndSecApp}/authn/getLoginUrl`, {
          query:
            {
              redirectUri: loginParams.redirectUri,
              state: loginParams.state,
            }
        })
      }
      case "login": {
        const loginParams = await getQueryParams(event, loginSchema.parse)
        const { sessionId, user } = await $fetch<string>(`${EndSecHost}/api/${EndSecApp}/authn/login`, {
          headers: {"x-client-ip": clientIp },
          query:
            {
              code: loginParams.code,
              state: loginParams.state,
            }
        }) as any
        setCookie(event, "session_id", sessionId, {httpOnly: true, maxAge: 60 * 60 * 24 * 30})
        return user;
      }
      case "logout": {
        await $fetch<string>(`${EndSecHost}/api/${EndSecApp}/authn/logout`, {
          query:
            {
              sessionId: sessionId,
            }
        })
        setCookie(event, "session_id", "", {httpOnly: true, maxAge: 0})
        return;
      }
      case "getUser": {
        return await $fetch<string>(`${EndSecHost}/api/${EndSecApp}/authn/getUser`, {
          headers: {"x-client-ip": clientIp },
          query:
            {
              sessionId: sessionId,
            }
        })
      }
    }
  }

  throw createError({status: 400, message: `API ${method} [${name}] not found`});
});
