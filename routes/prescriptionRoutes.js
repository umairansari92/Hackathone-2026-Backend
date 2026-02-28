import express from "express";
import {
  getPrescriptions,
  createPrescription,
} from "../controllers/prescriptionController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

router
  .route("/")
  .get(protect, getPrescriptions)
  .post(protect, authorize("Doctor"), createPrescription);

export default router;
