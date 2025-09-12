import { Server as IOServer } from "socket.io";
import { SDK } from "casdoor-nodejs-sdk";

declare global {
  var io: IOServer;
  var casdoor: SDK;
}
