import asyncHandler from "express-async-handler";
import Patient from "../models/Patient.js";
import Visit from "../models/Visit.js";
import LabTest from "../models/LabTest.js";
import UltrasoundReport from "../models/UltrasoundReport.js";
import PharmacyRecord from "../models/PharmacyRecord.js";
import Prescription from "../models/Prescription.js";

// @desc  Create new patient (reception desk)
// @route POST /api/patients
// @access Receptionist, Admin
export const createPatient = asyncHandler(async (req, res) => {
  const {
    fullName,
    fatherOrHusbandName,
    age,
    gender,
    phone,
    address,
    chronicConditions,
    allergies,
    department,
    password,
  } = req.body;

  // Check for duplicate phone
  const existing = await Patient.findOne({ phone });
  if (existing) {
    res.status(400);
    throw new Error(`Patient already registered. UID: ${existing.uid}`);
  }

  const patient = await Patient.create({
    fullName,
    fatherOrHusbandName,
    age,
    gender,
    phone,
    address,
    chronicConditions,
    allergies,
    department: department || "General OPD",
    password: password || "alshifa1234", // default password
    createdBy: req.user._id,
  });

  res.status(201).json({
    _id: patient._id,
    uid: patient.uid,
    fullName: patient.fullName,
    fatherOrHusbandName: patient.fatherOrHusbandName,
    age: patient.age,
    gender: patient.gender,
    phone: patient.phone,
    address: patient.address,
    chronicConditions: patient.chronicConditions,
    allergies: patient.allergies,
    department: patient.department,
    createdAt: patient.createdAt,
  });
});

// @desc  Search patient by UID or phone
// @route GET /api/patients/search?q=...
// @access Receptionist, Doctor, Admin, Nurse
export const searchPatients = asyncHandler(async (req, res) => {
  const { q } = req.query;
  if (!q) return res.json([]);

  const patients = await Patient.find({
    $or: [
      { uid: { $regex: q, $options: "i" } },
      { phone: { $regex: q, $options: "i" } },
      { fullName: { $regex: q, $options: "i" } },
    ],
  })
    .populate("createdBy", "fullname")
    .limit(20)
    .sort({ createdAt: -1 });

  res.json(patients);
});

// @desc  Get all patients
// @route GET /api/patients
// @access Receptionist, Doctor, Admin, Nurse, Supervisor
export const getPatients = asyncHandler(async (req, res) => {
  const patients = await Patient.find({})
    .populate("createdBy", "fullname email")
    .sort({ createdAt: -1 });
  res.json(patients);
});

// @desc  Get single patient by ID
// @route GET /api/patients/:id
// @access Receptionist, Doctor, Admin
export const getPatientById = asyncHandler(async (req, res) => {
  const patient = await Patient.findById(req.params.id).populate(
    "createdBy",
    "fullname email",
  );
  if (!patient) {
    res.status(404);
    throw new Error("Patient not found");
  }
  res.json(patient);
});

// @desc  Get patient by UID
// @route GET /api/patients/uid/:uid
// @access Receptionist, Doctor, Admin
export const getPatientByUID = asyncHandler(async (req, res) => {
  const patient = await Patient.findOne({ uid: req.params.uid }).populate(
    "createdBy",
    "fullname email",
  );
  if (!patient) {
    res.status(404);
    throw new Error("Patient not found with that UID");
  }
  res.json(patient);
});

// @desc  Get full patient history (profile + all visits + linked records)
// @route GET /api/patients/:id/history
// @access Doctor, Admin, Supervisor
export const getPatientHistory = asyncHandler(async (req, res) => {
  const patient = await Patient.findById(req.params.id).populate(
    "createdBy",
    "fullname",
  );
  if (!patient) {
    res.status(404);
    throw new Error("Patient not found");
  }

  // All visits sorted newest first
  const visits = await Visit.find({ patientId: req.params.id })
    .populate("doctorId", "fullname department")
    .populate("createdBy", "fullname")
    .sort({ visitDate: -1 });

  // Fetch all linked clinical records in parallel
  const [labTests, ultrasounds, pharmacyRecords, prescriptions] =
    await Promise.all([
      LabTest.find({ patientId: req.params.id })
        .populate("doctor", "fullname")
        .sort({ createdAt: -1 }),
      UltrasoundReport.find({ patientId: req.params.id })
        .populate("doctor", "fullname")
        .sort({ createdAt: -1 }),
      PharmacyRecord.find({ patientId: req.params.id })
        .populate("dispensedBy", "fullname")
        .sort({ createdAt: -1 }),
      Prescription.find({ patientId: req.params.id })
        .populate("doctorId", "fullname")
        .sort({ createdAt: -1 }),
    ]);

  // Group clinical records by visitId for per-visit display
  const groupByVisit = (records) => {
    const map = {};
    for (const r of records) {
      const vid = r.visitId ? r.visitId.toString() : "unlinked";
      if (!map[vid]) map[vid] = [];
      map[vid].push(r);
    }
    return map;
  };

  const labByVisit = groupByVisit(labTests);
  const ussByVisit = groupByVisit(ultrasounds);
  const pharmByVisit = groupByVisit(pharmacyRecords);
  const rxByVisit = groupByVisit(prescriptions);

  const visitsWithRecords = visits.map((v) => {
    const vid = v._id.toString();
    return {
      ...v.toObject(),
      labTests: labByVisit[vid] || [],
      ultrasounds: ussByVisit[vid] || [],
      pharmacyRecords: pharmByVisit[vid] || [],
      prescriptions: rxByVisit[vid] || [],
    };
  });

  res.json({
    patient,
    visits: visitsWithRecords,
    summary: {
      totalVisits: visits.length,
      totalLabTests: labTests.length,
      totalUltrasounds: ultrasounds.length,
      totalPrescriptions: prescriptions.length,
    },
  });
});

// @desc  Update patient
// @route PUT /api/patients/:id
// @access Receptionist, Admin
export const updatePatient = asyncHandler(async (req, res) => {
  const patient = await Patient.findById(req.params.id);
  if (!patient) {
    res.status(404);
    throw new Error("Patient not found");
  }
  const fields = [
    "fullName",
    "fatherOrHusbandName",
    "age",
    "gender",
    "phone",
    "address",
    "chronicConditions",
    "allergies",
    "department",
  ];
  for (const f of fields) {
    if (req.body[f] !== undefined) patient[f] = req.body[f];
  }
  const updated = await patient.save();
  res.json(updated);
});

// @desc  Delete patient
// @route DELETE /api/patients/:id
// @access Admin
export const deletePatient = asyncHandler(async (req, res) => {
  const patient = await Patient.findById(req.params.id);
  if (!patient) {
    res.status(404);
    throw new Error("Patient not found");
  }
  await patient.deleteOne();
  res.json({ message: "Patient removed" });
});
