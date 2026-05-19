import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const dir = path.dirname(fileURLToPath(import.meta.url));
// Chung (GEMINI, …) trước; backend/.env sau với override để PORT/DB/JWT của backend thắng file .env gốc (tránh PORT=3000 ở root làm API lệch cổng so với Vite proxy :5000).
dotenv.config({ path: path.join(dir, "../../.env") });
dotenv.config({ path: path.join(dir, "../.env"), override: true });
