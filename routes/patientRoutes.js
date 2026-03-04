import express from "express";
import {
  getPatients,
  getPatientById,
  getPatientByUID,
  createPatient,
  updatePatient,
  deletePatient,
  searchPatients,
  getPatientHistory,
} from "../controllers/patientController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

// Search & special routes FIRST (before /:id to avoid conflict)
router.get(
  "/search",
  authorize("Admin", "Doctor", "Receptionist", "Nurse", "Supervisor"),
  searchPatients,
);

router.get(
  "/uid/:uid",
  authorize("Admin", "Doctor", "Receptionist", "Nurse"),
  getPatientByUID,
);

router
  .route("/:id/history")
  .get(authorize("Admin", "Doctor", "Supervisor"), getPatientHistory);

router
  .route("/")
  .get(
    authorize("Admin", "Doctor", "Receptionist", "Nurse", "Supervisor"),
    getPatients,
  )
  .post(authorize("Admin", "Receptionist"), createPatient);

router
  .route("/:id")
  .get(authorize("Admin", "Doctor", "Receptionist", "Nurse"), getPatientById)
  .put(authorize("Admin", "Receptionist"), updatePatient)
  .delete(authorize("Admin"), deletePatient);

export default router;
