import TokenQueue, { TokenCounter } from "../models/TokenQueue.js";
import Appointment from "../models/Appointment.js";
import DoctorSchedule from "../models/DoctorSchedule.js";
import mongoose from "mongoose";

const dateStr = (d = new Date()) => d.toISOString().split("T")[0];

// ─── Atomic token number increment ────────────────────────────────────────────
async function getNextToken(doctorId, date) {
  const key = `${doctorId}_${date}`;
  const result = await TokenCounter.findByIdAndUpdate(
    key,
    { $inc: { counter: 1 } },
    { new: true, upsert: true },
  );
  return result.counter;
}

// @desc    Get today's token queue for a doctor
// @route   GET /api/tokens/queue?doctorId=&date=
export const getTodayQueue = async (req, res) => {
  try {
    const { doctorId, date } = req.query;
    const today = date || dateStr();

    const filter = { date: today };
    if (doctorId) filter.doctorId = doctorId;

    const queue = await TokenQueue.find(filter)
      .populate("patientId", "name age gender contact")
      .populate("doctorId", "fullname specialization")
      .populate("createdBy", "fullname")
      .sort({ tokenNumber: 1 });

    res.json(queue);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Generate a token and optionally create an appointment
// @route   POST /api/tokens/generate
export const generateToken = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { doctorId, patientId, date } = req.body;
    const tokenDate = date || dateStr();

    // 1. Check doctor availability
    const schedule = await DoctorSchedule.findOne({ doctorId });
    if (schedule) {
      const checkDate = new Date(tokenDate);
      const dayName = checkDate.toLocaleDateString("en-US", {
        weekday: "long",
      });

      if (!schedule.workingDays.includes(dayName)) {
        await session.abortTransaction();
        return res
          .status(400)
          .json({ message: `Doctor doesn't work on ${dayName}` });
      }

      // Check leave
      const leaveDateStr = schedule.leaveDate
        ? dateStr(schedule.leaveDate)
        : null;
      const onLeave =
        (schedule.isOnLeave && leaveDateStr === tokenDate) ||
        schedule.leaveDates?.some((d) => dateStr(new Date(d)) === tokenDate);
      if (onLeave) {
        await session.abortTransaction();
        return res
          .status(400)
          .json({
            message: "Doctor is on leave this day. Cannot generate token.",
          });
      }

      // Check max limit
      const existingCount = await TokenQueue.countDocuments({
        doctorId,
        date: tokenDate,
        status: { $ne: "Cancelled" },
      });
      if (existingCount >= schedule.maxPatientsPerDay) {
        await session.abortTransaction();
        return res
          .status(400)
          .json({
            message: `Doctor's daily limit of ${schedule.maxPatientsPerDay} patients reached.`,
          });
      }
    }

    // 2. Generate atomic token number
    const tokenNumber = await getNextToken(doctorId, tokenDate);

    // 3. Create appointment
    const appointment = await Appointment.create(
      [
        {
          patientId,
          doctorId,
          date: new Date(tokenDate),
          status: "Scheduled",
        },
      ],
      { session },
    );

    // 4. Create token
    const token = await TokenQueue.create(
      [
        {
          doctorId,
          patientId,
          appointmentId: appointment[0]._id,
          tokenNumber,
          date: tokenDate,
          status: "Waiting",
          createdBy: req.user._id,
        },
      ],
      { session },
    );

    await session.commitTransaction();

    const populated = await TokenQueue.findById(token[0]._id)
      .populate("patientId", "name age gender contact")
      .populate("doctorId", "fullname specialization")
      .populate("createdBy", "fullname");

    res.status(201).json(populated);
  } catch (err) {
    await session.abortTransaction();
    res.status(500).json({ message: err.message });
  } finally {
    session.endSession();
  }
};

