import { Server } from "socket.io";
import type { Server as BunServer } from "bun";

export let io: Server;

export const initSocket = (server: any) => {
  io = new Server(server, {
    cors: {
      origin: "*", // Sesuaikan dengan URL frontend nanti
      methods: ["GET", "POST"]
    }
  });

  io.on("connection", (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    // Contoh join room per layanan jika dibutuhkan nanti
    socket.on("join-queue", (serviceId) => {
      socket.join(`queue-${serviceId}`);
      console.log(`👤 Client joined room: queue-${serviceId}`);
    });

    socket.on("disconnect", () => {
      console.log(`❌ Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

/**
 * Helper untuk emit event dari mana saja (Service/Controller)
 */
export const emitQueueUpdate = (data: any) => {
  if (io) {
    io.emit("queue-updated", data);
  }
};
