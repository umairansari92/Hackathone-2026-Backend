import Appointment from "../models/Appointment.js";
import Patient from "../models/Patient.js"; // required for populate()

// @desc    Get all appointments
// @route   GET /api/appointments
// @access  Private
export const getAppointments = async (req, res) => {
  try {
    let query = {};
    if (req.user.role === "Doctor") {
      query.doctorId = req.user._id;
    } else if (req.user.role === "Patient") {
      query.patientId = req.user._id;
    }

    const appointments = await Appointment.find(query)
      .populate("patientId", "name age gender contact")
      .populate("doctorId", "fullname email");
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create an appointment
// @route   POST /api/appointments
// @access  Private (Admin, Receptionist, Patient)
export const createAppointment = async (req, res) => {
  try {
    const { patientId, doctorId, date } = req.body;

    const appointment = new Appointment({
      patientId,
      doctorId,
      date,
    });

    const createdAppointment = await appointment.save();
    res.status(201).json(createdAppointment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update appointment status
// @route   PUT /api/appointments/:id/status
// @access  Private (Admin, Doctor, Receptionist)
export const updateAppointmentStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const appointment = await Appointment.findById(req.params.id);

    if (appointment) {
      appointment.status = status;
      const updatedAppointment = await appointment.save();
      res.json(updatedAppointment);
    } else {
      res.status(404).json({ message: "Appointment not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
