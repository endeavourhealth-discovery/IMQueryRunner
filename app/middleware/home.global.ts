export default defineNuxtRouteMiddleware((to, from) => {
  console.log(to.path);
  if (to.path === "/") {
    console.log("Routing to query runner");
    return navigateTo("/QueryRunner");
  }
});
