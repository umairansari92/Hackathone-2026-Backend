import mongoose from "mongoose";

// ─── Atomic daily counter helper ─────────────────────────────────────────────
// We track the last token number per doctor per date using a separate counter collection.
// This ensures no duplicate tokens even under concurrent requests.

const tokenCounterSchema = new mongoose.Schema({
  _id: { type: String }, // "doctorId_YYYY-MM-DD"
  counter: { type: Number, default: 0 },
});
export const TokenCounter = mongoose.model("TokenCounter", tokenCounterSchema);

// ─── TokenQueue ───────────────────────────────────────────────────────────────

const tokenQueueSchema = new mongoose.Schema(
  {
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
    },
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
      default: null,
    },
    tokenNumber: {
      type: Number,
      required: true,
    },
    date: {
      type: String, // "YYYY-MM-DD" — makes daily queries easy
      required: true,
    },
    status: {
      type: String,
      enum: ["Waiting", "Serving", "Completed", "Cancelled"],
      default: "Waiting",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Receptionist
      required: true,
    },
    arrivedAt: {
      type: Date,
      default: null,
    },
    servedAt: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

// Compound index for uniqueness: no duplicate tokens per doctor per day
tokenQueueSchema.index(
  { doctorId: 1, date: 1, tokenNumber: 1 },
  { unique: true },
);

const TokenQueue = mongoose.model("TokenQueue", tokenQueueSchema);
export default TokenQueue;
