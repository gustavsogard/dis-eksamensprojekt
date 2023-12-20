const express = require("express");
const app = express();
const host = "localhost";
const port = 3000;
const http = require("http").Server(app);
const path = require("path");

// Starter databasen og populate den med data
const { init } = require("./lib/database/init");
// initierer databasen og populerer den med data
init();

const io = require("socket.io")(http);
const { ioCallbackFunction } = require("./lib/sockets/connection");

io.on("connection", ioCallbackFunction(io));
// Routes defineres
const dashboardRoutes = require("./routes/dashboard");
const loginRoutes = require("./routes/login");
const authRoutes = require("./routes/authentication");
const swaggerRoutes = require("./routes/swagger");
const apiRoutes = require("./api/api.orders");
// routes sættes op
app.use("/", dashboardRoutes);
app.use("/", loginRoutes);
app.use("/", authRoutes);
app.use("/docs", swaggerRoutes);
app.use("/api", apiRoutes(io));
// der sættes en statisk mappe op for public
app.use("/public", express.static(path.join(__dirname, "../client/public")));
// http serveren starter, og der logges hvilken port og host den kører på
http.listen(port, host, () => {
  console.log(`Server kører på http://${host}:${port}`);
});

module.exports = io;