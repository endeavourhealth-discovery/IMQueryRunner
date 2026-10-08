import Logger from "~~/shared/logger";

const LOG = Logger("Error hook");

export default defineNitroPlugin(nitroApp => {
  nitroApp.hooks.hook("error", error => {
    LOG.error("Error: " + error.message);
  });
});
