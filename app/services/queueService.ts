export class QueueService {
  public async cancel(queueItemId: string) {
    return await useFetch("/api/queue/query/cancel", {
      params: { queueItemId: queueItemId },
    });
  }

  public async delete(queueItemId: string) {
    await useFetch("/api/queue/query/delete", {
      params: { queueItemId: queueItemId },
    });
  }

  public async requeue(queueItemId: string) {
    await useFetch("/api/queue/query/requeue", {
      params: { queueItemId: queueItemId },
    });
  }

  public getResults(queueItemId: string) {
    return useFetch("/api/queue/query/results", {
      params: { queueItemId: queueItemId },
    });
  }

  public async queue(query: string) {
    await useFetch("/api/queue/query", {
      method: "post",
      body: {},
    });
  }
}

export const queueService = new QueueService();
