import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

const configuredOrigins = (process.env.CORS_ORIGINS || "http://localhost:5173")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

const localhostPattern = /^https?:\/\/(localhost|127\.0\.0\.1):\d+$/i;
const isProduction = process.env.NODE_ENV === "production";

export const corsMiddleware = cors({
  origin(origin, callback) {
    if (!origin) {
      callback(null, true);
      return;
    }
    if (configuredOrigins.includes(origin)) {
      callback(null, true);
      return;
    }
    if (!isProduction && localhostPattern.test(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
});

export const helmetMiddleware = helmet();

export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: Number(process.env.RATE_LIMIT_PER_MINUTE || 120),
  standardHeaders: true,
  legacyHeaders: false,
});
