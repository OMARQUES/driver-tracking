<template>
  <div class="wrap">
    <header class="header">
      <div class="row">
        <label>Driver ID</label>
        <input v-model="driverId" placeholder="driver01" />
        <button @click="connectDriver" :disabled="!driverId || isConnecting">
          {{ isConnected ? "Trocar Driver" : "Conectar" }}
        </button>
      </div>

      <div class="status">
        <div><strong>Socket:</strong> {{ isConnected ? "conectado" : "desconectado" }}</div>
        <div><strong>Driver:</strong> {{ driverStatus }}</div>
        <div v-if="lastTs"><strong>Último update:</strong> {{ lastTs }}</div>
      </div>
    </header>

    <div id="map" class="map"></div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from "vue";
import L from "leaflet";
import { io, Socket } from "socket.io-client";

type LocationPayload = {
  driverId: string;
  lat: number;
  lon: number;
  accuracy: number | null;
  speed: number | null;
  heading: number | null;
  ts: string;
};

const API_BASE = import.meta.env.VITE_API_BASE as string;
const SOCKET_PATH = (import.meta.env.VITE_SOCKET_PATH as string) || "/socket.io";
const DEFAULT_DRIVER = (import.meta.env.VITE_DEFAULT_DRIVER as string) || "driver01";

const driverId = ref(DEFAULT_DRIVER);
const isConnected = ref(false);
const isConnecting = ref(false);

const driverStatus = ref<"offline" | "online">("offline");
const lastTs = ref<string>("");

let map: L.Map | null = null;
let marker: L.Marker | null = null;
let socket: Socket | null = null;

let lastEventAtMs = 0;
let watchdogTimer: number | null = null;

// Considera offline se não receber evento por X ms.
// Deixe maior que o TTL do Redis (60s) para evitar falso offline.
const OFFLINE_AFTER_MS = 75_000;

function ensureMap() {
  if (map) return;

  map = L.map("map").setView([-23.5505, -46.6333], 12);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap contributors",
  }).addTo(map);

  marker = L.marker([-23.5505, -46.6333]).addTo(map);
}

async function fetchLast(driver: string) {
  const res = await fetch(`${API_BASE}/api/v1/drivers/${encodeURIComponent(driver)}/last`);
  const json = await res.json();
  return json?.last as LocationPayload | null;
}

function setMarkerPosition(p: LocationPayload) {
  ensureMap();
  const latlng: [number, number] = [p.lat, p.lon];

  marker!.setLatLng(latlng);
  map!.panTo(latlng, { animate: true });

  driverStatus.value = "online";
  lastTs.value = p.ts;
  lastEventAtMs = Date.now();
}

function startWatchdog() {
  stopWatchdog();
  watchdogTimer = window.setInterval(() => {
    if (!lastEventAtMs) return;
    const delta = Date.now() - lastEventAtMs;
    if (delta > OFFLINE_AFTER_MS) {
      driverStatus.value = "offline";
    }
  }, 1000);
}

function stopWatchdog() {
  if (watchdogTimer) {
    clearInterval(watchdogTimer);
    watchdogTimer = null;
  }
}

function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
  isConnected.value = false;
  driverStatus.value = "offline";
  lastTs.value = "";
  lastEventAtMs = 0;
}

async function connectDriver() {
  const driver = driverId.value.trim();
  if (!driver) return;

  isConnecting.value = true;

  // 1) Garante mapa
  ensureMap();

  // 2) Desconecta socket anterior
  disconnectSocket();

  // 3) Cria conexão socket
  socket = io(API_BASE, {
    path: SOCKET_PATH,
    transports: ["websocket"],
    withCredentials: true,
  });

  socket.on("connect", async () => {
    isConnected.value = true;

    // Join room do driver
    socket!.emit("join", { driverId: driver });

    // Busca last (para posicionar instantaneamente)
    const last = await fetchLast(driver);
    if (last) setMarkerPosition(last);

    startWatchdog();
  });

  socket.on("disconnect", () => {
    isConnected.value = false;
    // não marca offline imediatamente; watchdog cuida
  });

  socket.on("location", (payload: LocationPayload) => {
    // Segurança: ignora se vier de outro driver
    if (payload?.driverId !== driver) return;
    setMarkerPosition(payload);
  });

  socket.on("error", (e: any) => {
    console.error("socket error:", e);
  });

  isConnecting.value = false;
}

onMounted(() => {
  ensureMap();
});

onBeforeUnmount(() => {
  stopWatchdog();
  disconnectSocket();
});
</script>

<style scoped>
.wrap {
  height: 100vh;
  display: grid;
  grid-template-rows: auto 1fr;
}
.header {
  padding: 12px 16px;
  border-bottom: 1px solid #e5e5e5;
}
.row {
  display: flex;
  gap: 8px;
  align-items: center;
}
.row input {
  padding: 6px 8px;
  min-width: 220px;
}
.row button {
  padding: 6px 10px;
}
.status {
  margin-top: 8px;
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  font-size: 14px;
}
.map {
  width: 100%;
  height: 100%;
}
</style>
