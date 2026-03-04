import express from "express";
import { protect, authorize } from "../middleware/authMiddleware.js";
import {
  createEntry,
  getEntries,
  getSummary,
  deleteEntry,
} from "../controllers/accountController.js";

const router = express.Router();

router.use(protect);

router.get(
  "/summary",
  authorize("Accountant", "Admin", "Supervisor"),
  getSummary,
);
router
  .route("/")
  .get(authorize("Accountant", "Admin", "Supervisor"), getEntries)
  .post(authorize("Accountant", "Admin"), createEntry);

router.route("/:id").delete(authorize("Admin"), deleteEntry);

export default router;
