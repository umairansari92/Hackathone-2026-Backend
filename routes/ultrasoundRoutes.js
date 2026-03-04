import express from "express";
import { protect, authorize } from "../middleware/authMiddleware.js";
import {
  createUltrasound,
  getUltrasounds,
  getUltrasoundById,
  updateUltrasound,
  getUltrasoundStats,
} from "../controllers/ultrasoundController.js";

const router = express.Router();

router.use(protect);

router.get(
  "/stats",
  authorize("Doctor", "Admin", "Supervisor"),
  getUltrasoundStats,
);
router
  .route("/")
  .get(
    authorize("Doctor", "Admin", "Supervisor", "Receptionist"),
    getUltrasounds,
  )
  .post(authorize("Doctor", "Admin", "Receptionist"), createUltrasound);

router
  .route("/:id")
  .get(authorize("Doctor", "Admin"), getUltrasoundById)
  .put(authorize("Doctor", "Admin"), updateUltrasound);

export default router;
