import { FetchError } from "ofetch";

export default defineNuxtPlugin(nuxtApp => {
  let handling = false;

  window.addEventListener("unhandledrejection", async event => {
    const error = event.reason;

    if (handling) {
      return;
    }

    if (!(error instanceof FetchError)) {
      return;
    }

    event.preventDefault();
    handling = true;

    try {
      if (error.status === 401) {
        await clearError();
        await nuxtApp.runWithContext(() => useAuth().login());
        return;
      }

      showError({
        statusCode: error.status ?? 500,
        statusMessage: error.statusText || "Server Error",
        fatal: true
      });
    } finally {
      handling = false;
    }
  });
});
