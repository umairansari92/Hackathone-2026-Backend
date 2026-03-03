import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
    },
    // userId: populated when Patient books via their own account
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    date: {
      type: Date,
      required: [true, "Please add an appointment date"],
    },
    status: {
      type: String,
      enum: ["Scheduled", "Completed", "Cancelled"],
      default: "Scheduled",
    },
    reason: { type: String, default: "" },
  },
  {
    timestamps: true,
  },
);

const Appointment = mongoose.model("Appointment", appointmentSchema);
export default Appointment;
