// seedUsers.js — Run once to create test users
// Usage: node seedUsers.js
import mongoose from "mongoose";
import User from "./models/User.js";
import dotenv from "dotenv";
dotenv.config();

const MONGO_URI = process.env.MONGODB_URI;

const TEST_USERS = [
  {
    fullname: "Super Admin",
    email: "admin@medclinic.com",
    password: "password123",
    gender: "Male",
    role: "Admin",
  },
  {
    fullname: "Dr. Sarah Jenkins",
    email: "doctor@medclinic.com",
    password: "password123",
    gender: "Female",
    role: "Doctor",
  },
  {
    fullname: "Ali Receptionist",
    email: "receptionist@medclinic.com",
    password: "password123",
    gender: "Male",
    role: "Receptionist",
  },
  {
    fullname: "Umair Ahmed",
    email: "patient@medclinic.com",
    password: "password123",
    gender: "Male",
    role: "Patient",
  },
];

const seed = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ MongoDB Connected");

    for (const userData of TEST_USERS) {
      const exists = await User.findOne({ email: userData.email });
      if (exists) {
        // Update role in case user exists with wrong role
        await User.updateOne(
          { email: userData.email },
          { role: userData.role },
        );
        console.log(
          `⚠️  Updated role for ${userData.email} → ${userData.role}`,
        );
      } else {
        await User.create(userData);
        console.log(`✅ Created: ${userData.email} (${userData.role})`);
      }
    }

    console.log("\n🎉 Seed complete! Login credentials:");
    TEST_USERS.forEach((u) =>
      console.log(`  ${u.role.padEnd(15)} → ${u.email} / ${u.password}`),
    );
    process.exit(0);
  } catch (err) {
    console.error("❌ Seed failed:", err.message);
    process.exit(1);
  }
};

seed();
