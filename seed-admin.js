require("dotenv").config({ quiet: true });
const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");
const { initDataFiles, readUsers, writeUsers } = require("./src/utils/fileStore");

initDataFiles();

const email = process.env.ADMIN_EMAIL || "admin@tracker.com";
const password = process.env.ADMIN_PASSWORD || "Admin@1234";

(async () => {
  const users = readUsers();
  if (users.find((u) => u.email === email)) {
    console.log(`Admin with email "${email}" already exists.`);
    return;
  }

  const hashed = await bcrypt.hash(password, 10);
  users.push({ id: `u_${uuidv4()}`, email, password: hashed, role: "admin" });
  writeUsers(users);
  console.log(`✅ Admin created: ${email} / ${password}`);
})();
  