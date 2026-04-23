import { pino } from "pino";
import "pino-pretty";

export default function Logger(name: string) {
  return pino({
    name: name,
    level: process.env.LOG_LEVEL || "info",
    transport: { target: "pino-pretty" }
  });
}
