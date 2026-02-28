import Prescription from "../models/Prescription.js";

// @desc    Get prescriptions
// @route   GET /api/prescriptions
// @access  Private
export const getPrescriptions = async (req, res) => {
  try {
    let query = {};
    if (req.user.role === "Doctor") {
      query.doctorId = req.user._id;
    } else if (req.user.role === "Patient") {
      query.patientId = req.user._id;
    }

    const prescriptions = await Prescription.find(query)
      .populate("patientId", "name age gender")
      .populate("doctorId", "fullname email");
    res.json(prescriptions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create prescription
// @route   POST /api/prescriptions
// @access  Private (Doctor)
export const createPrescription = async (req, res) => {
  try {
    const { patientId, medicines, instructions, pdfUrl } = req.body;

    const prescription = new Prescription({
      patientId,
      doctorId: req.user._id, // Set to currently logged-in doctor
      medicines,
      instructions,
      pdfUrl,
    });

    const createdPrescription = await prescription.save();
    res.status(201).json(createdPrescription);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
