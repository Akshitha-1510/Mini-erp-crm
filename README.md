# 📦 Mini ERP + CRM Operations Portal

> **Full-Stack Wholesale & Distribution Operations Management System**  
> Built with **Node.js, Express, TypeScript, Prisma ORM, React 18, and Vite**.

---

## 🌟 Executive Summary & Key Features

This repository implements a production-ready **Mini ERP + CRM Portal** tailored for wholesale and distribution enterprises. The system coordinates operations across four distinct role functions (**Admin**, **Sales**, **Warehouse**, **Accounts**) and manages customer relationships, stock control, audit logs, and transactional sales challans with automatic stock deduction.

### 🔑 Core Capabilities
- **Authentication & RBAC**: JWT-based authentication with strict role-based authorization guards across endpoints and UI actions.
- **Customer CRM Module**: Manage customer pipelines (`Lead`, `Active`, `Inactive`), classifications (`Retail`, `Wholesale`, `Distributor`), scheduled follow-up dates, and immutable timeline note logs.
- **Product & Inventory Module**: Real-time product catalog with custom SKUs, pricing, warehouse locations, and automated **Low Stock Warning Alerts**.
- **Stock Movement Audit Log**: Immutable record of all manual and automated stock movements (`IN` / `OUT`), tracking changed quantity, mandatory reason, created by user, and timestamp.
- **Sales Challans & Invoicing**:
  - Auto-generated sequential challan numbers (`CH-YYYYMMDD-XXXX`).
  - Stores product snapshot data (locking unit prices & product state at creation).
  - **Transactional Stock Deduction**: When a Challan is **Confirmed**, stock is reduced atomically. If inventory is insufficient, the system blocks negative stock and returns a clear 400 error.
  - **Printable / Exportable Invoice**: Integrated print modal formatted for official wholesale invoices.
- **Executive Dashboard**: Real-time KPI summaries, stock alert banners, customer pipelines, and live activity feeds.
- **Interactive API & Architecture Hub**: Embedded documentation view with 1-click Postman Collection JSON export.

---

## 🔐 Test Role Credentials Matrix

For rapid testing and evaluation, 1-click role preset login buttons are built directly into the Login UI screen:

| Role | Email | Password | Access & Responsibilities |
| :--- | :--- | :--- | :--- |
| 🛡️ **Admin** | `admin@erp.com` | `password123` | Full unrestricted read & write system access across all modules |
| 💼 **Sales** | `sales@erp.com` | `password123` | Customer CRM, follow-up notes, and Sales Challan creation |
| 📦 **Warehouse** | `warehouse@erp.com` | `password123` | Product catalog, min stock alert thresholds, and manual stock IN/OUT adjustments |
| 📑 **Accounts** | `accounts@erp.com` | `password123` | Sales Challan review, billing exports, and customer notes |

---

## 🛠️ Tech Stack

### Backend
- **Runtime & Language**: Node.js & TypeScript
- **Framework**: Express.js
- **Database & ORM**: Prisma ORM (Pre-configured with SQLite for zero-config local run, 100% PostgreSQL schema compatible for cloud deployment)
- **Security & Auth**: JWT (`jsonwebtoken`) & `bcryptjs`
- **Validation**: Zod schema validation

### Frontend
- **Framework**: React 18 (Vite + TypeScript)
- **UI & Icons**: Lucide Icons & Custom Glassmorphism Vanilla CSS Design System
- **HTTP Client**: Axios with JWT Authorization request interceptors

---

## 🚀 Local Development Setup Guide

### Prerequisites
- **Node.js**: v18.x or v20.x installed
- **Git**: Installed

### 1. Clone the Repository
```bash
git clone https://github.com/YOUR_USERNAME/mini-erp-crm.git
cd mini-erp-crm
```

### 2. Backend Setup & Local Database Seeding
```bash
cd backend
npm install

# Push database schema & generate Prisma client
npx prisma db push

# Seed demo users (Admin, Sales, Warehouse, Accounts), products, and customers
npm run seed

# Start Backend API server (Runs on http://localhost:5000)
npm run dev
```

