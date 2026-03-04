import asyncHandler from "express-async-handler";
import UltrasoundReport from "../models/UltrasoundReport.js";

// @desc  Create ultrasound report
// @route POST /api/ultrasound
// @access Doctor, Admin, Receptionist
export const createUltrasound = asyncHandler(async (req, res) => {
  const { patient, scanType, fee, notes } = req.body;
  const report = await UltrasoundReport.create({
    patient,
    doctor: req.user._id,
    scanType,
    fee,
    notes,
  });
  const populated = await report.populate("patient", "fullname email");
  res.status(201).json(populated);
});

// @desc  Get all ultrasound reports
// @route GET /api/ultrasound
// @access Doctor, Admin, Supervisor
export const getUltrasounds = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const filter = {};
  if (status) filter.status = status;

  const reports = await UltrasoundReport.find(filter)
    .populate("patient", "fullname email phone")
    .populate("doctor", "fullname")
    .populate("reportedBy", "fullname")
    .sort({ createdAt: -1 });
  res.json(reports);
});

// @desc  Get single ultrasound report
// @route GET /api/ultrasound/:id
// @access Doctor, Admin
export const getUltrasoundById = asyncHandler(async (req, res) => {
  const report = await UltrasoundReport.findById(req.params.id)
    .populate("patient", "fullname email phone gender")
    .populate("doctor", "fullname")
    .populate("reportedBy", "fullname");
  if (!report) {
    res.status(404);
    throw new Error("Ultrasound report not found");
  }
  res.json(report);
});

// @desc  Update ultrasound report (findings, status)
// @route PUT /api/ultrasound/:id
// @access Doctor, Admin
export const updateUltrasound = asyncHandler(async (req, res) => {
  const report = await UltrasoundReport.findById(req.params.id);
  if (!report) {
    res.status(404);
    throw new Error("Ultrasound report not found");
  }
  const { status, findings, impression, imageUrl, notes } = req.body;
  if (status) report.status = status;
  if (findings !== undefined) report.findings = findings;
  if (impression !== undefined) report.impression = impression;
  if (imageUrl !== undefined) report.imageUrl = imageUrl;
  if (notes !== undefined) report.notes = notes;
  if (status === "Reported") report.reportedBy = req.user._id;

  const updated = await report.save();
  await updated.populate("patient", "fullname email");
  res.json(updated);
});

// @desc  Get ultrasound stats
// @route GET /api/ultrasound/stats
// @access Supervisor, Admin
export const getUltrasoundStats = asyncHandler(async (req, res) => {
  const [pending, inProgress, reported, total] = await Promise.all([
    UltrasoundReport.countDocuments({ status: "Pending" }),
    UltrasoundReport.countDocuments({ status: "In Progress" }),
    UltrasoundReport.countDocuments({ status: "Reported" }),
    UltrasoundReport.countDocuments(),
  ]);
  res.json({ pending, inProgress, reported, total });
});
