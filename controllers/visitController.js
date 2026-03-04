import asyncHandler from "express-async-handler";
import Visit from "../models/Visit.js";
import LabTest from "../models/LabTest.js";
import UltrasoundReport from "../models/UltrasoundReport.js";
import PharmacyRecord from "../models/PharmacyRecord.js";
import Prescription from "../models/Prescription.js";

// @desc  Create a visit (Receptionist books appointment → creates visit)
// @route POST /api/visits
// @access Receptionist, Doctor, Admin
export const createVisit = asyncHandler(async (req, res) => {
  const { patientId, doctorId, department, visitDate, symptoms, notes } =
    req.body;

  const visit = await Visit.create({
    patientId,
    doctorId,
    department: department || "General OPD",
    visitDate: visitDate ? new Date(visitDate) : new Date(),
    symptoms,
    notes,
    createdBy: req.user._id,
  });

  const populated = await visit.populate([
    { path: "patientId", select: "uid fullName age gender phone" },
    { path: "doctorId", select: "fullname department" },
  ]);
  res.status(201).json(populated);
});

// @desc  Get all visits (with optional patientId filter)
// @route GET /api/visits
// @access Doctor, Admin, Supervisor
export const getVisits = asyncHandler(async (req, res) => {
  const { patientId, doctorId, status } = req.query;
  const filter = {};
  if (patientId) filter.patientId = patientId;
  if (doctorId) filter.doctorId = doctorId;
  if (status) filter.status = status;

  const visits = await Visit.find(filter)
    .populate("patientId", "uid fullName age gender phone")
    .populate("doctorId", "fullname department")
    .populate("createdBy", "fullname")
    .sort({ visitDate: -1 });
  res.json(visits);
});

// @desc  Get visits by patient
// @route GET /api/visits/patient/:patientId
// @access Doctor, Admin, Nurse, Supervisor
export const getVisitsByPatient = asyncHandler(async (req, res) => {
  const visits = await Visit.find({ patientId: req.params.patientId })
    .populate("doctorId", "fullname department")
    .populate("createdBy", "fullname")
    .sort({ visitDate: -1 });

  // Attach linked records for each visit
  const enriched = await Promise.all(
    visits.map(async (v) => {
      const [labs, uss, pharma, rx] = await Promise.all([
        LabTest.find({ visitId: v._id }).populate("doctor", "fullname"),
        UltrasoundReport.find({ visitId: v._id }).populate(
          "doctor",
          "fullname",
        ),
        PharmacyRecord.find({ visitId: v._id }),
        Prescription.find({ visitId: v._id }).populate("doctorId", "fullname"),
      ]);
      return {
        ...v.toObject(),
        labTests: labs,
        ultrasounds: uss,
        pharmacyRecords: pharma,
        prescriptions: rx,
      };
    }),
  );

  res.json(enriched);
});

// @desc  Get single visit with all records
// @route GET /api/visits/:id
// @access Doctor, Admin, Nurse
export const getVisitById = asyncHandler(async (req, res) => {
  const visit = await Visit.findById(req.params.id)
    .populate(
      "patientId",
      "uid fullName age gender phone chronicConditions allergies",
    )
    .populate("doctorId", "fullname department")
    .populate("createdBy", "fullname");

  if (!visit) {
    res.status(404);
    throw new Error("Visit not found");
  }

  const [labs, uss, pharma, rx] = await Promise.all([
    LabTest.find({ visitId: visit._id }).populate("processedBy", "fullname"),
    UltrasoundReport.find({ visitId: visit._id }).populate(
      "reportedBy",
      "fullname",
    ),
    PharmacyRecord.find({ visitId: visit._id }).populate(
      "dispensedBy",
      "fullname",
    ),
    Prescription.find({ visitId: visit._id }).populate("doctorId", "fullname"),
  ]);

  res.json({
    ...visit.toObject(),
    labTests: labs,
    ultrasounds: uss,
    pharmacyRecords: pharma,
    prescriptions: rx,
  });
});

// @desc  Update visit (doctor adds diagnosis/notes)
// @route PUT /api/visits/:id
// @access Doctor, Admin
export const updateVisit = asyncHandler(async (req, res) => {
  const visit = await Visit.findById(req.params.id);
  if (!visit) {
    res.status(404);
    throw new Error("Visit not found");
  }

  const fields = [
    "symptoms",
    "diagnosis",
    "notes",
    "status",
    "followUpDate",
    "department",
  ];
  for (const f of fields) {
    if (req.body[f] !== undefined) visit[f] = req.body[f];
  }
  const updated = await visit.save();
  await updated.populate("patientId", "uid fullName");
  await updated.populate("doctorId", "fullname");
  res.json(updated);
});
