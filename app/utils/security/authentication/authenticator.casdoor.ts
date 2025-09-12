import type {SharedPublicRuntimeConfig} from "#build/types/runtime-config";
import getUserFromTokenCasdoor from "#shared/jwtCasdoor";
import Authenticator from "~/utils/security/authentication/authenticator";
import type {User} from "~~/models/User";

export default class AuthenticatorCasdoor extends Authenticator {
  private baseUrl: string = "";
  private serverUrl: string = "";
  private clientId: string = "";
  private organisation: string = "";

  configure(config: SharedPublicRuntimeConfig) {
    this.baseUrl = config.baseUrl;
    this.serverUrl = config.casdoorUrl;
    this.clientId = config.casdoorClientId;
    this.organisation = config.casdoorOrganisationName;
  }

  override getUserFromToken(token: string): User {
    return getUserFromTokenCasdoor(token);
  }

  async login(successUrl: string, failUrl: string) {
    await navigateTo(`${this.serverUrl}/login/${this.organisation}?redirect_uri=${encodeURIComponent(this.baseUrl + successUrl)}&response_type=token&client_id=${this.clientId}`, {external: true});
  }

  logout(): Promise<void> {
    return Promise.resolve(undefined);
  }
}