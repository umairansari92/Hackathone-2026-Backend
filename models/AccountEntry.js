import mongoose from "mongoose";

const accountEntrySchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["Income", "Expense"],
      required: true,
    },
    category: {
      type: String,
      enum: [
        "OPD Fee",
        "Lab Fee",
        "Ultrasound Fee",
        "Pharmacy Sale",
        "Consultation",
        "Staff Salary",
        "Utilities",
        "Supplies",
        "Equipment",
        "Other",
      ],
      default: "Other",
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: 0,
    },
    description: {
      type: String,
      default: "",
    },
    date: {
      type: Date,
      default: Date.now,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    referenceId: {
      type: String,
      default: "",
    },
  },
  { timestamps: true },
);

const AccountEntry = mongoose.model("AccountEntry", accountEntrySchema);
export default AccountEntry;
