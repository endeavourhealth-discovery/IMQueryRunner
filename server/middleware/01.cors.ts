export default defineEventHandler(event => {
  handleCors(event, {
    methods: ["GET", "POST", "DELETE", "OPTIONS"],
    allowHeaders: "*",
    origin: ["http://localhost:8082", "http://localhost:3000"],
    credentials: true
  });
});
