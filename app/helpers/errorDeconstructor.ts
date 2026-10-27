import { FetchError } from "ofetch";

export const getErrorStatus = (error: unknown): number | undefined => {
  if (error instanceof FetchError) {
    return error.status;
  }
  if (error && typeof error === "object" && "statusCode" in error && typeof error.statusCode === "number") {
    return error.statusCode;
  }
  if (error && typeof error === "object" && "status" in error && typeof error.status === "number") {
    return error.status;
  }
  return undefined;
};

export const getErrorStatusText = (error: unknown): string | undefined => {
  if (error instanceof FetchError) {
    return error.statusText;
  }
  if (error && typeof error === "object" && "statusText" in error && typeof error.statusText === "string") {
    return error.statusText;
  }
  return undefined;
};

export const getErrorMessage = (error: unknown): string | undefined => {
  if (error instanceof FetchError) {
    return error.message;
  }
  if (error && typeof error === "object" && "message" in error && typeof error.message === "string") {
    return error.message;
  }
  return undefined;
};
