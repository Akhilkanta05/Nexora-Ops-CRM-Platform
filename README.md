# FUNSROOMS — Mini ERP + CRM Operations Portal

A full-stack, enterprise-grade Mini ERP + CRM operations portal designed for wholesale and distribution companies. The system manages customers, products, inventory stock, purchase orders, automated sales challans, invoice generation, and CRM follow-ups with role-based access control (RBAC).

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│             Frontend (React 18 + Vite + TypeScript)         │
│  - Responsive Admin Layout with Role-based Views            │
│  - Quick Demo Credentials & Session Switcher                │
│  - Real-time Stock Indicators & Low Stock Warnings          │
│  - Multi-Product Challan Builder with Stock Integrity Guard │
│  - Downloadable PDF Delivery Challans & Invoices            │
└──────────────────────────────┬──────────────────────────────┘
                               │ REST APIs (Bearer JWT)
┌──────────────────────────────▼──────────────────────────────┐
│            Backend (Node.js + Express + TypeScript)         │
│  - Modular Router & Controller Architecture                 │
│  - RBAC Middleware (ADMIN, SALES, WAREHOUSE, ACCOUNTS)      │
│  - Zod Input & Query Validation Middleware                  │
│  - Atomic Transactions ($transaction) for Stock Reductions │
│  - PDFKit Invoice Generation Engine                         │
└──────────────────────────────┬──────────────────────────────┘
                               │ Prisma ORM
┌──────────────────────────────▼──────────────────────────────┐
│                     PostgreSQL / SQLite                     │
│  - Users & Roles                                            │
│  - Customers & Follow-up Timeline Logs                      │
│  - Products & Immutable Stock Movement Audit Trail          │
│  - Sales Challans & Historical Product Item Snapshots       │
└─────────────────────────────────────────────────────────────┘
```

---

## Test Login Credentials for All Roles

The database seeder automatically configures test accounts for all 4 roles. You can either sign in with them manually or click any role button on the login screen:

| Role | Email | Password | Allowed Capabilities |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@funsrooms.com` | `Admin@123` | Full access across all modules, inventory, and users |
| **Sales** | `sales@funsrooms.com` | `Sales@123` | Customer CRM, follow-up timeline notes, Create/Draft/Confirm Challans |
| **Warehouse** | `warehouse@funsrooms.com` | `Warehouse@123` | Product catalog, Stock adjustments (IN/OUT), movement audit logs, dispatch |
| **Accounts** | `accounts@funsrooms.com` | `Accounts@123` | View customers, view challans, download PDF invoices, revenue KPIs |

---

## Core Business Logic Highlights

### 1. Atomic Stock Reduction on Challan Confirmation
- When a sales challan is confirmed, the backend runs a single atomic database transaction (`prisma.$transaction`).
- It first verifies that available stock is sufficient for every product line item.
- If any line item exceeds stock, the transaction aborts and returns an itemized `400 Bad Request` error:
  `"Cannot confirm challan due to insufficient stock: Industrial Drill - In Stock: 4, Required: 10"`.
- Stock **never goes negative**.
- On confirmation, stock is decremented and an immutable `StockMovement` audit log of type `OUT` is generated.

### 2. Historical Product & Customer Snapshot Preservation
- Wholesale catalogs experience price changes and SKU updates over time.
- To protect accounting accuracy, each challan persists immutable **snapshots**:
  - `customerSnapshot`: Name, business, mobile, email, address, and GSTIN.
  - `ChallanItem`: Snapshot of product name, SKU code, unit price, quantity, and total price at the time of creation.
  - Subsequent updates to a product's price or description will not alter historical challans.

### 3. Challan Cancellation Stock Reversal
- If an authorized user cancels a confirmed challan, an atomic transaction increments the warehouse stock back by the exact quantities and logs a `StockMovement` of type `IN` with reason: `"Sales Challan Cancellation (CH-XXXX)"`.

### 4. Low Stock Proactive Alerts
- Each product defines a `minStockAlert` threshold.
- The UI features pulsating warning pills and a "Filter Low Stock Alerts" toggle whenever `currentStock <= minStockAlert`.

---

## How to Run Locally

### Prerequisites
- Node.js (v18 or higher) & npm
- Git

### Quick Setup (Zero External Dependencies)

The project includes an automatic SQLite mode (`dev.db`) for immediate local execution with zero setup, alongside production-ready PostgreSQL configurations.

1. **Clone the repository**:
   ```bash
   git clone <repo-url>
   cd funsrooms
   ```

