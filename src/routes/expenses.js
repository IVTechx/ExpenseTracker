const express = require("express");
const { v4: uuidv4 } = require("uuid");
const { readExpenses, writeExpenses } = require("../utils/fileStore");
const { authenticate } = require("../middleware/auth");

const router = express.Router();

const VALID_CATEGORIES = [
  "Groceries",
  "Leisure",
  "Electronics",
  "Utilities",
  "Clothing",
  "Health",
  "Others",
];

function applyDateFilter(expenses, filter, startDate, endDate) {
  const now = new Date();
  now.setHours(23, 59, 59, 999);

  let from;
  let to = now;

  switch (filter) {
    case "past_week": {
      from = new Date(now);
      from.setDate(from.getDate() - 7);
      from.setHours(0, 0, 0, 0);
      break;
    }
    case "past_month": {
      from = new Date(now);
      from.setMonth(from.getMonth() - 1);
      from.setHours(0, 0, 0, 0);
      break;
    }
    case "last_3_months": {
      from = new Date(now);
      from.setMonth(from.getMonth() - 3);
      from.setHours(0, 0, 0, 0);
      break;
    }
    case "custom": {
      if (!startDate || !endDate) {
        return { error: "start_date and end_date are required for custom filter." };
      }
      from = new Date(startDate);
      to = new Date(endDate);
      to.setHours(23, 59, 59, 999);
      if (isNaN(from) || isNaN(to)) {
        return { error: "Invalid date format. Use YYYY-MM-DD." };
      }
      break;
    }
    default:
      return { data: expenses };
  }

  return {
    data: expenses.filter((e) => {
      const d = new Date(e.date);
      return d >= from && d <= to;
    }),
  };
}

// All expense routes require authentication
router.use(authenticate);

// POST /api/expenses
router.post("/", (req, res) => {
  const { title, amount, category, date } = req.body;

  if (!title || amount == null || !category || !date) {
    return res.status(400).json({ error: "title, amount, category, and date are required." });
  }
  if (title.length > 200) {
    return res.status(400).json({ error: "Title too long (200 characters max)." });
  }
  if (typeof amount !== "number" || amount <= 0) {
    return res.status(400).json({ error: "amount must be a positive number." });
  }
  if (!VALID_CATEGORIES.includes(category)) {
    return res
      .status(400)
      .json({ error: `Invalid category. Allowed: ${VALID_CATEGORIES.join(", ")}.` });
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || isNaN(new Date(date))) {
    return res.status(400).json({ error: "Invalid date format. Use YYYY-MM-DD." });
  }

  const expenses = readExpenses();
  const newExpense = {
    id: `exp_${uuidv4()}`,
    userId: req.user.id,
    title,
    amount,
    date,
    category,
  };

  expenses.push(newExpense);
  writeExpenses(expenses);

  return res.status(201).json(newExpense);
});

// GET /api/expenses
router.get("/", (req, res) => {
  const { filter, start_date, end_date } = req.query;

  let expenses = readExpenses().filter((e) => e.userId === req.user.id);

  if (filter) {
    const result = applyDateFilter(expenses, filter, start_date, end_date);
    if (result.error) return res.status(400).json({ error: result.error });
    expenses = result.data;
  }

  return res.status(200).json(expenses);
});

// PUT /api/expenses/:id
router.put("/:id", (req, res) => {
  const { title, amount, category, date } = req.body;

  const expenses = readExpenses();
  const idx = expenses.findIndex((e) => e.id === req.params.id);

  if (idx === -1) return res.status(404).json({ error: "Expense not found." });
  if (expenses[idx].userId !== req.user.id) {
    return res.status(403).json({ error: "Forbidden: You do not own this expense." });
  }

  if (amount != null && (typeof amount !== "number" || amount <= 0)) {
    return res.status(400).json({ error: "amount must be a positive number." });
  }
  if (category && !VALID_CATEGORIES.includes(category)) {
    return res
      .status(400)
      .json({ error: `Invalid category. Allowed: ${VALID_CATEGORIES.join(", ")}.` });
  }
  if (date && (!/^\d{4}-\d{2}-\d{2}$/.test(date) || isNaN(new Date(date)))) {
    return res.status(400).json({ error: "Invalid date format. Use YYYY-MM-DD." });
  }

  expenses[idx] = {
    ...expenses[idx],
    ...(title && { title }),
    ...(amount != null && { amount }),
    ...(category && { category }),
    ...(date && { date }),
  };

  writeExpenses(expenses);
  return res.status(200).json(expenses[idx]);
});

// DELETE /api/expenses/:id
router.delete("/:id", (req, res) => {
  const expenses = readExpenses();
  const idx = expenses.findIndex((e) => e.id === req.params.id);

  if (idx === -1) return res.status(404).json({ error: "Expense not found." });
  if (expenses[idx].userId !== req.user.id) {
    return res.status(403).json({ error: "Forbidden: You do not own this expense." });
  }

  expenses.splice(idx, 1);
  writeExpenses(expenses);
  return res.status(200).json({ message: "Expense deleted." });
});

module.exports = router;
