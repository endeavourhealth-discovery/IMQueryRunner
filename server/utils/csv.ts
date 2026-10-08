/** One CSV field. Every field is quoted, so commas, quotes and line breaks inside values are safe. */
export function csvField(value: unknown): string {
  if (value === null || value === undefined) return '""';
  let text: string;
  if (value instanceof Date) text = value.toISOString();
  else if (typeof value === "object")
    text = JSON.stringify(value); // for example a JSON column
  else text = String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

/** One CSV record, ended with CRLF as RFC 4180 asks. */
export function csvLine(values: unknown[]): string {
  return values.map(csvField).join(",") + "\r\n";
}

const ROWS_PER_CHUNK = 500;

/**
 * Turns rows into CSV text, one chunk per few hundred rows, so a very large result is never held in memory.
 * `columns` fixes the header and column order, so an empty result still produces a header.
 * Stopping early (a client that went away) stops the source too.
 */
export async function* csvChunks(columns: string[], rows: AsyncIterable<Record<string, unknown>>): AsyncGenerator<string> {
  yield csvLine(columns);

  let chunk = "";
  let inChunk = 0;
  for await (const row of rows) {
    chunk += csvLine(columns.map(column => row[column]));
    if (++inChunk === ROWS_PER_CHUNK) {
      yield chunk;
      chunk = "";
      inChunk = 0;
    }
  }
  if (chunk) yield chunk;
}
