import { Server as IOServer } from "socket.io";

declare global {
  var io: IOServer;
  interface GlobalThis {
    io: IOServer;
  }
}
