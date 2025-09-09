import type Authenticator from "~/utils/authentication/authenticator";
import AuthenticatorCasdoor from "~/utils/authentication/authenticator.casdoor";

export const uiAuth: Authenticator = new AuthenticatorCasdoor();
