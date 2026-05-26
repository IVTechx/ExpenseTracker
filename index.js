require('dotenv').config({ quiet: true });
const express = require('express');
const { initDataFiles } = require('./src/utils/fileStore');

// Ensure data files exist before handling any requests
initDataFiles();

const app = express();
app.use(express.json());

// Routes
app.use('/api/auth',     require('./src/routes/auth'));
app.use('/api/expenses', require('./src/routes/expenses'));
app.use('/api/admin',    require('./src/routes/admin'));

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// 404 fallback
app.use((req, res) => res.status(404).json({ error: 'Route not found.' }));

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error.' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Expense Tracker API running on port ${PORT}`));

module.exports = app;