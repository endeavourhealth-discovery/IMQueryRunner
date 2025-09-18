import z from "zod";

export const queryRunRequestSchema = z.object({
  query_id: z.string(),
  reference_date: z.string(),
});

export type QueryRunRequest = z.infer<typeof queryRunRequestSchema>;