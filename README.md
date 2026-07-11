# SwiftPOS — Point of Sale System

A full-stack point-of-sale system for small retail businesses. Cashiers ring up sales with cash, card, mobile money, or split payments (via Paystack); managers and admins manage products, inventory, customers with loyalty points, and view sales analytics.

## Tech Stack

| Layer    | Technology |
|----------|------------|
| Frontend | React 19, Vite, React Router, Recharts, react-icons, Axios |
| Backend  | Node.js, Express 5, PostgreSQL (`pg`), JWT auth, bcrypt |
| Payments | Paystack (card + mobile money, GHS) |

## Features

- **Role-based access** — Admin, Manager, and Cashier roles. Cashiers see only Dashboard and Sales; Managers/Admins also get Products, Inventory, Customers, and Analytics.
- **Sales & checkout** — product picker with cart, percentage or fixed discounts, 15% VAT toggle, cash/card/mobile-money/split payments, printable receipts, and sale voiding (restores inventory and reverses loyalty points).
- **Inventory** — stock levels with low-stock alerts, restock (add) and update (set exact) flows.
- **Customers** — CRUD plus loyalty points (earned automatically at ₵10 = 1 point, manually adjustable).
- **Analytics** — revenue over time, sales trend, payment-method breakdown, top products, weekly/monthly/yearly ranges.

## Project Structure

```
pos-system/
├── pos-backend/          # Express REST API
│   ├── config/db.js      # PostgreSQL pool
│   ├── controllers/      # auth, products, inventory, sales, customers, payments, analytics
│   ├── middleware/       # JWT auth + role checks
│   ├── routes/           # /api/* route definitions
│   ├── services/         # Paystack verification
│   ├── db/schema.sql     # Database schema + seed instructions
│   └── server.js         # App entry point
└── pos-frontend/         # React app (Vite)
    └── src/
        ├── api/axios.js       # API client (attaches JWT automatically)
        ├── components/        # Sidebar, ProtectedRoute
        ├── context/           # AuthContext (login state)
        ├── pages/             # Dashboard, Sales, Products, Inventory, Customers, Analytics, Login
        └── styles/            # index.css design system + per-page styles
```

---

## Getting Started

### Prerequisites

- **Node.js 18+** (with npm) — https://nodejs.org
- **PostgreSQL 14+** — https://www.postgresql.org/download/
- A **Paystack account** (free) for test API keys — https://dashboard.paystack.com

### 1. Clone and install

```bash
git clone <this-repo>
cd pos-system-

# Backend dependencies
cd pos-backend
npm install

# Frontend dependencies
cd ../pos-frontend
npm install
```

### 2. Create the database

**Option A — Docker (no PostgreSQL install needed):**

```bash
docker run -d --name swiftpos-postgres --restart unless-stopped ^
  -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=your_password ^
  -e POSTGRES_DB=pos_system -p 5432:5432 ^
  -v swiftpos_pgdata:/var/lib/postgresql/data postgres:16-alpine

# Create all tables (from the pos-backend folder)
type db\schema.sql | docker exec -i swiftpos-postgres psql -U postgres -d pos_system
```

The container auto-starts whenever Docker Desktop is running. To run SQL later:
`docker exec -it swiftpos-postgres psql -U postgres -d pos_system`

**Option B — native PostgreSQL install:**

```bash
# Create an empty database (enter your postgres password when prompted)
psql -U postgres -c "CREATE DATABASE pos_system;"

# Create all tables
psql -U postgres -d pos_system -f pos-backend/db/schema.sql
```

### 3. Configure the backend

```bash
cd pos-backend
copy .env.example .env      # macOS/Linux: cp .env.example .env
```

Edit `pos-backend/.env`:

| Variable | What to put |
|----------|-------------|
| `PORT` | `3000` (default) |
| `DB_USER` / `DB_HOST` / `DB_NAME` / `DB_PASSWORD` / `DB_PORT` | Your local PostgreSQL credentials (`DB_NAME=swiftpos`) |
| `DATABASE_URL` | *Alternative* to the five vars above — a single connection string (used on Render/Neon). Leave commented for local dev. |
| `JWT_SECRET` | Any long random string |
| `PAYSTACK_SECRET_KEY` | Your Paystack **secret** test key (`sk_test_...`) |

### 4. Create your first login (Admin user)

There is no signup screen — staff accounts are inserted directly. Generate a password hash, then insert the user:

```bash
cd pos-backend
node hash.js mypassword123
```

Copy the printed hash and run (replace the hash):

```bash
psql -U postgres -d swiftpos -c "INSERT INTO users (name, email, password, role) VALUES ('Admin', 'admin@swiftpos.com', '<PASTE_HASH_HERE>', 'Admin');"
```

Repeat with role `'Manager'` or `'Cashier'` for additional staff.

### 5. Configure the frontend

```bash
cd pos-frontend
copy .env.example .env      # macOS/Linux: cp .env.example .env
```

Edit `pos-frontend/.env`:

| Variable | What to put |
|----------|-------------|
| `VITE_API_URL` | `http://localhost:3000/api` (default backend address) |
| `VITE_PAYSTACK_PUBLIC_KEY` | Your Paystack **public** test key (`pk_test_...`) |

### 6. Run it

Open two terminals:

```bash
# Terminal 1 — backend (http://localhost:3000)
cd pos-backend
npm run dev

# Terminal 2 — frontend (http://localhost:5173)
cd pos-frontend
npm run dev
```

Visit **http://localhost:5173** and sign in with the admin account you created in step 4.

Sanity checks if something fails:
- `http://localhost:3000/` should say “POS API is running”.
- `http://localhost:3000/test-db` should return a timestamp (confirms the DB connection).

### Testing payments

Use Paystack **test keys** — card and mobile-money checkouts open a Paystack popup that accepts [Paystack test cards](https://paystack.com/docs/payments/test-payments/) (e.g. `4084 0840 8408 4081`, any future expiry, CVV `408`). Cash payments need no external service.

---

## API Overview

All routes are prefixed with `/api` and (except login) require an `Authorization: Bearer <token>` header.

| Route | Purpose |
|-------|---------|
| `POST /auth/login` | Login → returns JWT, role, name |
| `GET/POST/PUT/DELETE /products` | Product CRUD |
| `GET /inventory`, `PUT /inventory/restock/:id`, `PUT /inventory/update/:id` | Stock management |
| `POST /sales`, `GET /sales`, `PUT /sales/void/:id` | Create/list/void sales |
| `POST /payments`, `POST /payments/verify-paystack` | Record payments, verify Paystack references |
| `GET/POST/PUT/DELETE /customers`, `PUT /customers/:id/add-points`, `.../redeem-points` | Customers + loyalty |
| `GET /analytics/summary\|chart\|top-products\|payment-methods\|low-stock` | Dashboard/analytics data |

## Deployment Notes

- The backend supports a single `DATABASE_URL` (with SSL) for hosts like Render or Neon.
- Set `FRONTEND_URL` on the backend to your deployed frontend origin so CORS allows it.
- `pos-frontend/public/_headers` sets a Content-Security-Policy for Paystack. If the deployed backend is on a different origin, add that origin to the `connect-src` directive or API calls will be blocked in production.
