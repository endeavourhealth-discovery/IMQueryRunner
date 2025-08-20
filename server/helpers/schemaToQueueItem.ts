import { QueueItem as QueueItemSchema } from "~~/prisma/generated/postgres";
import { QueueItem as QueueItemModel } from "~~/models";

export function schemaToQueueItem(schemaItem: QueueItemSchema): QueueItemModel {
  const queryRequestJson = schemaItem.query_request?.toString();
  const queryRequest = queryRequestJson ? JSON.parse(queryRequestJson) : null;
  return {
    id: schemaItem.id,
    queryIri: schemaItem.query_iri,
    queryName: schemaItem.query_name,
    queryRequest: queryRequest,
  } as QueueItemModel;
}
