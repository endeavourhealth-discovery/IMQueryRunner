import { FetchError } from "ofetch";

export default defineNuxtPlugin(nuxtApp => {
  const getStatus = (error: unknown): number | undefined => {
    if (error instanceof FetchError) {
      return error.status;
    }
    if (error && typeof error === "object" && "statusCode" in error && typeof error.statusCode === "number") {
      return error.statusCode;
    }
    if (error && typeof error === "object" && "status" in error && typeof error.status === "number") {
      return error.status;
    }
    return undefined;
  };

  nuxtApp.hook("vue:error", async error => {
    const status = getStatus(error);
    if (status === 401) {
      await clearError();
      await nuxtApp.runWithContext(() => useAuth().login());
      return;
    }
    console.error(error);
  });
  nuxtApp.hook("app:error", async error => {
    const status = getStatus(error);
    if (status === 401) {
      await clearError();
      await nuxtApp.runWithContext(() => useAuth().login());
      return;
    }
    console.error(error);
  });
});
