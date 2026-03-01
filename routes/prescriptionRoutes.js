import express from "express";
import {
  getPrescriptions,
  getPrescriptionById,
  createPrescription,
  generatePrescriptionPDF,
} from "../controllers/prescriptionController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

router
  .route("/")
  .get(getPrescriptions)
  .post(authorize("Doctor"), createPrescription);

router.get("/:id", getPrescriptionById);
router.post(
  "/:id/generate-pdf",
  authorize("Doctor", "Admin"),
  generatePrescriptionPDF,
);

export default router;
