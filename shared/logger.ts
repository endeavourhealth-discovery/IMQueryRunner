import {pino} from "pino";

export default function Logger(name: string) {
  return pino({
    name: name,
    level: process.env.LOG_LEVEL || "info",
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        levelFirst: true,
        translateTime: 'HH:MM:ss',
      },
    }
  });
}