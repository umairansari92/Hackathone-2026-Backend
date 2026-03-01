import mongoose from "mongoose";

const doctorScheduleSchema = new mongoose.Schema(
  {
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    workingDays: {
      type: [String],
      enum: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ],
      default: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    },
    startTime: {
      type: String, // e.g. "09:00"
      required: true,
      default: "09:00",
    },
    endTime: {
      type: String, // e.g. "17:00"
      required: true,
      default: "17:00",
    },
    maxPatientsPerDay: {
      type: Number,
      default: 30,
      min: 1,
    },
    isOnLeave: {
      type: Boolean,
      default: false,
    },
    leaveDate: {
      type: Date,
      default: null,
    },
    leaveDates: {
      type: [Date], // multiple leave dates support
      default: [],
    },
  },
  { timestamps: true },
);

const DoctorSchedule = mongoose.model("DoctorSchedule", doctorScheduleSchema);
export default DoctorSchedule;
