import DiagnosisLog from "../models/DiagnosisLog.js";

// @desc    Save a diagnosis log
// @route   POST /api/diagnosis
// @access  Doctor only
export const saveDiagnosis = async (req, res) => {
  try {
    const { symptoms, age, gender, history, aiResponse, riskLevel, patientId } =
      req.body;

    const log = await DiagnosisLog.create({
      symptoms,
      age,
      gender,
      history,
      aiResponse,
      riskLevel: riskLevel || "Unknown",
      doctorId: req.user._id,
      patientId: patientId || null,
    });

    res.status(201).json(log);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get diagnosis history (scoped by doctor, or all for admin)
// @route   GET /api/diagnosis
// @access  Doctor, Admin
export const getDiagnosisHistory = async (req, res) => {
  try {
    const query = req.user.role === "Admin" ? {} : { doctorId: req.user._id };

    const logs = await DiagnosisLog.find(query)
      .populate("patientId", "name age gender")
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get a single diagnosis log
// @route   GET /api/diagnosis/:id
// @access  Doctor, Admin
export const getDiagnosisById = async (req, res) => {
  try {
    const log = await DiagnosisLog.findById(req.params.id).populate(
      "patientId",
      "name age gender",
    );
    if (!log)
      return res.status(404).json({ message: "Diagnosis log not found" });
    res.json(log);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
