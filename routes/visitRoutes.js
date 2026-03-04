import express from "express";
import { protect, authorize } from "../middleware/authMiddleware.js";
import {
  createVisit,
  getVisits,
  getVisitsByPatient,
  getVisitById,
  updateVisit,
} from "../controllers/visitController.js";

const router = express.Router();

router.use(protect);

router
  .route("/")
  .get(
    authorize("Admin", "Doctor", "Supervisor", "Nurse", "Receptionist"),
    getVisits,
  )
  .post(authorize("Admin", "Doctor", "Receptionist"), createVisit);

router.get(
  "/patient/:patientId",
  authorize("Admin", "Doctor", "Nurse", "Supervisor", "Receptionist"),
  getVisitsByPatient,
);

router
  .route("/:id")
  .get(authorize("Admin", "Doctor", "Nurse", "Supervisor"), getVisitById)
  .put(authorize("Admin", "Doctor"), updateVisit);

export default router;
