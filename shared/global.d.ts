import { Server as IOServer } from "socket.io";
import EndeavourSecurity from "~~/server/utils/endeavour.security";

declare global {
  var io: IOServer;
  var security: EndeavourSecurity;
  interface GlobalThis {
    io: IOServer;
    security: EndeavourSecurity;
  }
}
