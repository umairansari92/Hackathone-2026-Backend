import express from "express";
import { signup, login } from "../controllers/authController.js";
import upload from "../middleware/upload.js";

const router = express.Router();

// Define routes
router.post("/signup", upload.single("image"), signup);
router.post("/login", login);

export default router;
