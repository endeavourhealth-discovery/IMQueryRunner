export default defineEventHandler(event => {
  const url = getRequestURL(event);
  if (url.pathname === "/") {
    setResponseHeaders(event, {
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      Pragma: "no-cache",
      Expires: "0"
    });
  }
});
