const AuthService = {
  async cancel(queueItemId: string) {
    return useFetch(`/api/queue/query/${queueItemId}/cancel`, {
      method: "post",
    });
  },

  async logout() {
    await $fetch("/api/auth/logout");
  },

  async getLoginUrl(
    reqUrlOrigin: string,
    toPath: string,
    server: boolean = false
  ) {
    return useFetch("/api/auth/loginUrl", {
      method: "get",
      params: {
        origin: reqUrlOrigin,
        redirectUrl: toPath,
      },
      server: server,
    });
  },

  async getRegisterUrl(reqUrlOrigin: string, toPath: string) {
    return useFetch("/api/auth/registerUrl", {
      method: "get",
      params: {
        origin: reqUrlOrigin,
        redirectUrl: toPath,
      },
    });
  },

  async authenticate(code: string) {
    return useFetch("/api/auth/authenticate", { query: { code: code } });
  },

  async getAccessToken(
    casdoorUrl: string,
    clientId: string,
    clientSecret: string
  ) {
    await $fetch(`${casdoorUrl}/api/login/oauth/access_token`, {
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
  },

  async hasPermission(object: string, action: string) {
    return useFetch("/api/public/auth/hasPermission", {
      method: "POST",
      body: {
        object: object,
        action: action,
      },
    });
  },

  async getIsLoggedIn() {
    return useFetch("/api/auth/isLoggedIn");
  },
};
export default Object.freeze(AuthService);
