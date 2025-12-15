import Authenticator from "~~/server/utils/security/auth/auth.base";
import { SDK } from "casdoor-nodejs-sdk";
import process from "node:process";
import { deleteCookie, type EventHandlerRequest, type H3Event } from "h3";
import type { Token } from "casdoor-nodejs-sdk/lib/cjs/token";
import Logger from "#shared/logger";
import { type User } from "~~/models/User";

export default class Casdoor extends Authenticator {
  private readonly LOG = Logger("server/utils/security/auth/casdoor");

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
    )}&response_type=code&client_id=${
      process.env.NUXT_PUBLIC_CASDOOR_CLIENT_ID
    }`;
  }

  getRegisterUrl(origin: string, redirectUrl: string): string {
    const successUrl = `${origin}/callback?redirect=${redirectUrl}`;

    return `${process.env.NUXT_PUBLIC_CASDOOR_URL}/signup/${
      process.env.NUXT_PUBLIC_CASDOOR_ORGANISATION_NAME
    }?redirect_uri=${encodeURIComponent(
      successUrl
    )}&response_type=code&client_id=${
      process.env.NUXT_PUBLIC_CASDOOR_CLIENT_ID
    }`;
  }

  async getTokensFromCodeInternal(
    code: string
  ): Promise<{ accessToken: string; refreshToken?: string }> {
    const tokens = await this.casdoor.getAuthToken(code);

    return {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
    };
  }

  getUserInternal(accessToken: string): User {
    const casdoorUser = this.casdoor.parseJwtToken(accessToken);
    return {
      id: casdoorUser.id,
      userName: casdoorUser.name,
      firstName: casdoorUser.firstName,
      lastName: casdoorUser.lastName,
      email: casdoorUser.email,
      avatar: casdoorUser.avatar,
      roles: casdoorUser.roles?.map((role) => role.name),
      password: "",
    } as User;
  }

  async revokeTokens(
    event: H3Event<EventHandlerRequest>,
    accessToken?: string,
    refreshToken?: string
  ): Promise<void> {
    if (accessToken && refreshToken)
      await this.casdoor.deleteToken({
        accessToken: accessToken,
        refreshToken: refreshToken,
      } as Token);
    deleteCookie(event, "casdoor_session_id");
  }

  async requireUserInternal(
    event: H3Event<EventHandlerRequest>,
    accessToken?: string,
    refreshToken?: string
  ): Promise<void> {
    if (!accessToken)
      throw createError({
        status: 401,
        message: "Missing access token cookie",
      });

    this.LOG.debug("Introspecting access token");
    const response = await this.casdoor.introspect(accessToken, "access_token");

    this.LOG.debug("Response [" + response.data.active + "]");

    if (!response.data.active) {
      await this.logout(event);
      throw createError({ status: 401, message: "Inactive token" });
    } else if (refreshToken) {
      this.LOG.debug("Introspecting refresh token");
      const refreshResponse = await this.casdoor.introspect(
        refreshToken,
        "refresh_token"
      );

      if (!refreshResponse.data.active) {
        this.LOG.error("Inactive refresh token");
        await this.logout(event);
        throw createError({ status: 401, message: "Invalid refresh token" });
      }
      const newTokens = await this.casdoor.refreshToken(refreshToken);
      this.setCookies(event, newTokens.access_token, newTokens.refresh_token);
    }
    const user = this.getUser(event);
    if (!user) throw createError({ status: 401, message: "User not found" });
  }

  async adminGetUser(userId: string): Promise<User> {
    const casdoorUser = (await this.casdoor.getUser(userId)).data.data;
    return {
      id: casdoorUser.id,
      userName: casdoorUser.name,
      firstName: casdoorUser.firstName,
      lastName: casdoorUser.lastName,
      email: casdoorUser.email,
      avatar: casdoorUser.avatar,
      roles: casdoorUser.roles?.map((role) => role.name),
      password: "",
    } as User;
  }

  async loginWithBearerToken(
    event: H3Event<EventHandlerRequest>
  ): Promise<void> {
    const auth = getHeader(event, "Authorization");
    if (!auth?.startsWith("Bearer")) throw createError("Invalid token");
    const token = auth.substring(7);
    const response = await this.casdoor.introspect(token, "access_token");
    if (response.data.active) {
      this.setCookies(event, token);
    } else throw createError("Invalid token");
  }

  async loginWithSessionId(event: H3Event<EventHandlerRequest>): Promise<void> {
    const casdoor_session_id = getCookie(event, "casdoor_session_id");
    const silentUser = await $fetch<any>(
      process.env.NUXT_PUBLIC_CASDOOR_URL + "/api/get-account",
      {
        headers: {
          cookie: `casdoor_session_id=${casdoor_session_id}`,
        },
      }
    );
    if (silentUser.data.accessToken) {
      this.setCookies(event, silentUser.data.accessToken);
    }
  }
}
