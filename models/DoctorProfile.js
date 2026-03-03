import mongoose from "mongoose";

const doctorProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    qualifications: {
      type: String,
      required: [true, "Please add qualifications"],
    },
    universityName: {
      type: String,
      required: [true, "Please add university name"],
    },
    universityCity: {
      type: String,
      required: [true, "Please add university city"],
    },
    speciality: {
      type: String,
      required: [true, "Please add speciality"],
    },
    experienceYears: {
      type: Number,
      required: [true, "Please add years of experience"],
    },
    licenseNumber: {
      type: String,
      required: [true, "Please add license number"],
      unique: true,
    },
    clinicRoomNumber: {
      type: String,
      required: [true, "Please add clinic room number"],
    },
    bio: {
      type: String,
      required: [true, "Please add a bio"],
    },
    documents: [
      {
        type: String,
      },
    ],
  },
  {
    timestamps: true,
  },
);

const DoctorProfile = mongoose.model("DoctorProfile", doctorProfileSchema);
export default DoctorProfile;
