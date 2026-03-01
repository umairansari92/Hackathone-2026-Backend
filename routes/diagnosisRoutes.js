import express from "express";
import { protect, authorize } from "../middleware/authMiddleware.js";
import {
  saveDiagnosis,
  getDiagnosisHistory,
  getDiagnosisById,
} from "../controllers/diagnosisController.js";

const router = express.Router();

router.use(protect);

router.post("/", authorize("Doctor"), saveDiagnosis);
router.get("/", authorize("Doctor", "Admin"), getDiagnosisHistory);
router.get("/:id", authorize("Doctor", "Admin"), getDiagnosisById);

export default router;
