import type { NitroApp } from "nitropack";
import { Server as Engine } from "engine.io";
import { defineEventHandler } from "h3";

export default defineNitroPlugin((nitroApp: NitroApp) => {
  const engine = new Engine();

  socketServer.bind(engine);

  socketServer.on("connection", (socket) => {
    console.log("socket connected", socket.id);
    socket.on("disconnect", () => {
      console.log("socket disconnected", socket.id);
    });

    socket.on("hello", () => {
      console.log("============= hello ============", socket.id);
    });


    socket.on("joinRoom", (room, user) => {
      console.log("===================== Attempting to join room")
      socket.join(room);
      console.log("User " + user + " joined room " + room);
      // server.to(room).emit("join", {
      //   from_id: user.id,
      //   from_name: user.name,
      //   system: true,
      //   content: `${user.name ?? user.id} joined the room`,
      // });
    });

    socket.on("leaveRoom", (room, user) => {
      socket.leave(room);
      socketServer.to(room).emit("leave", {
        from_id: user.id,
        from_name: user.name,
        system: true,
        content: `${user.name ?? user.id} left the room`,
      });
    });

    socket.on("message", (room, message) => {
      console.log(`[Socket.io] message received to room ${room}`);
      socketServer.to(room).emit("message", message);
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
        },
      },
    })
  );
});
