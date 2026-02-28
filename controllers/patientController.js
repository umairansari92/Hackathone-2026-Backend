import Patient from "../models/Patient.js";

// @desc    Get all patients
// @route   GET /api/patients
// @access  Private (Admin, Doctor, Receptionist)
export const getPatients = async (req, res) => {
  try {
    const patients = await Patient.find({}).populate(
      "createdBy",
      "fullname email",
    );
    res.json(patients);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single patient
// @route   GET /api/patients/:id
// @access  Private (Admin, Doctor, Receptionist)
export const getPatientById = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id).populate(
      "createdBy",
      "fullname email",
    );

    if (patient) {
      res.json(patient);
    } else {
      res.status(404).json({ message: "Patient not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a patient
// @route   POST /api/patients
// @access  Private (Admin, Doctor, Receptionist)
export const createPatient = async (req, res) => {
  try {
    const { name, age, gender, contact } = req.body;

    const patient = new Patient({
      name,
      age,
      gender,
      contact,
      createdBy: req.user._id,
    });

    const createdPatient = await patient.save();
    res.status(201).json(createdPatient);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a patient
// @route   PUT /api/patients/:id
// @access  Private (Admin, Doctor, Receptionist)
export const updatePatient = async (req, res) => {
  try {
    const { name, age, gender, contact } = req.body;

    const patient = await Patient.findById(req.params.id);

    if (patient) {
      patient.name = name || patient.name;
      patient.age = age || patient.age;
      patient.gender = gender || patient.gender;
      patient.contact = contact || patient.contact;

      const updatedPatient = await patient.save();
      res.json(updatedPatient);
    } else {
      res.status(404).json({ message: "Patient not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a patient
// @route   DELETE /api/patients/:id
// @access  Private (Admin)
export const deletePatient = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);

    if (patient) {
      await patient.deleteOne();
      res.json({ message: "Patient removed" });
    } else {
      res.status(404).json({ message: "Patient not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
