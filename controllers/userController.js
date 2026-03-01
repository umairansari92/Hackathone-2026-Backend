import User from "../models/User.js";

// @desc    Get all users (with optional role filter)
// @route   GET /api/users
// @access  Admin only
export const getAllUsers = async (req, res) => {
  try {
    const { role } = req.query;
    const filter = role ? { role } : {};
    const users = await User.find(filter)
      .select("-password")
      .sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a Doctor account
// @route   POST /api/users/doctor
// @access  Admin only
export const createDoctor = async (req, res) => {
  try {
    const { fullname, email, password, gender, specialization } = req.body;

    const exists = await User.findOne({ email });
    if (exists)
      return res
        .status(400)
        .json({ message: "User already exists with this email" });

    const doctor = await User.create({
      fullname,
      email,
      password,
      gender,
      role: "Doctor",
      specialization,
      subscriptionPlan: "Free",
    });

    res.status(201).json({
      _id: doctor._id,
      fullname: doctor.fullname,
      email: doctor.email,
      role: doctor.role,
      gender: doctor.gender,
      subscriptionPlan: doctor.subscriptionPlan,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a Receptionist account
// @route   POST /api/users/receptionist
// @access  Admin only
export const createReceptionist = async (req, res) => {
  try {
    const { fullname, email, password, gender } = req.body;

    const exists = await User.findOne({ email });
    if (exists)
      return res
        .status(400)
        .json({ message: "User already exists with this email" });

    const receptionist = await User.create({
      fullname,
      email,
      password,
      gender,
      role: "Receptionist",
      subscriptionPlan: "Free",
    });

    res.status(201).json({
      _id: receptionist._id,
      fullname: receptionist.fullname,
      email: receptionist.email,
      role: receptionist.role,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a user
// @route   DELETE /api/users/:id
// @access  Admin only
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.role === "Admin")
      return res.status(403).json({ message: "Cannot delete Admin" });

    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a user's subscription plan
// @route   PUT /api/users/:id/subscription
// @access  Admin only
export const updateSubscription = async (req, res) => {
  try {
    const { subscriptionPlan } = req.body;
    if (!["Free", "Pro"].includes(subscriptionPlan)) {
      return res
        .status(400)
        .json({ message: "Invalid plan. Must be Free or Pro" });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { subscriptionPlan },
      { new: true },
    ).select("-password");

    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user role (suspend = change to Patient)
// @route   PUT /api/users/:id/role
// @access  Admin only
export const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    const validRoles = ["Admin", "Doctor", "Receptionist", "Patient"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true },
    ).select("-password");

    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
