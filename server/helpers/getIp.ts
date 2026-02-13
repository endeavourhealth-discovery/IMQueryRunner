import { type H3Event, getRequestIP } from "h3";
import { normaliseIp } from "./normaliseIp";

export function getIp(event: H3Event) {
  const ip = getRequestIP(event, { xForwardedFor: true });
  if (!ip) {
    // if (import.meta.dev) return "127.0.0.1";
    throw createError({
      statusCode: 400,
      statusMessage: "IP address not available",
    });
  }
  return normaliseIp(ip);
}
