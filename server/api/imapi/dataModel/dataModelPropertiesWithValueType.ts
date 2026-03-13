import { getQueryParams } from "~~/server/helpers/getQueryParams";
import { boolean, object, string } from "zod/v4";
import DataModelService from "~~/server/services/DataModelService";

const paramSchema = object({
  iris: string(),
  valueType: string(),
});

defineRouteMeta({
  openAPI: {
    tags: ["query"],
    description: "Get properties with value type of given data models",
    parameters: [
      { name: "session_id", description: "User session id", in: "cookie" },
      {
        name: "iris",
        description: "Iris of the data models in comma separated string",
        in: "query",
      },
      {
        name: "valueType",
        description: "Value type required by properties",
        in: "query",
      },
    ],
  },
});
export default defineEventHandler(async (event): Promise<any> => {
  const sessionId = getCookie(event, "session_id")!;
  const { iris, valueType } = await getQueryParams(event, paramSchema.parse);
  return await DataModelService.getDataModelPropertiesWithValueType(
    sessionId,
    iris.split(","),
    valueType,
  );
});
