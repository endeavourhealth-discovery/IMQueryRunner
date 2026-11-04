import { TextSearchStyle } from "@endeavour/vue-library/enums";
import { PageSchema, type QueryRequest, type SearchResponse, type SearchResultSummary } from "@endeavour/vue-library/models";

export const MIN_SEARCH_LENGTH = 3;
export const SEARCH_DEBOUNCE_MS = 600;
export const SEARCH_TIMEOUT_MS = 10000;

export class SearchTimeoutError extends Error {
  constructor(readonly timeoutMs: number) {
    super(`Search timed out after ${Math.round(timeoutMs / 1000)} seconds`);
    this.name = "SearchTimeoutError";
  }
}

export interface SearchOptions {
  text: string;
  pageNumber?: number;
  pageSize?: number;
  style?: TextSearchStyle;
  timeoutMs?: number;
  signal?: AbortSignal;
}

export type SearchFn = (request: QueryRequest, controller: AbortController) => Promise<SearchResponse>;

export function buildSearchRequest(base: QueryRequest | undefined, options: SearchOptions): QueryRequest {
  const request: QueryRequest = base ? JSON.parse(JSON.stringify(base)) : ({} as QueryRequest);
  if (!request.query) request.query = {} as QueryRequest["query"];
  request.textSearch = options.text;
  request.textSearchStyle = options.style ?? TextSearchStyle.autocomplete;
  request.page = PageSchema.parse({ pageNumber: options.pageNumber ?? 1, pageSize: options.pageSize ?? 10 });
  return request;
}

export async function searchEntities(search: SearchFn, base: QueryRequest | undefined, options: SearchOptions): Promise<SearchResponse> {
  const request = buildSearchRequest(base, options);
  const timeoutMs = options.timeoutMs ?? 0;
  const controller = new AbortController();
  const onAbort = () => controller.abort(options.signal?.reason);
  options.signal?.addEventListener("abort", onAbort, { once: true });
  let timedOut = false;
  const timer = timeoutMs > 0 ? setTimeout(() => ((timedOut = true), controller.abort()), timeoutMs) : undefined;
  try {
    return (await search(request, controller)) ?? ({} as SearchResponse);
  } catch (e) {
    if (timedOut) throw new SearchTimeoutError(timeoutMs);
    throw e;
  } finally {
    clearTimeout(timer);
    options.signal?.removeEventListener("abort", onAbort);
  }
}

export function isAbortError(e: unknown): boolean {
  if (e instanceof DOMException && e.name === "AbortError") return true;
  const cause = (e as { cause?: unknown } | undefined)?.cause;
  return cause instanceof DOMException && cause.name === "AbortError";
}

export function displayName(entity: Pick<SearchResultSummary, "iri" | "name" | "bestMatch" | "preferredName"> | undefined): string {
  if (!entity) return "";
  return entity.bestMatch || entity.name || entity.preferredName || entity.iri;
}
