import asyncHandler from "express-async-handler";
import PharmacyRecord from "../models/PharmacyRecord.js";

// @desc  Create pharmacy record
// @route POST /api/pharmacy
// @access Pharmacist, Admin
export const createPharmacyRecord = asyncHandler(async (req, res) => {
  const { patient, prescriptionRef, medicines, notes } = req.body;
  const totalAmount = (medicines || []).reduce(
    (sum, m) => sum + (m.quantity || 1) * (m.unitPrice || 0),
    0,
  );
  const record = await PharmacyRecord.create({
    patient,
    prescriptionRef,
    medicines,
    totalAmount,
    notes,
  });
  const populated = await record.populate("patient", "fullname email");
  res.status(201).json(populated);
});

// @desc  Get all pharmacy records
// @route GET /api/pharmacy
// @access Pharmacist, Admin, Supervisor
export const getPharmacyRecords = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const filter = {};
  if (status) filter.status = status;

  const records = await PharmacyRecord.find(filter)
    .populate("patient", "fullname email phone")
    .populate("prescriptionRef", "diagnosis")
    .populate("dispensedBy", "fullname")
    .sort({ createdAt: -1 });
  res.json(records);
});

// @desc  Get single pharmacy record
// @route GET /api/pharmacy/:id
// @access Pharmacist, Admin
export const getPharmacyRecordById = asyncHandler(async (req, res) => {
  const record = await PharmacyRecord.findById(req.params.id)
    .populate("patient", "fullname email phone")
    .populate("prescriptionRef")
    .populate("dispensedBy", "fullname");
  if (!record) {
    res.status(404);
    throw new Error("Pharmacy record not found");
  }
  res.json(record);
});

// @desc  Update dispense status
// @route PUT /api/pharmacy/:id
// @access Pharmacist, Admin
export const updateDispenseStatus = asyncHandler(async (req, res) => {
  const record = await PharmacyRecord.findById(req.params.id);
  if (!record) {
    res.status(404);
    throw new Error("Pharmacy record not found");
  }
  const { status, notes } = req.body;
  if (status) record.status = status;
  if (notes !== undefined) record.notes = notes;
  if (status === "Dispensed") record.dispensedBy = req.user._id;

  const updated = await record.save();
  await updated.populate("patient", "fullname email");
  res.json(updated);
});

// @desc  Get pharmacy stats
// @route GET /api/pharmacy/stats
// @access Pharmacist, Supervisor, Admin
export const getPharmacyStats = asyncHandler(async (req, res) => {
  const [pending, dispensed, total, revenue] = await Promise.all([
    PharmacyRecord.countDocuments({ status: "Pending" }),
    PharmacyRecord.countDocuments({ status: "Dispensed" }),
    PharmacyRecord.countDocuments(),
    PharmacyRecord.aggregate([
      { $match: { status: "Dispensed" } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ]),
  ]);
  res.json({
    pending,
    dispensed,
    total,
    revenue: revenue[0]?.total || 0,
  });
});
