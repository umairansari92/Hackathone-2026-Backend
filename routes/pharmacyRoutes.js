import express from "express";
import { protect, authorize } from "../middleware/authMiddleware.js";
import {
  createPharmacyRecord,
  getPharmacyRecords,
  getPharmacyRecordById,
  updateDispenseStatus,
  getPharmacyStats,
} from "../controllers/pharmacyController.js";

const router = express.Router();

router.use(protect);

router.get(
  "/stats",
  authorize("Pharmacist", "Supervisor", "Admin"),
  getPharmacyStats,
);
router
  .route("/")
  .get(authorize("Pharmacist", "Admin", "Supervisor"), getPharmacyRecords)
  .post(
    authorize("Pharmacist", "Admin", "Doctor", "Receptionist"),
    createPharmacyRecord,
  );

router
  .route("/:id")
  .get(authorize("Pharmacist", "Admin"), getPharmacyRecordById)
  .put(authorize("Pharmacist", "Admin"), updateDispenseStatus);

export default router;
