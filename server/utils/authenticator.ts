import AuthenticatorCasdoor from "~~/server/utils/auth/authenticator.casdoor";
import type Authenticator from "~~/server/utils/auth/authenticator.base";

export const authenticator: Authenticator = new AuthenticatorCasdoor();
