const express = require('express');
const { readUsers, readExpenses, writeExpenses } = require('../utils/fileStore');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Both middlewares applied to all admin routes
router.use(authenticate, requireAdmin);

// GET /api/admin/expenses — all expenses across all users
router.get('/expenses', (req, res) => {
  const expenses = readExpenses();
  return res.status(200).json(expenses);
});

// GET /api/admin/users — all users (passwords stripped)
router.get('/users', (req, res) => {
  const users = readUsers().map(({ password, ...safe }) => safe);
  return res.status(200).json(users);
});

// DELETE /api/admin/expenses/:id — force-delete any expense
router.delete('/expenses/:id', (req, res) => {
  const expenses = readExpenses();
  const idx = expenses.findIndex(e => e.id === req.params.id);

  if (idx === -1) return res.status(404).json({ error: 'Expense not found.' });

  expenses.splice(idx, 1);
  writeExpenses(expenses);
  return res.status(200).json({ message: 'Expense deleted by admin.' });
});

module.exports = router;
