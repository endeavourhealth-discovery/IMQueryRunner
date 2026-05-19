const API_URL = "api/imapi/status";

const StatusService = {
  async isDevMode(): Promise<boolean> {
    return await $fetch<boolean>(API_URL + "/isDevMode", {
      method: "GET"
    });
  }
};

if (process.env.NODE_ENV !== "test") Object.freeze(StatusService);

export default StatusService;
