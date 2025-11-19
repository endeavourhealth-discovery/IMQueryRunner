import type { QueryRequest } from "~~/models/AutoGen";

export const useQueue = () => {
  const cancel = (queueItemId: string) => {
    return useFetch(`/api/queue/query/${queueItemId}/cancel`, {
      method: "post",
    });
  };

  const queue = (queryRequest: QueryRequest) => {
    return useFetch("/api/queue/query", {
      method: "post",
      body: queryRequest,
    });
  };

  const requeue = (queueItemId: string) => {
    return useFetch("/api/queue/query/requeue", {
      params: { queueItemId: queueItemId },
    });
  };

  const getResults = (
    queueItemId: string,
    page: number = 1,
    size: number = 50
  ) => {
    return useFetch("/api/queue/query/results", {
      params: { queueItemId: queueItemId, page: page, size: size },
    });
  };

  const getStatus = () => {
    return useFetch("/api/queue/status");
  };

  const getQueueItems = () => {
    return useFetch("/api/queue");
  };

  return { cancel, queue, requeue, getResults, getStatus, getQueueItems };
};
