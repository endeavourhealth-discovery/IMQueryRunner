import { z } from "~~/shared/zod";

export const filterOptionsSchema = z.object({
  types: z.array(z.string()),
  schemes: z.array(z.string()),
  status: z.array(z.string()),
});

export type FilterOptions = z.infer<typeof filterOptionsSchema>;
