import DoctorSchedule from "../models/DoctorSchedule.js";
import User from "../models/User.js";
import Appointment from "../models/Appointment.js";

// ─── Helper: get today's date in "YYYY-MM-DD" ───────────────────────────────
const dateStr = (d = new Date()) => d.toISOString().split("T")[0];

// @desc    Get all doctor schedules (for receptionist / admin)
// @route   GET /api/schedule
export const getAllSchedules = async (req, res) => {
  try {
    const schedules = await DoctorSchedule.find().populate(
      "doctorId",
      "fullname email specialization",
    );
    res.json(schedules);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Get schedule for a specific doctor
// @route   GET /api/schedule/:doctorId
export const getDoctorSchedule = async (req, res) => {
  try {
    let schedule = await DoctorSchedule.findOne({
      doctorId: req.params.doctorId,
    }).populate("doctorId", "fullname email specialization");

    if (!schedule) {
      // No schedule configured yet — return nulls so frontend shows "Not Set"
      const doctor = await User.findById(req.params.doctorId).select(
        "fullname email",
      );
      return res.json({
        doctorId: doctor,
        workingDays: [],
        startTime: null,
        endTime: null,
        maxPatientsPerDay: null,
        isOnLeave: false,
        leaveDate: null,
        leaveDates: [],
        notConfigured: true,
      });
    }

    res.json(schedule);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Create or update doctor schedule (Admin only)
// @route   POST /api/schedule
export const upsertSchedule = async (req, res) => {
  try {
    const {
      doctorId,
      workingDays,
      startTime,
      endTime,
      maxPatientsPerDay,
      isOnLeave,
      leaveDate,
      leaveDates,
    } = req.body;

    const schedule = await DoctorSchedule.findOneAndUpdate(
      { doctorId },
      {
        workingDays,
        startTime,
        endTime,
        maxPatientsPerDay,
        isOnLeave,
        leaveDate,
        leaveDates,
      },
      { new: true, upsert: true },
    ).populate("doctorId", "fullname email specialization");

    res.status(201).json(schedule);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Mark doctor on leave for today or specific date (Receptionist)
// @route   PATCH /api/schedule/:doctorId/leave
export const markLeave = async (req, res) => {
  try {
    const { isOnLeave, leaveDate } = req.body;
    const date = leaveDate ? new Date(leaveDate) : new Date();

    const schedule = await DoctorSchedule.findOneAndUpdate(
      { doctorId: req.params.doctorId },
      {
        isOnLeave,
        leaveDate: isOnLeave ? date : null,
        $addToSet: isOnLeave ? { leaveDates: date } : undefined,
      },
      { new: true, upsert: true },
    ).populate("doctorId", "fullname email");

    res.json(schedule);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Check if a doctor is available on a given date
// @route   GET /api/schedule/:doctorId/availability?date=YYYY-MM-DD
export const checkAvailability = async (req, res) => {
  try {
    const { date } = req.query;
    const checkDate = date ? new Date(date) : new Date();
    const dayName = checkDate.toLocaleDateString("en-US", { weekday: "long" });

    const schedule = await DoctorSchedule.findOne({
      doctorId: req.params.doctorId,
    });

    if (!schedule) {
      return res.json({
        available: true,
        reason: null,
        workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        dayName,
      });
    }

    // Check if day is a working day
    if (!schedule.workingDays.includes(dayName)) {
      return res.json({
        available: false,
        reason: `Doctor doesn't work on ${dayName}`,
        dayName,
      });
    }

    // Check leave
    const leaveDateStr = schedule.leaveDate
      ? dateStr(schedule.leaveDate)
      : null;
    const onLeaveToday =
      schedule.isOnLeave && leaveDateStr === dateStr(checkDate);
    const onLeaveDate = schedule.leaveDates?.some(
      (d) => dateStr(new Date(d)) === dateStr(checkDate),
    );

    if (onLeaveToday || onLeaveDate) {
      return res.json({
        available: false,
        reason: "Doctor is on leave this day",
        dayName,
      });
    }

    // Check patient count vs max
    const todayStr = dateStr(checkDate);
    const tokenCount = await (
      await import("../models/TokenQueue.js")
    ).default.countDocuments({
      doctorId: req.params.doctorId,
      date: todayStr,
      status: { $ne: "Cancelled" },
    });

    if (tokenCount >= schedule.maxPatientsPerDay) {
      return res.json({
        available: false,
        reason: `Doctor's daily limit reached (${schedule.maxPatientsPerDay} patients)`,
        tokenCount,
        maxPatientsPerDay: schedule.maxPatientsPerDay,
        dayName,
      });
    }

    res.json({
      available: true,
      reason: null,
      dayName,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      maxPatientsPerDay: schedule.maxPatientsPerDay,
      currentBookings: tokenCount,
      slotsRemaining: schedule.maxPatientsPerDay - tokenCount,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
