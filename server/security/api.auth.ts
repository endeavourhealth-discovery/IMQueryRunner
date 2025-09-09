import AuthenticatorCasdoor from "~~/server/security/authentication/authenticator.casdoor";
import Authenticator from "~~/server/security/authentication/authenticator";

export const apiAuth: Authenticator = new AuthenticatorCasdoor();
