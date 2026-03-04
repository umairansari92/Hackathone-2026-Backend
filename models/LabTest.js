import mongoose from "mongoose";

const labTestSchema = new mongoose.Schema(
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
    testName: {
      type: String,
      required: [true, "Test name is required"],
    },
    testType: {
      type: String,
      enum: ["Blood", "Urine", "Stool", "Culture", "Biopsy", "Other"],
      default: "Blood",
    },
    status: {
      type: String,
      enum: ["Pending", "Processing", "Done", "Cancelled"],
      default: "Pending",
    },
    result: {
      type: String,
      default: "",
    },
    reportUrl: {
      type: String,
      default: "",
    },
    fee: {
      type: Number,
      default: 0,
    },
    department: {
      type: String,
      default: "Lab",
    },
    notes: {
      type: String,
      default: "",
    },
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true },
);

const LabTest = mongoose.model("LabTest", labTestSchema);
export default LabTest;
