import { csvChunks, csvField, csvLine } from "~~/server/utils/csv";

import { describe, expect, it } from "vitest";

async function collect(chunks: AsyncIterable<string>): Promise<string> {
  let text = "";
  for await (const chunk of chunks) text += chunk;
  return text;
}

async function* rowsOf(items: Record<string, unknown>[], onClose?: () => void) {
  try {
    for (const item of items) yield item;
  } finally {
    onClose?.();
  }
}

describe("csvField", () => {
  it("quotes every value and doubles embedded quotes", () => {
    expect(csvField("plain")).toBe('"plain"');
    expect(csvField('say "hi"')).toBe('"say ""hi"""');
  });

  it("keeps commas and line breaks inside the field", () => {
    expect(csvField("a,b\nc")).toBe('"a,b\nc"');
  });

  it("writes null and undefined as empty", () => {
    expect(csvField(null)).toBe('""');
    expect(csvField(undefined)).toBe('""');
  });

  it("keeps zero and false (they are values, not blanks)", () => {
    expect(csvField(0)).toBe('"0"');
    expect(csvField(false)).toBe('"false"');
  });

  it("writes objects such as JSON columns as JSON, and dates as ISO text", () => {
    expect(csvField({ a: 1, b: "x" })).toBe('"{""a"":1,""b"":""x""}"');
    expect(csvField(new Date("2026-01-02T03:04:05.000Z"))).toBe('"2026-01-02T03:04:05.000Z"');
  });
});

describe("csvLine", () => {
  it("ends each record with CRLF", () => {
    expect(csvLine(["a", 1])).toBe('"a","1"\r\n');
  });
});

describe("csvChunks", () => {
  it("writes the header then one line per row, in the order of the columns given", async () => {
    const text = await collect(
      csvChunks(
        ["b", "a"],
        rowsOf([
          { a: 1, b: 2 },
          { a: 3, b: 4 }
        ])
      )
    );
    expect(text).toBe('"b","a"\r\n"2","1"\r\n"4","3"\r\n');
  });

  it("still writes the header for an empty result", async () => {
    expect(await collect(csvChunks(["id"], rowsOf([])))).toBe('"id"\r\n');
  });

  it("ignores row fields that are not listed and blanks the missing ones", async () => {
    expect(await collect(csvChunks(["a", "b"], rowsOf([{ a: 1, extra: "no" }])))).toBe('"a","b"\r\n"1",""\r\n');
  });

  it("splits large results into chunks of 500 rows without losing any", async () => {
    const items = Array.from({ length: 1203 }, (_, i) => ({ id: i }));
    const chunks: string[] = [];
    for await (const chunk of csvChunks(["id"], rowsOf(items))) chunks.push(chunk);

    expect(chunks).toHaveLength(1 + 3); // header, 500, 500, 203
    expect(chunks.join("").split("\r\n").filter(Boolean)).toHaveLength(1 + 1203);
  });

  it("stops reading the source when the consumer stops early", async () => {
    let closed = false;
    const items = Array.from({ length: 5000 }, (_, i) => ({ id: i }));
    const generator = csvChunks(
      ["id"],
      rowsOf(items, () => (closed = true))
    );

    await generator.next(); // header
    await generator.next(); // first chunk of rows
    await generator.return(undefined); // the browser went away

    expect(closed).toBe(true);
  });
});
