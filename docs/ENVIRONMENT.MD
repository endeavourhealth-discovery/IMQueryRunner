# IMQueryRunner environment variables

IMQueryRunner is a Nuxt 4 app with a Nitro server. It reads configuration in two different ways, and the difference matters when you deploy:

- **Build time:** `nuxt.config.ts` reads `process.env` when Nuxt **builds** (or when `nuxt dev` starts) and stores the result as *runtime config defaults* inside the build output. Changing the plain variable afterwards, on a server that is already built, has **no effect**.
- **Run time:** Server code reads `process.env` directly each time the server starts, so these can be set on the running server.

Anything in the build-time table can also be overridden on the running server with the Nuxt-specific `NUXT_…` variable shown next to it. Those are read at run time and win over the value baked into the build. If you do not want to rebuild per environment (or do not want secrets baked into the build output), set the `NUXT_…` names at run time and leave the plain names unset at build time.

> Never commit real values. `.env` is git-ignored. Keep secrets in your deployment's secret store.

## Build time (read by `nuxt.config.ts`)

| Variable                    | Required     | Purpose                                                                                                                                                                                                                              | Run-time override                                                                                         |
|-----------------------------|--------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------|
| `CASDOOR_URL`               | yes          | Base URL of Casdoor. **Must be `https`** (an http→https redirect drops the `Authorization` header). Also used for the discovery document `${CASDOOR_URL}/.well-known/openid-configuration` and the "My profile" link in the browser. | `NUXT_CASDOOR_URL`, `NUXT_OAUTH_OIDC_OPENID_CONFIG` (the *full* discovery URL), `NUXT_PUBLIC_CASDOOR_URL` |
| `CASDOOR_ORGANISATION_NAME` | yes          | Casdoor organisation that owns the users.                                                                                                                                                                                            | `NUXT_CASDOOR_ORGANISATION`                                                                               |
| `CASDOOR_CLIENT_ID`         | yes          | Client ID of the IMQueryRunner application in Casdoor. Used for user sign-in and for Casdoor management calls.                                                                                                                       | `NUXT_CASDOOR_CLIENT_ID`, `NUXT_OAUTH_OIDC_CLIENT_ID`                                                     |
| `CASDOOR_CLIENT_SECRET`     | yes (secret) | Client secret of that application.                                                                                                                                                                                                   | `NUXT_CASDOOR_CLIENT_SECRET`, `NUXT_OAUTH_OIDC_CLIENT_SECRET`                                             |
| `CASDOOR_ENFORCER_ID`       | yes          | Casdoor casbin enforcer (`owner/name`) used for authorisation checks, e.g. `Endeavour/TestEnforcer`.                                                                                                                                 | `NUXT_CASDOOR_ENFORCER_ID`                                                                                |
| `CASDOOR_REDIRECT_URL`      | no           | Full sign-in callback URL, only needed if a proxy hides the app's public address. Defaults to `<origin>/auth/oidc`.                                                                                                                  | `NUXT_OAUTH_OIDC_REDIRECT_URL`                                                                            |
| `IMAPI_URL`                 | yes          | Base URL of the IMAPI API, **including the `api/` segment and a trailing slash**, e.g. `https://host/api/`. Paths such as `entity/protected/summary` are appended directly.                                                          | `NUXT_PUBLIC_IMAPI_URL`                                                                                   |
| `IM_DIRECTORY_URL`          | no           | Base URL of IMDirectory, with a trailing slash (e.g. `https://host/`). Used to build "open in Directory" links of the form `<url>#/directory/folder/<iri>`.                                                                          | `NUXT_PUBLIC_IM_DIRECTORY_URL`                                                                            |

Two of these appear twice in the Nuxt config (the Casdoor client ID and secret), once for sign-in and once for management calls, which is why each has two override names. Set both if you override at run time.

## Run time (read by the server)

| Variable                     | Required     | Purpose                                                                                                                                                                                                                                              |
|------------------------------|--------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `NUXT_SESSION_PASSWORD`      | yes (secret) | Key used to encrypt the session cookie. At least 32 characters. If it changes, everyone is signed out.                                                                                                                                               |
| `COMPASS_URL`                | yes          | MySQL connection URI for the job and results database, e.g. `mysql://user:password@host:3306/compass`. The server refuses to start without it. Also used by the `drizzle-kit` commands.                                                              |
| `RABBITMQ_URL`               | yes          | RabbitMQ connection URI for the query job queue.                                                                                                                                                                                                     |
| `CLIENT_ID`, `CLIENT_SECRET` | no (secret)  | Casdoor application credentials the background worker uses to call IMAPI (client-credentials). If unset, the worker uses `CASDOOR_CLIENT_ID` / `CASDOOR_CLIENT_SECRET`. Set these only if the worker should authenticate as a different application. |
| `LOG_LEVEL`                  | no           | Log level. Default `info`.                                                                                                                                                                                                                           |
| `QUERY_KILL_TIMEOUT`         | no           | Seconds after which the `kill-queries` task stops a long-running query. The task does nothing when unset.                                                                                                                                            |
| `NODE_ENV`                   | no           | Standard. `production` for deployed builds.                                                                                                                                                                                                          |

## Tooling and tests only

| Variable                                                            | Used by                | Purpose                                                                                           |
|---------------------------------------------------------------------|------------------------|---------------------------------------------------------------------------------------------------|
| `SONAR_TOKEN`                                                       | `pnpm sonar`           | SonarCloud token.                                                                                 |
| `BASE_URL`, `TEST_USERNAME`, `TEST_PASSWORD`                        | Gauge end-to-end tests | App URL and a test account. `env/default/default.properties` sets `APP_URL` for the same purpose. |
| `headless_chrome`, `screenshot_on_failure`, `gauge_screenshots_dir` | Gauge                  | Browser and screenshot behaviour (set by the `test:e2e:ci` scripts).                              |
| `CI`                                                                | Playwright             | Enables retries and single-worker mode in CI.                                                     |

## Casdoor application settings

In Casdoor, the IMQueryRunner application needs:

- **Redirect URL:** `<this app's origin>/auth/oidc`, e.g. `http://localhost:3000/auth/oidc` for development.
- **Grant types:** Authorization Code and Refresh Token; also Client Credentials if the worker uses this application's credentials.

