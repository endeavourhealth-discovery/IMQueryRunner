import Logger from "#shared/logger";

import { type User } from "@endeavour/vue-library/models";

import { Server as Engine } from "engine.io";
import { defineEventHandler } from "h3";
import type { NitroApp } from "nitropack";
import { Server } from "socket.io";

export default defineNitroPlugin((nitroApp: NitroApp) => {
  const LOG = Logger("server/plugins/socket");
  const engine = new Engine();
  const io = new Server();

  globalThis.io = io;
  io.bind(engine);

  io.use(async (socket, next) => {
    try {
      const sessionId = socket.handshake.headers.cookie
        ?.split(";")
        .find(x => x.trim().startsWith("session_id="))
        ?.split("=")[1];
      const clientIp = socket.handshake.address;
      const EndSecHost = process.env.ENDEAVOUR_SECURITY_HOST;
      const EndSecApp = process.env.ENDEAVOUR_SECURITY_APPLICATION;

      if (!sessionId) return next(new Error("Unauthorized session."));
      socket.data.user = await $fetch<User>(`${EndSecHost}/api/${EndSecApp}/authn/getUser`, {
        headers: { "x-client-ip": clientIp },
        query: {
          sessionId: sessionId
        }
      });
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
