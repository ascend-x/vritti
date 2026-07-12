# VRITTI ⚡ 
**Flow State Transport Operations Platform**

VRITTI is an end-to-end transport operations platform that digitizes vehicle, driver, dispatch, maintenance, and expense management while enforcing strict business rules and providing real-time operational insights.

---

## 📖 Business Context
Many logistics companies rely on spreadsheets and manual logbooks to manage their transport operations. This leads to scheduling conflicts, underutilized vehicles, missed maintenance, expired driver licenses, inaccurate expense tracking, and poor operational visibility.

**VRITTI** centralizes the complete lifecycle of transport operations into a single cohesive platform.

## ✨ Key Features
- **Fleet Registry**: Comprehensive CRUD for vehicles, tracking load capacities, acquisition costs, and maintenance statuses.
- **Driver Management**: Manage drivers, track safety scores, and monitor license expiry (with visual indicators and automatic suspension rules).
- **Dispatch & Trip Management**: 
  - Complete trip lifecycle tracking (Draft → Dispatched → Completed / Cancelled).
  - Business Rule Enforcement (e.g., Cannot dispatch a vehicle that is 'In Shop' or a driver who is 'Suspended').
  - Cargo weight validation against vehicle capacity.
- **Maintenance Logging**: Open/close maintenance tickets, automatically marking vehicles as 'In Shop' to prevent accidental dispatches.
- **Fuel & Expense Tracking**: Log fuel consumption and operational costs like tolls, automatically calculating trip/vehicle efficiency.
- **Analytics Dashboard**: Real-time KPIs, Fuel Efficiency metrics, Monthly Revenue, Fleet Utilization trends, and Vehicle ROI calculation.
- **Role-Based Access Control (RBAC)**: Distinct views and permissions for Fleet Managers, Dispatchers, Safety Officers, and Financial Analysts.

---

## 🛠 Tech Stack

**Architecture**: Monorepo with split `server/` and `client/` directories.

**Frontend (`/client`)**:
- React 18 (Vite)
- TailwindCSS (Custom Amber brand aesthetics)
- React Router DOM
- React Query (Data fetching/caching)
- Zustand (Auth state management)
- Recharts (Analytics visualization)
- Lucide React (Icons)

**Backend (`/server`)**:
- Node.js & Express
- SQLite3 (via `better-sqlite3` for high performance synchronous queries)
- JSON Web Tokens (JWT) for secure authentication

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js (v18 or higher)
- npm

### 2. Installation
Clone the repository and install all dependencies (this installs root, server, and client dependencies).

```bash
git clone https://github.com/ascend-x/vritti.git
cd vritti

# Install concurrently and all sub-project dependencies
npm install
cd client && npm install
cd ../server && npm install
cd ..
```

### 3. Database Initialization & Seeding
Initialize the SQLite database and seed it with dummy data (includes generated trips, maintenance, and analytics data).

```bash
cd server
npm run seed
cd ..
```

### 4. Running the Platform
Start both the backend API and the frontend Vite server concurrently:

```bash
npm run dev
```

- **Frontend**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:5000/api](http://localhost:5000/api)

---

## 🔑 Demo Credentials
The platform is seeded with 4 default users demonstrating the RBAC features:

| Role | Email | Password |
|------|-------|----------|
| Fleet Manager | `admin@vritti.com` | `password123` |
| Dispatcher | `dispatch@vritti.com` | `password123` |
| Safety Officer | `safety@vritti.com` | `password123` |
| Financial Analyst | `finance@vritti.com` | `password123` |

---

## 📁 Project Structure

```text
vritti/
├── client/                     # React Frontend
│   ├── src/
│   │   ├── api/                # Axios interceptors & API client functions
│   │   ├── components/         # Reusable UI components & layouts
│   │   ├── pages/              # Application views (Dashboard, Trips, Analytics, etc.)
│   │   ├── store/              # Zustand state (auth)
│   │   └── utils/              # RBAC logic, constants, formatters
│   └── package.json            
├── server/                     # Express Backend
│   ├── src/
│   │   ├── db/                 # database.js, schema migrations, seed scripts
│   │   ├── middleware/         # auth.middleware.js (JWT validation & RBAC)
│   │   ├── routes/             # REST endpoints (vehicles, trips, analytics, etc.)
│   │   └── services/           # Core business logic (atomic transactions)
│   └── package.json
└── package.json                # Root package (concurrently dev script)
```

---
*Built during the 8-Hour Hackathon.*
