import "dotenv/config";
import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import jwt from "jsonwebtoken";

import { bootstrapDatabase } from "./config/bootstrap.js";
import pool from "./config/db.js";
import authRouter from "./routes/auth.routes.js";
import userRouter from "./routes/user.routes.js";
import teamRouter from "./routes/team.routes.js";
import milestoneRouter from "./routes/milestone.routes.js";
import topicRouter from "./routes/topic.routes.js";
import submissionRouter from "./routes/submission.routes.js";
import feedbackRouter from "./routes/feedback.routes.js";
import notificationRouter from "./routes/notification.routes.js";
import meetingRouter from "./routes/meeting.routes.js";
import messageRouter from "./routes/message.routes.js";
import aiRouter from "./routes/ai.routes.js";
import systemConfigRouter from "./routes/systemConfig.routes.js";
import { errorHandler } from "./middleware/errorHandler.js";

function isAllowedCorsOrigin(origin) {
  if (!origin) return true;
  try {
    const { hostname } = new URL(origin);
    if (hostname === "localhost" || hostname === "127.0.0.1") return true;
  } catch {
    return false;
  }
  const raw = process.env.FRONTEND_URL;
  if (!raw) return false;
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .includes(origin);
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: (origin, cb) => cb(null, isAllowedCorsOrigin(origin)),
    credentials: true,
  },
});
const port = Number(process.env.PORT || 5000);

// Make io available to other modules via global
export { io };

// ─── Socket.IO Auth Middleware ────────────────────────────────────────────────
io.use((socket, next) => {
  const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace("Bearer ", "");
  if (!token) {
    return next(new Error("Thiếu token xác thực"));
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.id;
    socket.userRole = decoded.role;
    next();
  } catch {
    next(new Error("Token không hợp lệ"));
  }
});

// ─── Socket.IO Connection Handler ────────────────────────────────────────────
io.on("connection", (socket) => {
  // Join a personal room so we can send targeted events
  socket.join(`user:${socket.userId}`);
  console.log(`[Socket] User ${socket.userId} connected`);

  socket.on("disconnect", () => {
    console.log(`[Socket] User ${socket.userId} disconnected`);
  });
});

// ─── Express Middleware ────────────────────────────────────────────────────────
app.use(
  cors({
    origin: (origin, cb) => cb(null, isAllowedCorsOrigin(origin)),
    credentials: true,
  }),
);
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

app.get("/", (_req, res) => {
  res.type("text/html; charset=utf-8").send(`<!DOCTYPE html>
<html lang="vi"><head><meta charset="utf-8"/><title>MentorAI Grad API</title></head>
<body style="font-family:system-ui,sans-serif;padding:1.5rem;line-height:1.6">
<h1>MentorAI Grad API</h1>
<p>Backend đang chạy. Kiểm tra nhanh: <a href="/api/health"><code>/api/health</code></a> (JSON).</p>
<p>Nếu mở <code>/api/health</code> trên Firefox mà trắng: bấm <strong>Ctrl+U</strong> (xem mã nguồn) hoặc F12 → tab <strong>Mạng</strong> → chọn request → <strong>Phản hồi</strong>.</p>
</body></html>`);
});

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ success: true, message: "MentorAI Grad API is running" });
});

// Routes
app.use("/api/auth", authRouter);
app.use("/api/users", userRouter);
app.use("/api/teams", teamRouter);
app.use("/api/milestones", milestoneRouter);
app.use("/api/topics", topicRouter);
app.use("/api/submissions", submissionRouter);
app.use("/api/feedbacks", feedbackRouter);
app.use("/api/notifications", notificationRouter);
app.use("/api/meetings", meetingRouter);
app.use("/api/messages", messageRouter);
app.use("/api/ai", aiRouter);
app.use("/api/system-config", systemConfigRouter);

// 404
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Không tìm thấy: ${req.method} ${req.originalUrl}` });
});

// Error handler
app.use(errorHandler);

// ─── Bootstrap & Start ────────────────────────────────────────────────────────
bootstrapDatabase()
  .then(() => {
    httpServer.listen(port, () => {
      console.log(`\n🚀 MentorAI Grad API ready at http://localhost:${port}`);
      console.log(`   Frontend:        http://localhost:5173`);
      console.log(`\n📋 Demo accounts:`);
      console.log(`   Admin:          admin@mentorai.edu / admin123`);
      console.log(`   Sinh viên:       nguyen.van.a@student.edu.vn / student123`);
      console.log(`   Giảng viên:     ts.nguyen@mentorai.edu / super123\n`);
    });
  })
  .catch((err) => {
    console.error("[Fatal] Bootstrap failed:", err.message);
    process.exit(1);
  });

// ─── Graceful Shutdown ────────────────────────────────────────────────────────
process.on("SIGINT", async () => {
  console.log("\n🛑 Shutting down gracefully...");
  try {
    await pool.end();
    console.log("✅ Database connections closed");
  } catch (err) {
    console.error("❌ Error closing database connections:", err.message);
  }
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("\n🛑 Shutting down gracefully...");
  try {
    await pool.end();
    console.log("✅ Database connections closed");
  } catch (err) {
    console.error("❌ Error closing database connections:", err.message);
  }
  process.exit(0);
});
