# Expense Tracker REST API

A secure, multi-tenant REST API built with **Express.js** using JWT authentication, role-based access control, and JSON file persistence.

---

## Tech Stack

| Layer | Library |
|---|---|
| Framework | Express.js |
| Auth | jsonwebtoken + bcryptjs |
| ID Generation | uuid |
| Storage | Local JSON files (no database) |

---

## Project Structure

```
expense-tracker/
├── index.js                          # App entry point
├── seed-admin.js                     # Admin account template
├── ExpenseTracker.postman_collection.json
├── src/
│   ├── routes/
│   │   ├── auth.js                   # POST /api/auth/signup|login
│   │   ├── expenses.js               # CRUD /api/expenses
│   │   └── admin.js                  # GET|DELETE /api/admin/*
│   ├── middleware/
│   │   └── auth.js                   # authenticate + requireAdmin
│   └── utils/
│       └── fileStore.js              # JSON file read/write helpers
└── src/data/                         # Auto-created at startup
    ├── users.json
    └── expenses.json
```

---

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment
Edit `.env`:

```env
PORT=3000
JWT_SECRET=replace_with_a_long_random_secret_string
ADMIN_EMAIL=admin@tracker.com
ADMIN_PASSWORD=Admin@1234
```

> **Important:** Set a strong `JWT_SECRET` in production. Never commit your `.env` file.

### 3. Seed the first admin account

```bash
node seed-admin.js
```

Output:
```
✅ Admin created: admin@tracker.com / Admin@1234
```

You can also customize via env vars:
```bash
ADMIN_EMAIL=boss@company.com ADMIN_PASSWORD=StrongPass! node seed-admin.js
```

### 4. Start the server

```bash
node index.js
```

The API will be available at `http://localhost:3000`.

---

## API Reference

### Auth Endpoints (Public)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Register a new user |
| POST | `/api/auth/login` | Login and receive a JWT |

**Signup body:**
```json
{ "email": "user@example.com", "password": "securepassword123" }
```

**Login response:**
```json
{ "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." }
```

---

### Expense Endpoints (Authenticated Users)

All requests require:
```
Authorization: Bearer <your_jwt_token>
```

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/expenses` | Create a new expense |
| GET | `/api/expenses` | Get your expenses (with optional filters) |
| PUT | `/api/expenses/:id` | Update one of your expenses |
| DELETE | `/api/expenses/:id` | Delete one of your expenses |

**Create/Update body fields:**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| title | string | Yes | |
| amount | number | Yes | Must be > 0 |
| category | string | Yes | See allowed values below |
| date | string | Yes | Format: YYYY-MM-DD |

**Allowed categories:** `Groceries`, `Leisure`, `Electronics`, `Utilities`, `Clothing`, `Health`, `Others`

**Date filter query params:**

```
GET /api/expenses?filter=past_week
GET /api/expenses?filter=past_month
GET /api/expenses?filter=last_3_months
GET /api/expenses?filter=custom&start_date=2026-01-01&end_date=2026-05-31
```

---

### Admin Endpoints (Admin Role Only)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/expenses` | All expenses across all users |
| GET | `/api/admin/users` | All users (passwords omitted) |
| DELETE | `/api/admin/expenses/:id` | Force-delete any expense |

---

## Postman Collection

Import `ExpenseTracker.postman_collection.json` into Postman.

**Recommended test order:**
1. **Auth → Login - User** (auto-saves `userToken` variable)
2. **Auth → Login - Admin** (auto-saves `adminToken` variable)
3. **Expenses → Create Expense** (auto-saves `expenseId` variable)
4. Run remaining requests in any order

---

## Security Notes

- Passwords are hashed with **bcrypt** (10 salt rounds) before storage
- JWTs expire after **24 hours**
- Users can only read/modify their own expenses
- Admin role is checked server-side via middleware on every request
- The `/api/admin/*` routes respond with **403 Forbidden** for non-admin tokens
- Password fields are stripped from all user-listing responses
