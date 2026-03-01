import express from "express";
import { protect, authorize } from "../middleware/authMiddleware.js";
import {
  getAllSchedules,
  getDoctorSchedule,
  upsertSchedule,
  markLeave,
  checkAvailability,
} from "../controllers/scheduleController.js";

const router = express.Router();
router.use(protect);

// Receptionist + Admin can view schedules
router.get("/", authorize("Admin", "Receptionist"), getAllSchedules);
router.get(
  "/:doctorId",
  authorize("Admin", "Receptionist", "Doctor"),
  getDoctorSchedule,
);
router.get(
  "/:doctorId/availability",
  authorize("Admin", "Receptionist"),
  checkAvailability,
);

// Admin can configure schedules; Receptionist can mark leave
router.post("/", authorize("Admin"), upsertSchedule);
router.patch("/:doctorId/leave", authorize("Admin", "Receptionist"), markLeave);

export default router;
