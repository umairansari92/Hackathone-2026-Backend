import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    fullname: {
      type: String,
      required: [true, "Please add a name"],
    },
    email: {
      type: String,
      required: [true, "Please add an email"],
      unique: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please add a valid email",
      ],
    },
    password: {
      type: String,
      required: [true, "Please add a password"],
      minlength: 6,
      select: false,
    },
    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
      required: [true, "Please add a gender"],
    },
    image: {
      type: String,
      default: "no-photo.jpg",
    },
    role: {
      type: String,
      enum: [
        "Admin",
        "Doctor",
        "Nurse",
        "Receptionist",
        "LabStaff",
        "Pharmacist",
        "Accountant",
        "Supervisor",
        "Patient",
      ],
      default: "Patient",
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
      default: "",
    },
    subscriptionPlan: {
      type: String,
      enum: ["Free", "Pro"],
      default: "Free",
    },
    // Patient extended profile fields
    phone: { type: String, default: "" },
    address: { type: String, default: "" },
    bloodGroup: {
      type: String,
      enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", ""],
      default: "",
    },
    allergies: { type: String, default: "" },
    emergencyContact: { type: String, default: "" },
    medicalNotes: { type: String, default: "" },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Approved",
    },
  },
  {
    timestamps: true,
  },
);

// Encrypt password using bcrypt
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model("User", userSchema);
export default User;
