import mongoose from "mongoose";
import bcrypt from "bcryptjs";

// Auto-generate UID: ALSH-YYYY-XXXXXX
const generateUID = async () => {
  const year = new Date().getFullYear();
  const prefix = `ALSH-${year}-`;
  // Count existing patients this year to get next number
  const count = await mongoose.model("Patient").countDocuments({
    uid: new RegExp(`^${prefix}`),
  });
  const seq = String(count + 1).padStart(6, "0");
  return `${prefix}${seq}`;
};

const patientSchema = new mongoose.Schema(
  {
    uid: {
      type: String,
      unique: true,
      index: true,
    },
    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
    },
    fatherOrHusbandName: {
      type: String,
      default: "",
      trim: true,
    },
    age: {
      type: Number,
      required: [true, "Age is required"],
      min: 0,
      max: 150,
    },
    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
      required: [true, "Gender is required"],
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
    },
    address: {
      type: String,
      default: "",
    },
    chronicConditions: {
      type: String,
      default: "",
    },
    allergies: {
      type: String,
      default: "",
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
        "Pharmacy",
        "",
      ],
      default: "General OPD",
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 6,
      select: false,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

// Auto-generate UID before saving (only on new documents)
patientSchema.pre("save", async function (next) {
  if (this.isNew && !this.uid) {
    this.uid = await generateUID();
  }
  // Hash password only if modified
  if (this.isModified("password")) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  next();
});

// Match password
patientSchema.methods.matchPassword = async function (entered) {
  return await bcrypt.compare(entered, this.password);
};

const Patient = mongoose.model("Patient", patientSchema);
export default Patient;
