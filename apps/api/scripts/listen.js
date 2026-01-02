const { io } = require("socket.io-client");

const BASE = "https://ca-driver-poc.gentlehill-44781624.brazilsouth.azurecontainerapps.io";

const socket = io(BASE, {
  path: "/socket.io",
  transports: ["websocket"],
});

socket.on("connect", () => {
  console.log("connected", socket.id);
  socket.emit("join", { driverId: "driver01" });
});

socket.on("joined", (m) => console.log("joined", m));
socket.on("location", (m) => console.log("location", m));
socket.on("disconnect", () => console.log("disconnected"));
socket.on("error", (e) => console.log("error", e));
