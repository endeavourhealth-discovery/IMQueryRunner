import Logger from "#shared/logger";

import { Server as Engine } from "engine.io";
import { createEvent, defineEventHandler } from "h3";
import type { NitroApp } from "nitropack";
import { ServerResponse } from "node:http";
import { Server } from "socket.io";

import { fromCasdoorUser } from "../utils/casdoorUser";

export default defineNitroPlugin((nitroApp: NitroApp) => {
  const LOG = Logger("server/plugins/socket");
  const engine = new Engine();
  const io = new Server();

  globalThis.io = io;
  io.bind(engine);

  io.use(async (socket, next) => {
    try {
      // Reuse the HTTP session: unseal the nuxt-auth-utils cookie from the handshake request
      const event = createEvent(socket.request, new ServerResponse(socket.request));
      const { user } = await requireUserSession(event);
      socket.data.user = fromCasdoorUser(await getCasdoorUser(user.owner, user.name));
      next();
    } catch {
      next(new Error("Unauthorized user."));
    }
  });

  io.on("connection", socket => {
    socket.on("disconnect", () => {});
    socket.on("hello", () => {
      LOG.debug(`============= hello ${socket.id} ============`);
    });
    socket.on("joinRoom", () => {
      socket.join(`queue:user:${socket.data.user.id}`);
    });
    socket.on("leaveRoom", (room, user) => {
      socket.leave(room);
      socket.to(room).emit("leave", {
        from_id: user.id,
        from_name: user.name,
        system: true,
        content: `${user.name ?? user.id} left the room`
      });
    });
    socket.on("message", (room, message) => {
      socket.to(room).emit("message", message);
    });
  });

  nitroApp.router.use(
    "/socket.io/",
    defineEventHandler({
      handler(event: any) {
        engine.handleRequest(event.node.req, event.node.res);
        event._handled = true;
      },
      websocket: {
        open(peer) {
          // @ts-expect-error
          engine.prepare(peer._internal.nodeReq);
          // @ts-expect-error
          engine.onWebSocket(
            // @ts-expect-error
            peer._internal.nodeReq,
            // @ts-expect-error
            peer._internal.nodeReq.socket,
            peer.websocket
          );
        }
      }
    })
  );
});
