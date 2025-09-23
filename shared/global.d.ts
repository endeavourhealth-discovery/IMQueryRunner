import { Server as IOServer } from "socket.io";
import type Guard from "~~/server/utils/security/guard/guard.base";
import type Authenticator from "~~/server/utils/security/auth/auth.base";

declare global {
  var io: IOServer;
  var authenticator: Authenticator;
  var guard: Guard;
  interface GlobalThis {
    io: IOServer;
    authenticator: Authenticator;
    guard: Guard;
  }
}
