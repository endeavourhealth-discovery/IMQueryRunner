import { getErrorMessage, getErrorStatus, getErrorStatusText } from "~/helpers/errorDeconstructor";
import { ErrorCode } from "~~/enums";

import { FetchError } from "ofetch";

export default defineNuxtPlugin(nuxtApp => {
  let handling = false;

  window.addEventListener("unhandledrejection", async event => {
    const error = event.reason;

    if (handling) {
      return;
    }

    if (!(error instanceof FetchError)) {
      showError({
        status: getErrorStatus(error) ?? 500,
        statusText: getErrorStatusText(error) ?? ErrorCode.InternalClientError,
        message: getErrorMessage(error) || "Client error",
        fatal: true
      });
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
        status: getErrorStatus(error) ?? 500,
        statusText: getErrorStatusText(error) ?? ErrorCode.InternalClientError,
        message: getErrorMessage(error) || "Server error",
        fatal: true
      });
    } finally {
      handling = false;
    }
  });
});
