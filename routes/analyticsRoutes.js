import express from "express";
import { getStats } from "../controllers/analyticsController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

router.route("/stats").get(protect, authorize("Admin", "Doctor"), getStats);

export default router;
