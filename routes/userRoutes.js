import express from "express";
import { protect, authorize } from "../middleware/authMiddleware.js";
import {
  getAllUsers,
  createDoctor,
  createReceptionist,
  deleteUser,
  updateSubscription,
  updateUserRole,
} from "../controllers/userController.js";

const router = express.Router();

// All user routes require authentication + Admin role
router.use(protect, authorize("Admin"));

router.get("/", getAllUsers);
router.post("/doctor", createDoctor);
router.post("/receptionist", createReceptionist);
router.delete("/:id", deleteUser);
router.put("/:id/subscription", updateSubscription);
router.put("/:id/role", updateUserRole);

export default router;
