import { type Logger as PinoLogger, pino } from "pino";
import "pino-pretty";

const loggers = new Map<string, PinoLogger>();
let root: PinoLogger | undefined;

/**
 * The single pino instance. Each pino instance with the pino-pretty transport starts its own worker thread and adds a
 * process "exit" listener, so one per name would trip Node's MaxListenersExceededWarning once there are more than 10.
 */
function getRoot(): PinoLogger {
  if (!root) {
    const inTest = process.env.NODE_ENV === "test";
    root = pino({
      level: process.env.LOG_LEVEL || (inTest ? "silent" : "info"),
      // No worker thread under test: it keeps the test process alive and floods the output
      transport: inTest ? undefined : { target: "pino-pretty" }
    });
  }
  return root;
}

/** One logger per name, all children of the same root so they share its transport. */
export default function Logger(name: string): PinoLogger {
  let logger = loggers.get(name);
  if (!logger) {
    logger = getRoot().child({ name });
    loggers.set(name, logger);
  }
  return logger;
}
