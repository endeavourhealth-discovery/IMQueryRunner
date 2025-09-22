import { logout } from "~~/server/utils/logout";

export default defineEventHandler(async (event) => {
  await logout(event);
});
