const { io } = require("socket.io-client");

const socket = io("http://localhost:3000", { path: "/socket.io" });

socket.on("connect", () => {
  console.log("connected", socket.id);
  socket.emit("join", { driverId: "driver01" });
});

socket.on("joined", (m) => console.log("joined", m));
socket.on("location", (m) => console.log("location", m));
socket.on("disconnect", () => console.log("disconnected"));
