import mongoose from "mongoose";

const visitSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: [true, "Patient is required"],
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Doctor is required"],
    },
    department: {
      type: String,
      enum: [
        "General OPD",
        "Cardiology",
        "Dental",
        "Diabetology",
        "Lab",
        "Ultrasound",
        "",
      ],
      default: "General OPD",
    },
    visitDate: {
      type: Date,
      default: Date.now,
    },
    symptoms: {
      type: String,
      default: "",
    },
    diagnosis: {
      type: String,
      default: "",
    },
    notes: {
      type: String,
      default: "",
    },
    followUpDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: ["Scheduled", "In Progress", "Completed", "Cancelled"],
      default: "Scheduled",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true },
);

// Compound index for efficient patient history queries
visitSchema.index({ patientId: 1, visitDate: -1 });

const Visit = mongoose.model("Visit", visitSchema);
export default Visit;
