import { SubQueryDependencySchema } from "@endeavour/vue-library/models";

import { z } from "zod";

// IMAPI now also returns the iris of the queries that use each sub query. Remove this once @endeavour/vue-library's schema has `parentIris`.
export const subQueryDependencySchema = SubQueryDependencySchema.extend({
  parentIris: z.array(z.string()).nullish()
});
export type SubQueryDependency = z.infer<typeof subQueryDependencySchema>;
