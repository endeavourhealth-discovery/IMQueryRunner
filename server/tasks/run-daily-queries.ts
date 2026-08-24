import Logger from "#shared/logger";

import mysql from "mysql2";

const LOG = Logger("server/tasks/run-daily-queries");

export default defineTask({
  meta: {
    name: "run-daily-queries",
    description: `Runs queries at specified time daily`
  },
  run() {
    return { result: "executed" };
  }
});
