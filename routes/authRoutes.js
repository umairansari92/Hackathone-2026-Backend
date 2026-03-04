import express from "express";
import {
  signup,
  login,
  patientLogin,
  getMe,
} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";
import upload from "../middleware/upload.js";

const router = express.Router();

router.post("/signup", upload.single("image"), signup);
router.post("/login", login);
router.post("/patient-login", patientLogin);
router.get("/me", protect, getMe);

export default router;
