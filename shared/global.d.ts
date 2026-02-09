import { Server as IOServer } from "socket.io";

declare global {
  var io: IOServer;
  var apiGuard: EndSecApi;
  var uiGuard: EndSecUI;
  interface GlobalThis {
    io: IOServer;
    apiGuard: EndSecApi;
    uiGuard: EndSecUI;
  }
}
