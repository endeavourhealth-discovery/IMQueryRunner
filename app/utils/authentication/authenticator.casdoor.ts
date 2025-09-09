import Authenticator from "~/utils/authentication/authenticator";
import type {SharedPublicRuntimeConfig} from "#build/types/runtime-config";
import getUserFromTokenCasdoor from "#shared/jwtCasdoor";
import type {User} from "~~/models";

export default class AuthenticatorCasdoor extends Authenticator {
  private serverUrl: string = "";
  private clientId: string = "";
  private organisation: string = "";

  configure(config: SharedPublicRuntimeConfig) {
    this.serverUrl = config.casdoorUrl;
    this.clientId = config.casdoorClientId;
    this.organisation = config.casdoorOrganisationName;
  }

  override getUserFromToken(token: string): User {
    return getUserFromTokenCasdoor(token);
  }

  async login(successUrl: string, failUrl: string) {
    await navigateTo(`${this.serverUrl}/login/${this.organisation}?redirect_uri=${encodeURIComponent(successUrl)}&response_type=token&client_id=${this.clientId}`, {external: true});
  }

  logout(): Promise<void> {
    return Promise.resolve(undefined);
  }
}