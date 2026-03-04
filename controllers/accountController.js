import asyncHandler from "express-async-handler";
import AccountEntry from "../models/AccountEntry.js";

// @desc  Create account entry (income or expense)
// @route POST /api/accounts
// @access Accountant, Admin
export const createEntry = asyncHandler(async (req, res) => {
  const { type, category, amount, description, date, referenceId } = req.body;
  const entry = await AccountEntry.create({
    type,
    category,
    amount,
    description,
    date: date || new Date(),
    referenceId,
    createdBy: req.user._id,
  });
  const populated = await entry.populate("createdBy", "fullname");
  res.status(201).json(populated);
});

// @desc  Get all account entries (with filters)
// @route GET /api/accounts
// @access Accountant, Admin, Supervisor
export const getEntries = asyncHandler(async (req, res) => {
  const { type, category, from, to } = req.query;
  const filter = {};
  if (type) filter.type = type;
  if (category) filter.category = category;
  if (from || to) {
    filter.date = {};
    if (from) filter.date.$gte = new Date(from);
    if (to) filter.date.$lte = new Date(to);
  }
  const entries = await AccountEntry.find(filter)
    .populate("createdBy", "fullname")
    .sort({ date: -1 });
  res.json(entries);
});

// @desc  Get account summary (totals)
// @route GET /api/accounts/summary
// @access Accountant, Admin, Supervisor
export const getSummary = asyncHandler(async (req, res) => {
  const { from, to } = req.query;
  const dateFilter = {};
  if (from || to) {
    dateFilter.date = {};
    if (from) dateFilter.date.$gte = new Date(from);
    if (to) dateFilter.date.$lte = new Date(to);
  }

  const [incomeAgg, expenseAgg, totalCount] = await Promise.all([
    AccountEntry.aggregate([
      { $match: { type: "Income", ...dateFilter } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    AccountEntry.aggregate([
      { $match: { type: "Expense", ...dateFilter } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    AccountEntry.countDocuments(dateFilter),
  ]);

  const totalIncome = incomeAgg[0]?.total || 0;
  const totalExpense = expenseAgg[0]?.total || 0;
  res.json({
    totalIncome,
    totalExpense,
    netBalance: totalIncome - totalExpense,
    totalEntries: totalCount,
  });
});

// @desc  Delete account entry
// @route DELETE /api/accounts/:id
// @access Admin
export const deleteEntry = asyncHandler(async (req, res) => {
  const entry = await AccountEntry.findById(req.params.id);
  if (!entry) {
    res.status(404);
    throw new Error("Entry not found");
  }
  await entry.deleteOne();
  res.json({ message: "Entry deleted" });
});
