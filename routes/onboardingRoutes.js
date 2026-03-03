import express from "express";
import { protect, authorize } from "../middleware/authMiddleware.js";
import upload from "../middleware/upload.js";
import {
  verifyInviteToken,
  registerDoctor,
} from "../controllers/doctorOnboardingController.js";
import {
  inviteDoctor,
  getPendingDoctors,
  approveDoctor,
  rejectDoctor,
} from "../controllers/adminOnboardingController.js";

const router = express.Router();

// Public onboarding routes
router.get("/doctor/verify-invite/:token", verifyInviteToken);
router.post("/doctor/register", upload.array("documents", 5), registerDoctor);

// Admin onboarding routes (Protected)
router.post("/admin/invite", protect, authorize("Admin"), inviteDoctor);
router.get("/admin/pending", protect, authorize("Admin"), getPendingDoctors);
router.patch("/admin/approve/:id", protect, authorize("Admin"), approveDoctor);
router.delete("/admin/reject/:id", protect, authorize("Admin"), rejectDoctor);

export default router;
