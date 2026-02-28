import express from "express";
import {
  getAppointments,
  createAppointment,
  updateAppointmentStatus,
} from "../controllers/appointmentController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

router
  .route("/")
  .get(protect, getAppointments)
  .post(
    protect,
    authorize("Admin", "Receptionist", "Patient"),
    createAppointment,
  );

router
  .route("/:id/status")
  .put(
    protect,
    authorize("Admin", "Doctor", "Receptionist"),
    updateAppointmentStatus,
  );

export default router;
