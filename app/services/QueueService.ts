import type { QueryRequest } from "~~/models/AutoGen";

const QueueService = {
  async cancel(queueItemId: string) {
    return useFetch(`/api/queue/query/${queueItemId}/cancel`, {
      method: "post",
    });
  },

  async queue(queryRequest: QueryRequest) {
    return useFetch("/api/queue/query", {
      method: "post",
      body: queryRequest,
    });
  },

  async requeue(queueItemId: string) {
    return useFetch("/api/queue/query/requeue", {
      params: { queueItemId: queueItemId },
    });
  },

  async getResults(queueItemId: string, page: number = 1, size: number = 50) {
    return useFetch<{ results: string[]; totalCount: number }>(
      "/api/queue/query/results",
      {
        params: { queueItemId: queueItemId, page: page, size: size },
      }
    ).data.value;
  },

  async getStatus() {
    return useFetch("/api/queue/status");
  },

  async getQueueItems() {
    return useFetch("/api/queue");
  },
};
export default Object.freeze(QueueService);
