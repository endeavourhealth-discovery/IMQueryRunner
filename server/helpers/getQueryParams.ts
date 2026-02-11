import {getValidatedQuery, createError, H3Event, type InferEventInput, type ValidateFunction} from "h3";

export async function getQueryParams<T, Event extends H3Event = H3Event, _T = InferEventInput<"query", Event, T>>(event: Event, validate: ValidateFunction<_T>): Promise<_T> {
  try {
    return await getValidatedQuery(event, validate)
  } catch (e) {
    throw createError({statusCode: 400, statusMessage: 'missing parameter(s)'});
  }
}