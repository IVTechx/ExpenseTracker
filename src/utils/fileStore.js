const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "../data");
const USERS_FILE = path.join(DATA_DIR, "users.json");
const EXPENSES_FILE = path.join(DATA_DIR, "expenses.json");

function ensureFile(filePath) {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, "[]", "utf8");
  }
}

function initDataFiles() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  ensureFile(USERS_FILE);
  ensureFile(EXPENSES_FILE);
}

function readFile(filePath) {
  ensureFile(filePath);
  const raw = fs.readFileSync(filePath, "utf8");
  try {
    return JSON.parse(raw);
  } catch {
    console.error(`Corrupt file detected: ${filePath} - resetting to empty array`);
    return [];
  }
}

function writeFile(filePath, data) {
  const tempPath = filePath + ".tmp";
  fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), "utf8");
  fs.renameSync(tempPath, filePath);
}

const readUsers = () => readFile(USERS_FILE);
const writeUsers = (data) => writeFile(USERS_FILE, data);
const readExpenses = () => readFile(EXPENSES_FILE);
const writeExpenses = (data) => writeFile(EXPENSES_FILE, data);

module.exports = { initDataFiles, readUsers, writeUsers, readExpenses, writeExpenses };
