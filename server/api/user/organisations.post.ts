import { PrimeVuePresetThemes } from "@endeavour/vue-library/enums";

import * as z from "zod";

const bodySchema = z.array(z.string());

defineRouteMeta({
  openAPI: {
    tags: ["query"],
    description: "Update user organisations",
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "array",
            summary: "Organisations list",
            items: {
              type: "string",
              description: "Organisation iri"
            }
          }
        }
      }
    }
  }
});

export default defineEventHandler(async (event): Promise<any> => {
  const organisations = await readValidatedBody(event, bodySchema.parse);
  const user = await getCurrentUser(event);
  user.organisations = organisations;
  return await updateCurrentUser(event, user);
});
