import { Server } from "socket.io";

export let io: Server;

export const initSocket = (server: any) => {
  // IGNORE the passed server instance because Bun.serve is not compatible with Socket.IO attachment directly.
  // We run Socket.IO as a standalone server on a separate port.
  const SOCKET_PORT = 3002;
  
  console.log(`Starting Socket.IO on port ${SOCKET_PORT}...`);
  
  io = new Server({
    cors: {
      origin: "*", 
      methods: ["GET", "POST"]
    }
  });

  io.listen(SOCKET_PORT);

  io.on("connection", (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

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

export const emitQueueUpdate = (data: any) => {
  if (io) {
    io.emit("queue-updated", data);
  }
};
