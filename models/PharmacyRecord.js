import mongoose from "mongoose";

const medicineItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  quantity: { type: Number, default: 1 },
  unitPrice: { type: Number, default: 0 },
});

const pharmacyRecordSchema = new mongoose.Schema(
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
    prescriptionRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Prescription",
    },
    medicines: [medicineItemSchema],
    totalAmount: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["Pending", "Dispensed", "Cancelled"],
      default: "Pending",
    },
    dispensedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    notes: {
      type: String,
      default: "",
    },
  },
  { timestamps: true },
);

const PharmacyRecord = mongoose.model("PharmacyRecord", pharmacyRecordSchema);
export default PharmacyRecord;
