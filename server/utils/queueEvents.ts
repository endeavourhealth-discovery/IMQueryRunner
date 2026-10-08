import type { QueueUpdate } from "~~/models/QueueUpdate";

/**
 * Tells the user's open pages that one of their jobs changed. The page refreshes just that job
 * (or the whole list if it does not have it yet) instead of reloading everything.
 */
export function emitQueueUpdate(userId: string, update?: QueueUpdate) {
  globalThis.io.to(`queue:user:${userId}`).emit("queueUpdate", update);
}
