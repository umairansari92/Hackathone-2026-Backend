import mongoose from "mongoose";

const diagnosisLogSchema = new mongoose.Schema(
  {
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    symptoms: {
      type: String,
      required: true,
    },
    aiResponse: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    riskLevel: {
      type: String,
      enum: ["Low", "Medium", "High", "Critical"],
      default: "Low",
    },
  },
  {
    timestamps: true,
  },
);

const DiagnosisLog = mongoose.model("DiagnosisLog", diagnosisLogSchema);
export default DiagnosisLog;
