import { FetchError } from "ofetch";

export default defineNuxtPlugin(nuxtApp => {
  const handleError = async (error: unknown) => {
    let status: number | undefined;
    if (error instanceof FetchError) {
      status = error.status;
    } else if (error && typeof error === "object" && "statusCode" in error && typeof error.statusCode === "number") {
      status = error.statusCode;
    } else if (error && typeof error === "object" && "status" in error && typeof error.status === "number") {
      status = error.status;
    }

    switch (status) {
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
