export function emitQueueUpdate(userId: string) {
  globalThis.io.to(`queue:user:${userId}`).emit("queueUpdate");
}
