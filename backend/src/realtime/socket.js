import { Server } from "socket.io";
import Redis from "ioredis";
import jwt from "jsonwebtoken";

let ioInstance = null;

export function initSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: (process.env.CORS_ORIGINS || "http://localhost:5173")
        .split(",")
        .map((value) => value.trim()),
      credentials: true,
    },
  });

  const redisUrl = process.env.REDIS_URL;
  const redisPub = redisUrl ? new Redis(redisUrl) : null;

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      const payload = jwt.verify(token, process.env.JWT_SECRET || "dev_secret_change_me");
      socket.data.user = { id: payload.id, role: payload.role };
      return next();
    } catch {
      return next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    socket.join(`user:${socket.data.user.id}`);

    socket.on("join:team", (teamId) => {
      socket.join(`team:${teamId}`);
    });

    socket.on("chat:message", (payload) => {
      io.to(`team:${payload.teamId}`).emit("chat:message", {
        teamId: payload.teamId,
        senderId: socket.data.user.id,
        body: payload.body,
        createdAt: new Date().toISOString(),
      });
      if (redisPub) {
        redisPub.publish("events", JSON.stringify({ type: "chat:message", payload }));
      }
    });
  });

  ioInstance = io;
  return io;
}

export function emitToUser(userId, eventName, payload) {
  if (!ioInstance) return;
  ioInstance.to(`user:${userId}`).emit(eventName, payload);
}
