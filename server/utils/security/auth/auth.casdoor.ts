import Authenticator from "~~/server/utils/security/auth/auth.base";
import {SDK} from "casdoor-nodejs-sdk";
import process from "node:process";
import {deleteCookie, type EventHandlerRequest, type H3Event} from "h3";
import type {Token} from "casdoor-nodejs-sdk/lib/cjs/token";
import type {User} from "~~/models/User";
import Logger from "#shared/logger";

export default class Casdoor extends Authenticator {
  private readonly LOG = Logger("server/utils/security/auth/casdoor")

  private readonly casdoor = new SDK({
    endpoint: process.env.NUXT_PUBLIC_CASDOOR_URL!,
    clientId: process.env.NUXT_PUBLIC_CASDOOR_CLIENT_ID!,
    clientSecret: process.env.NUXT_PUBLIC_CASDOOR_CLIENT_SECRET!,
    certificate: process.env.NUXT_CASDOOR_CERTIFICATE!,
    orgName: "Endeavour",
    appName: "QueryRunner",
  });

  getLoginUrl(origin: string, redirectUrl: string): string {
    const successUrl = `${origin}/callback?redirect=${redirectUrl}`;

    return `${process.env.NUXT_PUBLIC_CASDOOR_URL}/login/${
      process.env.NUXT_PUBLIC_CASDOOR_ORGANISATION_NAME
    }?redirect_uri=${encodeURIComponent(
      successUrl
    )}&response_type=code&client_id=${process.env.NUXT_PUBLIC_CASDOOR_CLIENT_ID}`
  }

  async getTokensFromCodeInternal(code: string): Promise<{ accessToken: string; refreshToken?: string }> {
    const tokens = await this.casdoor.getAuthToken(code);

    return {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token
    }
  }

  getUserInternal(accessToken: string): User {
    const casdoorUser = this.casdoor.parseJwtToken(accessToken);
    return {
      id: casdoorUser.id,
      userName: casdoorUser.name,
      displayName: casdoorUser.displayName,
      email: casdoorUser.email,
      avatar: casdoorUser.avatar
    } as User;
  }
  async revokeTokens(event: H3Event<EventHandlerRequest>, accessToken? :string, refreshToken?: string): Promise<void> {
    if (accessToken && refreshToken)
      await this.casdoor.deleteToken({
        accessToken: accessToken,
        refreshToken: refreshToken,
      } as Token);
    deleteCookie(event, "casdoor_session_id");
  }

  async requireUserInternal(event: H3Event<EventHandlerRequest>, accessToken? :string, refreshToken?: string): Promise<void> {
    if (!accessToken)
      throw createError({ status: 401, message: "Missing access token cookie" });
    const response = await this.casdoor.introspect(accessToken, "access_token");
    if (!response.data.active) {
      await this.logout(event);
      throw createError({ status: 401, message: "Invalid token" });
    } else if (refreshToken) {
      const refreshResponse = await this.casdoor.introspect(
        accessToken,
        "refresh_token"
      );
      if (!refreshResponse.data.active) {
        await this.logout(event);
        throw createError({status: 401, message: "Invalid refresh token"});
      }
      const newTokens = await this.casdoor.refreshToken(refreshToken);
      this.setCookies(event, newTokens.access_token, newTokens.refresh_token);
    }
    const user = this.getUser(event);
    if (!user) throw createError({ status: 401, message: "User not found" });
  }
}