### 3. Frontend Setup
Open a new terminal window:
```bash
cd frontend
npm install

# Start Frontend Vite dev server (Runs on http://localhost:3000)
npm run dev
```

Visit **`http://localhost:3000`** in your browser.

---

## 🐳 Docker Deployment Setup (Optional / Bonus)

You can run the entire full-stack application (Backend API + Frontend Nginx server) using Docker Compose:

```bash
docker-compose up --build
```

- **Frontend Application**: `http://localhost:3000`
- **Backend API Server**: `http://localhost:5000/api/health`

---

## ☁️ Free Cloud Deployment Guide

### Option 1: Frontend on Vercel / Netlify
1. Connect your GitHub repository to **Vercel** or **Netlify**.
2. Set Root Directory to `frontend`.
3. Build Command: `npm run build`
4. Output Directory: `dist`

### Option 2: Backend on Render / Railway / Fly.io
1. Create a Web Service on **Render**.
2. Connect the `backend` directory.
3. Environment Variables:
   - `PORT=5000`
   - `DATABASE_URL` (Provide PostgreSQL URL from Neon / Render Postgres)
   - `JWT_SECRET=super_secret_key`
4. Build Command: `npm install && npx prisma generate && npm run build`
5. Start Command: `npx prisma db push && npm run seed && npm start`

### Option 3: Database on Neon Postgres / Supabase (Free Tier)
1. Create a free PostgreSQL instance on **Neon.tech** or **Supabase**.
2. Copy the Connection String into `DATABASE_URL`.
3. Prisma will automatically map models to PostgreSQL without code changes!

---

## 📋 REST API Endpoints Reference

| Method | Endpoint | Description | Permitted Roles |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Authenticate user & issue JWT token | Public |
| `GET` | `/api/auth/me` | Fetch active user profile | Authenticated |
| `GET` | `/api/customers` | Search & filter customer list | Authenticated |
| `POST` | `/api/customers` | Add new customer account | Admin, Sales |
| `GET` | `/api/customers/:id` | Get customer detail & timeline notes | Authenticated |
| `PUT` | `/api/customers/:id` | Update customer details | Admin, Sales |
| `POST` | `/api/customers/:id/notes` | Log follow-up note & update status | Admin, Sales, Accounts |
| `GET` | `/api/products` | List product catalog & stock alerts | Authenticated |
| `POST` | `/api/products` | Add new product to catalog | Admin, Warehouse |
| `PUT` | `/api/products/:id` | Update product price/min alert | Admin, Warehouse |
| `POST` | `/api/products/:id/adjust-stock` | Manual Stock Movement (IN/OUT) | Admin, Warehouse |
| `GET` | `/api/products/movements/log` | Stock movement audit history | Authenticated |
| `GET` | `/api/challans` | List Sales Challans | Authenticated |
| `POST` | `/api/challans` | Create Sales Challan with stock check | Admin, Sales |
| `PUT` | `/api/challans/:id/status` | Confirm/Cancel Challan & adjust stock | Authenticated |
| `GET` | `/api/dashboard/stats` | Executive KPI stats & low-stock alerts | Authenticated |

---

## 📄 Postman Collection

An exportable Postman collection is included in the project root: `postman_collection.json`.  
You can also download it directly from the UI by clicking **Download Postman Collection** under the **API & Architecture** tab.

---

## 🔒 Architectural Decisions & Assumptions

1. **Transactional Integrity**: Prisma interactive transactions (`prisma.$transaction`) are used when confirming Challans and recording manual stock movements. This guarantees atomic stock updates—if any item in a multi-item challan lacks sufficient stock, all changes roll back and an informative error is returned.
2. **Snapshot Storage**: Challans store product snapshots as JSON strings upon creation. If a product's price or name changes in the master catalog later, historical sales challans and invoices retain the exact prices and metadata at the time of sale.
3. **Zero-Dependency Quickstart**: SQLite is enabled out of the box so anyone can clone and run `npm run dev` instantly without needing local database installation. Switching to cloud PostgreSQL for production requires changing only the database provider string.
