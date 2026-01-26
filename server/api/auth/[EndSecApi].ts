import {object, string} from "zod/v4/mini";
import {createError, getValidatedQuery, H3Event, type InferEventInput, type ValidateFunction} from "h3";
import { clearError } from "nuxt/app";

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

  if (method == "POST") {
    switch (name) {
      case "hasPermission": {
        const permissionParams = await getQueryParams(event, permissionSchema.parse)
          const allowed = await $fetch<string>(`${EndSecHost}/api/${EndSecApp}/authz/hasPermission`, {
            query: {
              sessionId: sessionId,
              object: permissionParams.object,
              action: permissionParams.action
            }
          })
        return allowed;
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
