import { type Logger as PinoLogger, pino } from "pino";
import "pino-pretty";

const loggers = new Map<string, PinoLogger>();

/**
 * One logger per name. Each pino instance with the pino-pretty transport starts its own worker thread, so creating
 * one per call (for example inside a request handler) would leak a thread per request.
 */
export default function Logger(name: string): PinoLogger {
  let logger = loggers.get(name);
  if (!logger) {
    const inTest = process.env.NODE_ENV === "test";
    logger = pino({
      name: name,
      level: process.env.LOG_LEVEL || (inTest ? "silent" : "info"),
      // No worker thread under test: it keeps the test process alive and floods the output
      transport: inTest ? undefined : { target: "pino-pretty" }
    });
    loggers.set(name, logger);
  }
  return logger;
}
