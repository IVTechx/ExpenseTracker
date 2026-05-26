const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const { readUsers, writeUsers } = require("../utils/fileStore");
const { JWT_SECRET } = require("../middleware/auth");
const rateLimit = require("express-rate-limit");

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: { error: "Too many login attemps. Try again in 15 minutes" },
});

// POST /api/auth/signup
router.post("/signup", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters." });
  }

  const users = readUsers();
  if (users.find((u) => u.email === email)) {
    return res.status(409).json({ error: "Email already registered." });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = {
    id: `u_${uuidv4()}`,
    email,
    password: hashedPassword,
    role: "user",
  };

  users.push(newUser);
  writeUsers(users);

  return res.status(201).json({ message: "Account created successfully.", userId: newUser.id });
});

// POST /api/auth/login
router.post("/login", loginLimiter, async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if(!emailRegex.test(email)){
    return res.status(400).json({error: 'Invalid email format'});
  }

  const users = readUsers();
  const user = users.find((u) => u.email === email);
  if (!user) {
    return res.status(401).json({ error: "Invalid credentials." });
  }

  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    return res.status(401).json({ error: "Invalid credentials." });
  }

  const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, {
    expiresIn: "24h",
  });

  return res.status(200).json({ token });
});

module.exports = router;
