export const useAuth = () => {
  const cancel = (queueItemId: string) => {
    return useFetch(`/api/queue/query/${queueItemId}/cancel`, {
      method: "post",
    });
  };

  const logout = () => {
    $fetch("/api/auth/logout");
  };

  const getLoginUrl = (reqUrlOrigin: string, toPath: string) => {
    return useFetch("/api/auth/loginUrl", {
      method: "get",
      params: {
        origin: reqUrlOrigin,
        redirectUrl: toPath,
      },
    });
  };

  const authenticate = (code: string) => {
    return useFetch("/api/auth/authenticate", { query: { code: code } });
  };

  const getAccessToken = (
    casdoorUrl: string,
    clientId: string,
    clientSecret: string
  ) => {
    $fetch(`${casdoorUrl}/api/login/oauth/access_token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });
  };

  const hasPermission = (object: string, action: string) => {
    return useFetch("/api/public/auth/hasPermission", {
      method: "POST",
      body: {
        object: object,
        action: action,
      },
    });
  };

  return {
    cancel,
    logout,
    getLoginUrl,
    authenticate,
    getAccessToken,
    hasPermission,
  };
};