2. **Install dependencies and setup database**:
   ```bash
   # Install backend dependencies
   cd backend
   npm install

   # Push schema and seed test data
   npx prisma generate
   npx prisma db push
   npm run prisma:seed

   # Start backend API (runs on port 5000)
   npm run dev
   ```

3. **Start the frontend** (in a separate terminal):
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

4. Open your browser at: **`http://localhost:5173`**

---

## Running with Docker Compose (PostgreSQL + Backend + Frontend)

If you have Docker and Docker Compose installed:

```bash
docker-compose up --build
```

This spins up:
- **PostgreSQL 16**: Port `5432`
- **Backend API**: Port `5000`
- **Frontend App (Nginx)**: Port `3000`

---

## How Environment Variables Are Managed

Environment variables are isolated into `.env` files (with `.env.example` templates committed):

### Backend (`backend/.env`)
| Variable | Description | Example |
| :--- | :--- | :--- |
| `PORT` | API server port | `5000` |
| `NODE_ENV` | Environment mode | `development` / `production` |
| `DATABASE_URL` | PostgreSQL or SQLite connection string | `postgresql://user:pass@host:5432/funsrooms_erp?schema=public` |
| `JWT_SECRET` | Secret key for signing JWT tokens | `your_secure_random_key` |
| `JWT_EXPIRES_IN` | Session validity duration | `7d` |
| `FRONTEND_URL` | Allowed origin for CORS | `http://localhost:5173` |

---

## How to Deploy the Project

### Option A: Free Cloud Deployment (Recommended)

1. **Database (Neon or Supabase Postgres)**:
   - Create a free PostgreSQL instance on [Neon](https://neon.tech) or [Supabase](https://supabase.com).
   - Copy the connection string into `DATABASE_URL`.
   - Run `npm run use:postgres` in the `backend/` directory, then `npx prisma db push && npm run prisma:seed`.

2. **Backend (Render, Railway, or Fly.io)**:
   - Push code to GitHub.
   - Connect repository to [Render](https://render.com) as a Web Service.
   - Root directory: `backend`
   - Build command: `npm install && npm run prisma:generate && npm run build`
   - Start command: `node dist/server.js`
   - Set environment variables (`DATABASE_URL`, `JWT_SECRET`, `NODE_ENV=production`).

3. **Frontend (Vercel or Netlify)**:
   - Connect repository to [Vercel](https://vercel.com).
   - Root directory: `frontend`
   - Framework preset: `Vite`
   - Build command: `npm run build`
   - Output directory: `dist`
   - Add environment variable `VITE_API_URL` pointing to the live backend URL.

### Option B: AWS Deployment
- **Database**: AWS RDS PostgreSQL (db.t3.micro free tier) or Aurora Serverless.
- **Backend**: AWS Elastic Beanstalk (Node.js platform) or AWS ECS / Fargate container using `backend/Dockerfile`.
- **Frontend**: AWS S3 Static Website Hosting + CloudFront CDN distribution.
- **Product Images**: S3 bucket with AWS IAM role / SDK upload policy.

---

## API Documentation & Postman Collection

The root directory contains **`postman_collection.json`** ready to import into Postman:
- **Authentication**: Login for all 4 roles, session inspection (`/api/auth/me`), demo accounts list.
- **Dashboard**: KPI statistics and real-time operational activity (`/api/dashboard/overview`).
- **Customer CRM**: List with search and status filters, customer profile, create, edit, and add follow-up notes.
- **Product & Inventory**: SKU catalog, low-stock filter, add/edit product, quick stock adjustments, and movement audit logs.
- **Sales Challans**: Multi-product challan creation, atomic stock confirmation, cancellation stock rollback, and PDF invoice generation.

---

## Automated Verification Suite

To run the business logic test suite validating atomic stock deduction, negative stock prevention, and RBAC:

```bash
cd backend
npx ts-node test-suite.ts
```

All 14 business logic tests run in-memory and report automated pass/fail results.

---

## Assumptions Made & Known Limitations

1. **Sequential Challan Numbering**: Challans follow the standard format `CH-YYYYMMDD-XXXX`.
2. **Product Snapshots**: Challans snapshot the product title, SKU, and unit price at the time of creation so historical financial reporting remains unchanged even if wholesale prices change later.
3. **Currency**: All monetary values are rendered in Indian Rupees (INR, ₹) formatted to standard decimal places.
4. **GST Numbers**: GSTIN is validated for length and uppercase formatting, but remains optional to accommodate unregistered retail accounts.
