import express from "express";
import { protect, authorize } from "../middleware/authMiddleware.js";
import upload from "../middleware/upload.js";
import {
  getMyProfile,
  updateMyProfile,
  changePassword,
  getAvailableDoctors,
  getMyAppointments,
  bookAppointment,
  cancelMyAppointment,
  getMyPrescriptions,
  getMyQueueStatus,
  getMedicalHistory,
} from "../controllers/patientSelfController.js";

const router = express.Router();

// All patient-self routes require authentication + Patient role
router.use(protect, authorize("Patient"));

// Profile
router.get("/profile", getMyProfile);
router.patch("/profile", upload.single("image"), updateMyProfile);
router.put("/change-password", changePassword);

// Doctors
router.get("/doctors", getAvailableDoctors);

// Appointments
router.get("/my-appointments", getMyAppointments);
router.post("/appointments", bookAppointment);
router.patch("/appointments/:id/cancel", cancelMyAppointment);

// Prescriptions
router.get("/my-prescriptions", getMyPrescriptions);

// Queue
router.get("/my-queue", getMyQueueStatus);

// Medical History
router.get("/medical-history", getMedicalHistory);

export default router;
