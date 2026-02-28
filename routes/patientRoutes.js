import express from "express";
import {
  getPatients,
  getPatientById,
  createPatient,
  updatePatient,
  deletePatient,
} from "../controllers/patientController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

router
  .route("/")
  .get(protect, authorize("Admin", "Doctor", "Receptionist"), getPatients)
  .post(protect, authorize("Admin", "Doctor", "Receptionist"), createPatient);

router
  .route("/:id")
  .get(protect, authorize("Admin", "Doctor", "Receptionist"), getPatientById)
  .put(protect, authorize("Admin", "Doctor", "Receptionist"), updatePatient)
  .delete(protect, authorize("Admin"), deletePatient);

export default router;
