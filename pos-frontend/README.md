# SwiftPOS — Frontend

React (Vite) frontend for the SwiftPOS point-of-sale system. Talks to the Express API in [`../pos-backend`](../pos-backend).

> **Full project setup** (database, backend, creating your first login) is documented in the [root README](../README.md). This file covers the frontend only.

## Requirements

- Node.js 18+ and npm
- The backend running (default `http://localhost:3000`) — see root README
- A Paystack **public** test key for card / mobile-money payments

## Setup & Run

```bash
npm install

# Configure environment
copy .env.example .env      # macOS/Linux: cp .env.example .env
```

`.env` values:

| Variable | Description | Local default |
|----------|-------------|---------------|
| `VITE_API_URL` | Backend API base URL (must end with `/api`) | `http://localhost:3000/api` |
| `VITE_PAYSTACK_PUBLIC_KEY` | Paystack public key (`pk_test_...`) | — |

```bash
# Start dev server → http://localhost:5173
npm run dev

# Production build (output in dist/)
npm run build

# Preview the production build locally
npm run preview

# Lint
npm run lint
```

## Structure

```
src/
├── api/axios.js        # Axios instance — attaches the JWT to every request
├── components/
│   ├── Sidebar.jsx     # Shared role-aware navigation sidebar
│   └── ProtectedRoute.jsx
├── context/AuthContext.jsx   # Login state (token/role/name in localStorage)
├── pages/              # One component per screen
│   ├── login.jsx
│   ├── Dashboard.jsx   # All roles
│   ├── Sales.jsx       # All roles — cart, checkout, receipts, void
│   ├── Products.jsx    # Admin/Manager
│   ├── Inventory.jsx   # Admin/Manager
│   ├── Customers.jsx   # Admin/Manager — loyalty points
│   ├── Analytics.jsx   # Admin/Manager — charts (Recharts)
│   └── Unauthorized.jsx
├── index.css           # Design system: tokens + shared sidebar/buttons/modals/tables
└── styles/<page>.css   # Page-specific styles only
```

## Design system

Global styles and design tokens live in `src/index.css` (colors, radii, shadows, the dark sidebar, buttons, modals, tables, badges). Page stylesheets in `src/styles/` contain only what is unique to that page and reference the tokens (`var(--primary)`, `var(--border)`, …). Icons come from [`react-icons/fi`](https://react-icons.github.io/react-icons/icons/fi/) (Feather).

## Notes

- Paystack's inline script is loaded in `index.html`; `public/_headers` sets the Content-Security-Policy that allows it. When deploying with the API on another origin, add that origin to `connect-src`.
- Role-based route protection is enforced in `App.jsx` via `ProtectedRoute`; the sidebar additionally hides pages the current role can't open.
