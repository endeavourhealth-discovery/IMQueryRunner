import Authenticator from "~~/server/utils/security/auth/auth.base";
import type Guard from "~~/server/utils/security/guard/guard.base";
import {type User} from "~~/models/User";

export default class EndeavourSecurity extends Authenticator implements Guard {
  private readonly application: string;
  constructor(application: string) {
    super();
    this.application = application;
  }

  async getLoginUrl(redirectUri: string, state: string): Promise<string> {
    return await $fetch(`${process.env.AUTH_URL}/api/authn/getLoginUrl`, {
      query: {
        application: this.application,
        redirectUri: redirectUri,
        state: state
      }
    }) as any
  }

  async getTokensFromCodeInternal(code: string, redirectUri: string): Promise<{ accessToken: string; refreshToken?: string }> {
    return await $fetch(`${process.env.AUTH_URL}/api/authn/getTokensFromCode`, {
      query: {
        application: this.application,
        code: code,
        redirectUri: redirectUri
      }
    }) as any
  }

  async getUserInternal(accessToken: string): Promise<User> {
    return await $fetch(`${process.env.AUTH_URL}/api/authn/getUser`,{
      headers: {
        "Authorization": `Bearer ${accessToken}`
      },
      query: {
        application: this.application
      }
    }) as any
  }

  async introspect(accessToken?: string, refreshToken?: string): Promise<void> {
    return await $fetch(`${process.env.AUTH_URL}/api/authn/introspect`, {
      query: {
        application: this.application,
        accessToken: accessToken,
        refreshToken: refreshToken
      }
    }) as any
  }

  async revokeTokens(accessToken?: string, refreshToken?: string): Promise<void> {
    return await $fetch(`${process.env.AUTH_URL}/api/authn/revokeTokens`, {
      query: {
        application: this.application,
        accessToken: accessToken,
        refreshToken: refreshToken
      }
    }) as any
  }

  async hasPermission(accessToken: string, object: string, action: string): Promise<boolean> {
    return await $fetch(`${process.env.AUTH_URL}/api/authz/hasPermission`, {
      headers: {
        "Authorization": `Bearer ${accessToken}`
      },
      query: {
        application: this.application,
        object: object,
        action: action
      }
    }) as any
  }
}