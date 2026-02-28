import express from "express";
import {
  getSmartDiagnosis,
  explainPrescription,
} from "../controllers/aiController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

// Only Doctors should directly access diagnostic tools
router.post("/diagnosis", protect, authorize("Doctor"), getSmartDiagnosis);

// Both Doctors and Patients can request explanations
router.post(
  "/explain-prescription",
  protect,
  authorize("Doctor", "Patient"),
  explainPrescription,
);

export default router;
