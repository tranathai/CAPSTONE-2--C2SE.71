import "dotenv/config";
import path from "path";
import express from "express";
import cors from "cors";
import submissionRouter from "./routes/submission.routes.js";
import feedbackRouter from "./routes/feedback.routes.js";
import teamRouter from "./routes/team.routes.js";
import milestoneRouter from "./routes/milestone.routes.js";
import { checkDbConnection } from "./config/db.js";

const app = express();
const port = Number(process.env.PORT || 3000);

app.use(cors());
app.use(express.json());
app.use(
  "/uploads",
  express.static(path.join(process.cwd(), "uploads")),
);

app.get("/api/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "MentorAI Grad backend is running",
  });
});

app.use("/api/submissions", submissionRouter);
app.use("/api/feedbacks", feedbackRouter);
app.use("/api/teams", teamRouter);
app.use("/api/milestones", milestoneRouter);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Không tìm thấy endpoint: ${req.method} ${req.originalUrl}`,
  });
});

app.use((error, _req, res, _next) => {
  console.error(error);

  if (error?.code === "ER_NO_SUCH_TABLE") {
    return res.status(500).json({
      success: false,
      message: "Sai schema database hoặc thiếu bảng",
    });
  }

  return res.status(500).json({
    success: false,
    message: "Internal server error",
  });
});

checkDbConnection()
  .then(() => {
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  })
  .catch((error) => {
    console.error("Cannot connect to MySQL:", error.message);
    process.exit(1);
  });
