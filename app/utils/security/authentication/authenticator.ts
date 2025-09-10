import type {SharedPublicRuntimeConfig} from "#build/types/runtime-config";
import type {User} from "~~/models";

export default abstract class Authenticator {
  abstract configure(config: SharedPublicRuntimeConfig): void;
  abstract login(successUrl: string, failUrl: string): Promise<void>;
  abstract getUserFromToken(token: string): User;
  isLoggedIn(): boolean {
    return false;
  }
}