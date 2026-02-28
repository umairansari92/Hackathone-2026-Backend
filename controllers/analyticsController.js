import User from "../models/User.js";
import Patient from "../models/Patient.js";
import Appointment from "../models/Appointment.js";
import Prescription from "../models/Prescription.js";

// @desc    Get dashboard stats
// @route   GET /api/analytics/stats
// @access  Private (Admin, Doctor)
export const getStats = async (req, res) => {
  try {
    const role = req.user.role;
    let stats = {};

    if (role === "Admin") {
      const totalPatients = await Patient.countDocuments();
      const totalDoctors = await User.countDocuments({ role: "Doctor" });
      const totalAppointments = await Appointment.countDocuments();
      const totalPrescriptions = await Prescription.countDocuments();

      stats = {
        totalPatients,
        totalDoctors,
        totalAppointments,
        totalPrescriptions,
      };
    } else if (role === "Doctor") {
      const doctorId = req.user._id;
      // Patients assigned to this doctor (simplification: any patient they have an appointment with)
      const uniquePatients = await Appointment.distinct("patientId", {
        doctorId,
      });
      const totalPatients = uniquePatients.length;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const dailyAppointments = await Appointment.countDocuments({
        doctorId,
        date: { $gte: today, $lt: tomorrow },
      });
      const totalPrescriptions = await Prescription.countDocuments({
        doctorId,
      });

      stats = {
        totalPatients,
        dailyAppointments,
        totalPrescriptions,
      };
    } else {
      return res.status(403).json({ message: "Not authorized for analytics" });
    }

    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
