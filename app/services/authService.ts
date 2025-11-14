export class AuthService {
  public async logout() {
    await $fetch("/api/auth/logout");
  }

  public async getLoginUrl(reqUrlOrigin: string, toPath: string) {
    return await useFetch("/api/auth/loginUrl", {
      method: "get",
      params: {
        origin: reqUrlOrigin,
        redirectUrl: toPath,
      },
    });
  }

  public async authenticate(code: string) {
    return await useFetch("/api/auth/authenticate", { query: { code: code } });
  }

  public async getAccessToken(
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
  }

  public async hasPermission(object: string, action: string) {
    return await useFetch("/api/public/auth/hasPermission", {
      method: "POST",
      body: {
        object: object,
        action: action,
      },
    });
  }
}

export const authService = new AuthService();
