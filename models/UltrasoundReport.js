import mongoose from "mongoose";

const ultrasoundSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      index: true,
    },
    visitId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Visit",
      index: true,
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    scanType: {
      type: String,
      enum: [
        "Abdominal",
        "Pelvic",
        "Obstetric",
        "Thyroid",
        "Cardiac Echo",
        "Musculoskeletal",
        "Other",
      ],
      required: true,
    },
    findings: {
      type: String,
      default: "",
    },
    impression: {
      type: String,
      default: "",
    },
    imageUrl: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["Pending", "In Progress", "Reported", "Cancelled"],
      default: "Pending",
    },
    fee: {
      type: Number,
      default: 0,
    },
    notes: {
      type: String,
      default: "",
    },
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true },
);

const UltrasoundReport = mongoose.model("UltrasoundReport", ultrasoundSchema);
export default UltrasoundReport;
