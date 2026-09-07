import { FetchError } from "ofetch";

export default defineNuxtPlugin(nuxtApp => {
  const handleError = async (error: unknown) => {
    if (!(error instanceof FetchError)) {
      return;
    }

    switch (error.status) {
      case 401: {
        await clearError();
        await globalThis.uiGuard.login();
        break;
      }
      default:
        console.error(error);
        return;
    }
  };
  nuxtApp.hook("vue:error", async error => {
    void handleError(error);
  });
  nuxtApp.hook("app:error", error => {
    void handleError(error);
  });
});
