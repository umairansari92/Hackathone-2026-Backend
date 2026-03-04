import asyncHandler from "express-async-handler";
import LabTest from "../models/LabTest.js";

// @desc  Create lab test order
// @route POST /api/lab
// @access LabStaff, Doctor, Admin
export const createLabTest = asyncHandler(async (req, res) => {
  const { patient, testName, testType, fee, notes, department } = req.body;
  const test = await LabTest.create({
    patient,
    doctor: req.user._id,
    testName,
    testType,
    fee,
    notes,
    department: department || "Lab",
  });
  const populated = await test.populate("patient", "fullname email");
  res.status(201).json(populated);
});

// @desc  Get all lab tests (with optional status filter)
// @route GET /api/lab
// @access LabStaff, Doctor, Admin, Supervisor
export const getLabTests = asyncHandler(async (req, res) => {
  const { status, patient } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (patient) filter.patient = patient;

  const tests = await LabTest.find(filter)
    .populate("patient", "fullname email phone")
    .populate("doctor", "fullname")
    .populate("processedBy", "fullname")
    .sort({ createdAt: -1 });
  res.json(tests);
});

// @desc  Get single lab test
// @route GET /api/lab/:id
// @access LabStaff, Doctor, Admin
export const getLabTestById = asyncHandler(async (req, res) => {
  const test = await LabTest.findById(req.params.id)
    .populate("patient", "fullname email phone bloodGroup")
    .populate("doctor", "fullname")
    .populate("processedBy", "fullname");
  if (!test) {
    res.status(404);
    throw new Error("Lab test not found");
  }
  res.json(test);
});

// @desc  Update lab test status / result
// @route PUT /api/lab/:id
// @access LabStaff, Admin
export const updateLabTest = asyncHandler(async (req, res) => {
  const test = await LabTest.findById(req.params.id);
  if (!test) {
    res.status(404);
    throw new Error("Lab test not found");
  }
  const { status, result, reportUrl, notes } = req.body;
  if (status) test.status = status;
  if (result !== undefined) test.result = result;
  if (reportUrl !== undefined) test.reportUrl = reportUrl;
  if (notes !== undefined) test.notes = notes;
  if (status === "Processing" || status === "Done") {
    test.processedBy = req.user._id;
  }
  const updated = await test.save();
  await updated.populate("patient", "fullname email");
  await updated.populate("doctor", "fullname");
  res.json(updated);
});

// @desc  Get lab stats summary
// @route GET /api/lab/stats
// @access LabStaff, Supervisor, Admin
export const getLabStats = asyncHandler(async (req, res) => {
  const [pending, processing, done, total] = await Promise.all([
    LabTest.countDocuments({ status: "Pending" }),
    LabTest.countDocuments({ status: "Processing" }),
    LabTest.countDocuments({ status: "Done" }),
    LabTest.countDocuments(),
  ]);
  res.json({ pending, processing, done, total });
});
