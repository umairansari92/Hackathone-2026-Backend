import User from "../models/User.js";
import DoctorProfile from "../models/DoctorProfile.js";
import DoctorInvite from "../models/DoctorInvite.js";
import cloudinary from "../config/cloudinary.js";
import crypto from "crypto";

// ── DOCTOR FLOW ──────────────────────────────────────────────────────────────

// @desc    Verify invite token
// @route   GET /api/onboarding/doctor/verify-invite/:token
// @access  Public
export const verifyInviteToken = async (req, res) => {
  try {
    const invite = await DoctorInvite.findOne({
      inviteToken: req.params.token,
      used: false,
      expiresAt: { $gt: Date.now() },
    });

    if (!invite) {
      return res
        .status(400)
        .json({ message: "Invalid or expired invite token" });
    }

    res.json({ email: invite.email });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Register a doctor (Self or via Invite)
// @route   POST /api/onboarding/doctor/register
// @access  Public
export const registerDoctor = async (req, res) => {
  try {
    const {
      fullname,
      email,
      password,
      gender,
      token, // Optional for invite flow
      qualifications,
      universityName,
      universityCity,
      speciality,
      experienceYears,
      licenseNumber,
      clinicRoomNumber,
      bio,
    } = req.body;

    // 1. Validate if invite token provided
    let invite = null;
    if (token) {
      invite = await DoctorInvite.findOne({
        inviteToken: token,
        used: false,
        expiresAt: { $gt: Date.now() },
      });
      if (!invite)
        return res.status(400).json({ message: "Invalid/Expired Token" });
      if (invite.email !== email)
        return res.status(400).json({ message: "Email mismatch" });
    }

    // 2. Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists)
      return res.status(400).json({ message: "User already exists" });

    // 3. Handle document uploads (degree certificate, etc)
    let documentUrls = [];
    if (req.files && req.files.length > 0) {
      const uploadPromises = req.files.map((file) => {
        return new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { folder: "doctor_docs" },
            (error, result) => {
              if (error) reject(error);
              else resolve(result.secure_url);
            },
          );
          stream.end(file.buffer);
        });
      });
      documentUrls = await Promise.all(uploadPromises);
    }

    // 4. Create User (Pending Status)
    const user = await User.create({
      fullname,
      email,
      password,
      gender,
      role: "Doctor",
      status: "Pending", // Always pending until admin approves
      subscriptionPlan: "Pro", // Assuming doctors get Pro trial
    });

    // 5. Create Doctor Profile
    await DoctorProfile.create({
      userId: user._id,
      qualifications,
      universityName,
      universityCity,
      speciality,
      experienceYears,
      licenseNumber,
      clinicRoomNumber,
      bio,
      documents: documentUrls,
    });

    // 6. Mark invite as used
    if (invite) {
      invite.used = true;
      await invite.save();
    }

    res.status(201).json({
      message: "Registration successful. Please wait for admin approval.",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
