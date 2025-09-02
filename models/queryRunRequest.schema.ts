import z from "zod";

export const queryRunRequestSchema = z.object({
  query_id: z.uuid(),
  reference_date: z.date(),
});

export type QueryRunRequest = z.infer<typeof queryRunRequestSchema>;