import Authenticator from "~~/server/utils/security/authentication/authenticator.base";
import AuthenticatorCasdoor from "~~/server/utils/security/authentication/authenticator.casdoor";

export const apiAuth: Authenticator = new AuthenticatorCasdoor();
