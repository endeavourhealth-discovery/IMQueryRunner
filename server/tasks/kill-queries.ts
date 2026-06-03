import Logger from "#shared/logger";

import mysql from "mysql2";

const LOG = Logger("server/tasks/kill-queries");

type ProcessRow = {
  Id: number;
  User: string;
  Host: string;
  db: string | null;
  Command: string;
  Time: number;
  State: string | null;
  Info: string | null;
};

const db = mysql.createPool(process.env.COMPASS_URL as string);

export default defineTask({
  meta: {
    name: "timeout-query-connections",
    description: `Kills running for more than ${process.env.QUERY_KILL_TIMEOUT} seconds`
  },
  run() {
    if (process.env.QUERY_KILL_TIMEOUT) {
      let user = process.env.COMPASS_URL!.split("mysql://").pop();
      user = user!.split(":")[0];

      const showSql = `SHOW PROCESSLIST`;

      db.query(showSql, (err, results) => {
        if (err) {
          LOG.error(err);
          return;
        }

        const processes = results as ProcessRow[];

        processes.forEach(p => {
          if (p.Time > parseInt(process.env.QUERY_KILL_TIMEOUT!) && p.Command === "Query" && p.State !== "Sleep" && p.User === user) {
            const killSql = `KILL QUERY ${p.Id}`;
            db.query(killSql, err => {
              if (err) {
                LOG.error(err);
              } else {
                LOG.info(`Killed query with ID ${p.Id}`);
              }
            });
          }
        });
      });
    }
    return { result: "executed" };
  }
});
