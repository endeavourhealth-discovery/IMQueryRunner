import { getQueryParams } from "~/server/helpers/getQueryParams";

import { createError, getValidatedQuery } from "h3";
import { describe, expect, it, vi } from "vitest";

vi.mock("h3", () => ({
  getValidatedQuery: vi.fn(),
  createError: vi.fn(err => err)
}));

describe("getQueryParams", () => {
  it("should return validated query params on success", async () => {
    const mockEvent = {} as any;
    const mockValidate = vi.fn();
    const mockResult = { id: 1 };

    vi.mocked(getValidatedQuery).mockResolvedValue(mockResult);

    const result = await getQueryParams(mockEvent, mockValidate);

    expect(getValidatedQuery).toHaveBeenCalledWith(mockEvent, mockValidate);
    expect(result).toEqual(mockResult);
  });

  it("should throw a 400 error when validation fails", async () => {
    const mockEvent = {} as any;
    const mockValidate = vi.fn();

    vi.mocked(getValidatedQuery).mockRejectedValue(new Error("Validation failed"));

    try {
      await getQueryParams(mockEvent, mockValidate);
    } catch (error) {
      expect(error).toEqual({
        statusCode: 400,
        statusMessage: "missing parameter(s)"
      });
    }

    expect(createError).toHaveBeenCalledWith({
      statusCode: 400,
      statusMessage: "missing parameter(s)"
    });
  });
});
