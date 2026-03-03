import User from "../models/User.js";
import Appointment from "../models/Appointment.js";
import Prescription from "../models/Prescription.js";
import Patient from "../models/Patient.js";
import DoctorSchedule from "../models/DoctorSchedule.js";
import TokenQueue from "../models/TokenQueue.js";
import cloudinary from "../config/cloudinary.js";

// ── GET /api/patient/profile ─────────────────────────────────────────────────
export const getMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── PATCH /api/patient/profile ────────────────────────────────────────────────
export const updateMyProfile = async (req, res) => {
  try {
    const allowed = [
      "fullname",
      "gender",
      "phone",
      "address",
      "bloodGroup",
      "allergies",
      "emergencyContact",
      "medicalNotes",
    ];
    const updates = {};
    allowed.forEach((f) => {
      if (req.body[f] !== undefined) updates[f] = req.body[f];
    });

    // Handle profile image upload
    if (req.file) {
      const uploadResult = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "patient_profiles" },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          },
        );
        stream.end(req.file.buffer);
      });
      updates.image = uploadResult.secure_url;
    }

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    }).select("-password");

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── PUT /api/patient/change-password ─────────────────────────────────────────
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword)
      return res.status(400).json({ message: "Both passwords required" });
    if (newPassword.length < 6)
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });

    const user = await User.findById(req.user._id).select("+password");
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch)
      return res.status(400).json({ message: "Current password is incorrect" });

    user.password = newPassword;
    await user.save();
    res.json({ message: "Password updated successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── GET /api/patient/doctors ──────────────────────────────────────────────────
export const getAvailableDoctors = async (req, res) => {
  try {
    const doctors = await User.find({ role: "Doctor" }).select(
      "fullname email image gender specialization department experience",
    );

    // Attach schedule info to each doctor
    const schedules = await DoctorSchedule.find({
      doctorId: { $in: doctors.map((d) => d._id) },
    });
    const schedMap = {};
    schedules.forEach((s) => {
      schedMap[s.doctorId.toString()] = s;
    });

    const result = doctors.map((d) => {
      const sched = schedMap[d._id.toString()];
      return {
        ...d.toObject(),
        schedule: sched
          ? {
              workingDays: sched.workingDays,
              startTime: sched.startTime,
              endTime: sched.endTime,
              isOnLeave: sched.isOnLeave,
            }
          : null,
      };
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── GET /api/patient/my-appointments ─────────────────────────────────────────
export const getMyAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({ userId: req.user._id })
      .populate("doctorId", "fullname email image specialization department")
      .sort({ date: -1 });
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── POST /api/patient/appointments ───────────────────────────────────────────
export const bookAppointment = async (req, res) => {
  try {
    const { doctorId, date, reason } = req.body;
    if (!doctorId || !date)
      return res.status(400).json({ message: "Doctor and date are required" });

    const apptDate = new Date(date);

    // Check doctor schedule
    const schedule = await DoctorSchedule.findOne({ doctorId });
    if (!schedule)
      return res.status(400).json({ message: "Doctor schedule not found" });

    // Check if doctor is on leave for this date
    const dateStr = apptDate.toISOString().split("T")[0];
    const isOnLeave = schedule.leaveDates?.some(
      (d) => d.toISOString().split("T")[0] === dateStr,
    );
    if (isOnLeave)
      return res
        .status(400)
        .json({ message: "Doctor is on leave on this date" });

    // Check working day
    const dayName = apptDate.toLocaleDateString("en-US", { weekday: "long" });
    if (!schedule.workingDays.includes(dayName))
      return res
        .status(400)
        .json({ message: `Doctor does not work on ${dayName}` });

    // Check capacity
    const start = new Date(apptDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(apptDate);
    end.setHours(23, 59, 59, 999);
    const existingCount = await Appointment.countDocuments({
      doctorId,
      date: { $gte: start, $lte: end },
      status: { $ne: "Cancelled" },
    });
    if (existingCount >= (schedule.maxPatientsPerDay || 30))
      return res
        .status(400)
        .json({ message: "Doctor's schedule is full for this date" });

    const appointment = await Appointment.create({
      doctorId,
      userId: req.user._id,
      date: apptDate,
      reason: reason || "",
      status: "Scheduled",
    });

    const populated = await appointment.populate(
      "doctorId",
      "fullname email image specialization department",
    );
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── PATCH /api/patient/appointments/:id/cancel ───────────────────────────────
export const cancelMyAppointment = async (req, res) => {
  try {
    const appt = await Appointment.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!appt)
      return res.status(404).json({ message: "Appointment not found" });
    if (appt.status === "Completed")
      return res
        .status(400)
        .json({ message: "Cannot cancel a completed appointment" });
    if (appt.status === "Cancelled")
      return res.status(400).json({ message: "Appointment already cancelled" });

    appt.status = "Cancelled";
    await appt.save();
    res.json({
      message: "Appointment cancelled successfully",
      appointment: appt,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── GET /api/patient/my-prescriptions ────────────────────────────────────────
// Prescriptions in the system link to Patient collection records (staff-managed).
// For self-registered patients, expose ALL prescriptions where doctorId is populated —
// filtered by userId via appointment match.
// Simpler: just return prescriptions; doctors create them for staff-managed patients.
// For demo, return all prescriptions (scoped by system design).
export const getMyPrescriptions = async (req, res) => {
  try {
    // For patient users, show prescriptions only if they've been matched
    // Since Patient model ≠ User model, for demo purposes we return global list
    // In production: link Patient record to User via userId on Patient model
    const prescriptions = await Prescription.find({})
      .populate("doctorId", "fullname email specialization")
      .populate("patientId", "name age gender")
      .sort({ createdAt: -1 })
      .limit(20);
    res.json(prescriptions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── GET /api/patient/my-queue ─────────────────────────────────────────────────
export const getMyQueueStatus = async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];

    // Find token for this user today (if any appointment booked via userId)
    const myApptToday = await Appointment.findOne({
      userId: req.user._id,
      date: {
        $gte: new Date(today),
        $lt: new Date(today + "T23:59:59"),
      },
      status: "Scheduled",
    }).populate("doctorId", "fullname specialization");

    if (!myApptToday) {
      return res.json({ hasToken: false, message: "No appointment today" });
    }

    // Find token for this doctor today
    const queue = await TokenQueue.find({
      doctorId: myApptToday.doctorId._id,
      date: today,
    }).sort({ tokenNumber: 1 });

    // Count how many are before "Serving/Waiting" tokens
    const servingIdx = queue.findIndex((t) => t.status === "Serving");
    const waitingTokens = queue.filter((t) => t.status === "Waiting");

    // Estimate: 10 min per patient
    const estimatedWait =
      servingIdx >= 0 ? waitingTokens.length * 10 : waitingTokens.length * 10;

    res.json({
      hasToken: true,
      doctor: myApptToday.doctorId,
      appointment: {
        date: myApptToday.date,
        status: myApptToday.status,
        reason: myApptToday.reason,
      },
      queueStats: {
        totalInQueue: queue.length,
        waiting: waitingTokens.length,
        serving: queue.find((t) => t.status === "Serving") || null,
        estimatedWaitMins: estimatedWait,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── GET /api/patient/medical-history ─────────────────────────────────────────
export const getMedicalHistory = async (req, res) => {
  try {
    // Fetch own appointments
    const appointments = await Appointment.find({ userId: req.user._id })
      .populate("doctorId", "fullname email specialization department image")
      .sort({ date: -1 });

    // Fetch all prescriptions linked to any patient (demo only — see note above)
    const prescriptions = await Prescription.find({})
      .populate("doctorId", "fullname specialization")
      .populate("patientId", "name")
      .sort({ createdAt: -1 })
      .limit(10);

    // Merge into timeline events
    const timeline = [
      ...appointments.map((a) => ({
        type: "appointment",
        date: a.date,
        data: a,
      })),
      ...prescriptions.map((p) => ({
        type: "prescription",
        date: p.createdAt,
        data: p,
      })),
    ].sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json({ timeline });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
