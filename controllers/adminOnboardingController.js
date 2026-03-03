import User from "../models/User.js";
import DoctorProfile from "../models/DoctorProfile.js";
import DoctorInvite from "../models/DoctorInvite.js";
import crypto from "crypto";
import sendEmail from "../utils/sendEmail.js";

// ── ADMIN FLOW ───────────────────────────────────────────────────────────────

// @desc    Invite a doctor
// @route   POST /api/onboarding/admin/invite
// @access  Private (Admin)
export const inviteDoctor = async (req, res) => {
  try {
    const { email } = req.body;

    // Check if invite already exists
    const existingInvite = await DoctorInvite.findOne({ email, used: false });
    if (existingInvite && existingInvite.expiresAt > Date.now()) {
      return res
        .status(400)
        .json({ message: "Invite already sent and still active" });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours

    await DoctorInvite.create({
      email,
      inviteToken: token,
      expiresAt,
      createdBy: req.user._id,
    });

    const inviteLink = `${process.env.CLIENT_URL}/doctor-register?token=${token}`;

    const message = `Hello,\n\nYou have been invited to join the AI Clinic Management System as a Doctor.\n\nPlease click on the link below to complete your registration:\n\n${inviteLink}\n\nThis link will expire in 48 hours.`;
    const html = `
      <h1>Doctor Invitation</h1>
      <p>You have been invited to join our platform.</p>
      <a href="${inviteLink}" style="padding: 10px 20px; background: #0d9488; color: white; text-decoration: none; border-radius: 5px;">Register Now</a>
      <p>Or copy this link: ${inviteLink}</p>
      <p>This invite expires in 48 hours.</p>
    `;

    await sendEmail({
      email,
      subject: "Invitation to join AI Clinic",
      message,
      html,
    });

    res.status(200).json({ message: "Invite sent successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get pending doctor requests
// @route   GET /api/onboarding/admin/pending
// @access  Private (Admin)
export const getPendingDoctors = async (req, res) => {
  try {
    const pendingUsers = await User.find({
      role: "Doctor",
      status: "Pending",
    }).select("-password");

    // Get profiles for these users
    const profiles = await DoctorProfile.find({
      userId: { $in: pendingUsers.map((u) => u._id) },
    });

    const results = pendingUsers.map((user) => {
      const profile = profiles.find(
        (p) => p.userId.toString() === user._id.toString(),
      );
      return {
        ...user.toObject(),
        profile: profile || null,
      };
    });

    res.json(results);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Approve a doctor
// @route   PATCH /api/onboarding/admin/approve/:id
// @access  Private (Admin)
export const approveDoctor = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.status = "Approved";
    await user.save();

    await sendEmail({
      email: user.email,
      subject: "Account Approved - AI Clinic",
      message:
        "Congratulations! Your doctor account has been approved. You can now login.",
      html: "<h1>Welcome!</h1><p>Your account is now active.</p>",
    });

    res.json({ message: "Doctor approved successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Reject a doctor
// @route   DELETE /api/onboarding/admin/reject/:id
// @access  Private (Admin)
export const rejectDoctor = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const email = user.email;

    // Delete profile and user
    await DoctorProfile.findOneAndDelete({ userId: user._id });
    await User.findByIdAndDelete(user._id);

    await sendEmail({
      email,
      subject: "Account Update - AI Clinic",
      message:
        "We regret to inform you that your application has been rejected.",
      html: "<h1>Update</h1><p>Your application was not approved at this time.</p>",
    });

    res.json({ message: "Doctor rejected and removed" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
