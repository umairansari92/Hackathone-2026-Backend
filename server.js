import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import cron from "node-cron";
import connectDB from "./config/db.js";

import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import patientRoutes from "./routes/patientRoutes.js";
import appointmentRoutes from "./routes/appointmentRoutes.js";
import prescriptionRoutes from "./routes/prescriptionRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import diagnosisRoutes from "./routes/diagnosisRoutes.js";
import scheduleRoutes from "./routes/scheduleRoutes.js";
import tokenRoutes from "./routes/tokenRoutes.js";
import patientSelfRoutes from "./routes/patientSelfRoutes.js";

dotenv.config();
connectDB();

const app = express();

// ─── Rate Limiting ──────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: {
    message: "Too many requests from this IP, please try again later.",
  },
});

// ─── Core Middleware ────────────────────────────────────────────────────────
app.use(express.json());
app.use(
  cors({
    origin: (origin, callback) => {
      if (
        !origin ||
        /^http:\/\/localhost(:\d+)?$/.test(origin) ||
        origin === process.env.CLIENT_URL
      ) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  }),
);
app.use(helmet());
app.use(morgan("dev"));
app.use("/api", limiter);

// ─── Routes ─────────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/prescriptions", prescriptionRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/diagnosis", diagnosisRoutes);
app.use("/api/schedule", scheduleRoutes);
app.use("/api/tokens", tokenRoutes);
app.use("/api/patient", patientSelfRoutes);

// ─── Health Check ───────────────────────────────────────────────────────────
app.get("/api/health", (req, res) =>
  res.json({ status: "ok", timestamp: new Date() }),
);

// ─── Midnight Auto-Reset Cron (00:01 every day) ─────────────────────────────
// Cancels all leftover Waiting/Serving tokens from the previous day
cron.schedule("1 0 * * *", async () => {
  try {
    const TokenQueue = (await import("./models/TokenQueue.js")).default;
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yStr = yesterday.toISOString().split("T")[0];

    const updated = await TokenQueue.updateMany(
      { date: yStr, status: { $in: ["Waiting", "Serving"] } },
      { status: "Cancelled" },
    );
    console.log(
      `🕛 Midnight reset: cancelled ${updated.modifiedCount} leftover tokens from ${yStr}`,
    );
  } catch (err) {
    console.error("Midnight cron error:", err.message);
  }
});

// ─── Error Handler ───────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || "Internal Server Error",
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(
    `✅ Server running in ${process.env.NODE_ENV || "development"} mode on port ${PORT}`,
  );
});
