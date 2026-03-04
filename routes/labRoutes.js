import express from "express";
import { protect, authorize } from "../middleware/authMiddleware.js";
import {
  createLabTest,
  getLabTests,
  getLabTestById,
  updateLabTest,
  getLabStats,
} from "../controllers/labController.js";

const router = express.Router();

router.use(protect);

router.get("/stats", authorize("LabStaff", "Supervisor", "Admin"), getLabStats);
router
  .route("/")
  .get(authorize("LabStaff", "Doctor", "Admin", "Supervisor"), getLabTests)
  .post(
    authorize("LabStaff", "Doctor", "Admin", "Receptionist"),
    createLabTest,
  );

router
  .route("/:id")
  .get(authorize("LabStaff", "Doctor", "Admin"), getLabTestById)
  .put(authorize("LabStaff", "Admin"), updateLabTest);

export default router;
