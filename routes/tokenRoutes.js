import express from "express";
import { protect, authorize } from "../middleware/authMiddleware.js";
import {
  getTodayQueue,
  generateToken,
  updateTokenStatus,
  callNextPatient,
  resetTokens,
  getReceptionistDashboard,
} from "../controllers/tokenController.js";

const router = express.Router();
router.use(protect);

// Dashboard stats
router.get(
  "/dashboard",
  authorize("Admin", "Receptionist"),
  getReceptionistDashboard,
);

// Queue
router.get(
  "/queue",
  authorize("Admin", "Receptionist", "Doctor"),
  getTodayQueue,
);

// Generate token (creates appointment too)
router.post("/generate", authorize("Admin", "Receptionist"), generateToken);

// Update token status
router.patch(
  "/:id/status",
  authorize("Admin", "Receptionist", "Doctor"),
  updateTokenStatus,
);

// Call next patient
router.post(
  "/call-next",
  authorize("Admin", "Receptionist", "Doctor"),
  callNextPatient,
);

// Reset tokens (manual)
router.post("/reset", authorize("Admin", "Receptionist"), resetTokens);

export default router;
