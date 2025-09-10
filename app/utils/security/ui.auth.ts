import type Authenticator from "~/utils/security/authentication/authenticator";
import AuthenticatorCasdoor from "~/utils/security/authentication/authenticator.casdoor";

export const uiAuth: Authenticator = new AuthenticatorCasdoor();
