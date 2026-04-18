const http = require("http");
const app = require("./src/app");
const { initSocket } = require("./src/socket");

const server = http.createServer(app);
initSocket(server);

const PORT = process.env.PORT || 3100;

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});