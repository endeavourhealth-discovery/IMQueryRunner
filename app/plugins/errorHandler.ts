import { getErrorMessage, getErrorStatus, getErrorStatusText } from "~/helpers/errorDeconstructor";
import { ErrorCode } from "~~/enums";

export default defineNuxtPlugin(nuxtApp => {
  nuxtApp.hook("vue:error", async error => {
    const status = getErrorStatus(error);
    if (status === 401) {
      await clearError();
      await nuxtApp.runWithContext(() => useAuth().login());
      return;
    }
    showError(
      createError({
        status: status ?? 500,
        statusText: getErrorStatusText(error) ?? ErrorCode.InternalClientError,
        message: getErrorMessage(error) ?? "An unexpected client error has occurred"
      })
    );
  });
  nuxtApp.hook("app:error", async error => {
    const status = getErrorStatus(error);
    if (status === 401) {
      await clearError();
      await nuxtApp.runWithContext(() => useAuth().login());
      return;
    }
    createError({
      status: status ?? 500,
      statusText: getErrorStatusText(error) ?? ErrorCode.InternalClientError,
      message: getErrorMessage(error) ?? "An unexpected client error has occurred"
    });
  });
});