// @desc    Update token status (arrived, serving, completed, cancelled)
// @route   PATCH /api/tokens/:id/status
export const updateTokenStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ["Waiting", "Serving", "Completed", "Cancelled"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const updates = { status };
    if (status === "Serving") updates.arrivedAt = new Date();
    if (status === "Completed") updates.completedAt = new Date();

    const token = await TokenQueue.findByIdAndUpdate(req.params.id, updates, {
      new: true,
    })
      .populate("patientId", "name age gender contact")
      .populate("doctorId", "fullname specialization");

    if (!token) return res.status(404).json({ message: "Token not found" });

    // Update appointment status too
    if (token.appointmentId) {
      const apptStatus =
        status === "Completed"
          ? "Completed"
          : status === "Cancelled"
            ? "Cancelled"
            : "Scheduled";
      await Appointment.findByIdAndUpdate(token.appointmentId, {
        status: apptStatus,
      });
    }

    res.json(token);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Call next waiting patient (set oldest Waiting → Serving)
// @route   POST /api/tokens/call-next
export const callNextPatient = async (req, res) => {
  try {
    const { doctorId } = req.body;
    const today = dateStr();

    // First set any current "Serving" token to "Completed"
    await TokenQueue.updateMany(
      { doctorId, date: today, status: "Serving" },
      { status: "Completed", completedAt: new Date() },
    );

    // Find next Waiting
    const next = await TokenQueue.findOneAndUpdate(
      { doctorId, date: today, status: "Waiting" },
      { status: "Serving", arrivedAt: new Date() },
      { new: true, sort: { tokenNumber: 1 } },
    )
      .populate("patientId", "name age gender contact")
      .populate("doctorId", "fullname");

    if (!next) return res.status(404).json({ message: "No patients waiting" });

    res.json(next);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Reset all tokens for a doctor for today (manual reset)
// @route   POST /api/tokens/reset
export const resetTokens = async (req, res) => {
  try {
    const { doctorId, date } = req.body;
    const resetDate = date || dateStr();

    // Cancel all non-completed tokens
    await TokenQueue.updateMany(
      { doctorId, date: resetDate, status: { $in: ["Waiting", "Serving"] } },
      { status: "Cancelled" },
    );

    // Reset token counter
    const key = `${doctorId}_${resetDate}`;
    await TokenCounter.findByIdAndUpdate(key, { counter: 0 });

    res.json({
      message: `Tokens reset for ${resetDate}`,
      doctorId,
      date: resetDate,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Get dashboard stats for receptionist
// @route   GET /api/tokens/dashboard
export const getReceptionistDashboard = async (req, res) => {
  try {
    const today = dateStr();

    const [waiting, serving, completed, cancelled, totalToday] =
      await Promise.all([
        TokenQueue.countDocuments({ date: today, status: "Waiting" }),
        TokenQueue.countDocuments({ date: today, status: "Serving" }),
        TokenQueue.countDocuments({ date: today, status: "Completed" }),
        TokenQueue.countDocuments({ date: today, status: "Cancelled" }),
        TokenQueue.countDocuments({ date: today }),
      ]);

    // Doctor availability summary
    const doctors = await DoctorSchedule.find().populate(
      "doctorId",
      "fullname specialization",
    );

    const doctorAvailability = doctors.map((s) => {
      const dayName = new Date().toLocaleDateString("en-US", {
        weekday: "long",
      });
      const leaveDateStr = s.leaveDate ? dateStr(s.leaveDate) : null;
      const onLeave =
        (s.isOnLeave && leaveDateStr === today) ||
        s.leaveDates?.some((d) => dateStr(new Date(d)) === today);
      const isWorkingDay = s.workingDays.includes(dayName);
      return {
        doctor: s.doctorId,
        available: isWorkingDay && !onLeave,
        reason: !isWorkingDay
          ? `Off on ${dayName}`
          : onLeave
            ? "On Leave"
            : null,
      };
    });

    res.json({
      waiting,
      serving,
      completed,
      cancelled,
      totalToday,
      doctorAvailability,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
