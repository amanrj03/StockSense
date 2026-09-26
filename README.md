<p align="center">
  <img src="public/lemon_logo.png" alt="Lemon Logo" width="80" />
</p>

<h1 align="center">🍋 Lemon</h1>

<p align="center">
  <strong>Inventory Management System</strong><br/>
  <em>Replacing manual registers and spreadsheets with a centralized, real‑time inventory platform.</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?logo=nextdotjs" alt="Next.js 16" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Prisma-7-2D3748?logo=prisma" alt="Prisma 7" />
  <img src="https://img.shields.io/badge/PostgreSQL-Neon-4169E1?logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Tailwind%20CSS-4-06B6D4?logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
</p>

---

## 📋 Table of Contents

- [About](#about)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Database Schema](#database-schema)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Project Structure](#project-structure)
- [Screenshots](#screenshots)
- [License](#license)

---

## About

**Lemon** is a full‑stack, production‑ready Inventory Management System designed to digitize and centralize all stock‑related operations across a business. It gives warehouse and inventory teams a live, auditable view of stock across multiple warehouses and locations.

Every transaction — whether incoming stock, outgoing shipments, internal moves, or stock corrections — is logged to a single, insert‑only stock movement ledger, ensuring full traceability of **who moved what, from where, to where, and when**.

### Business Objectives

- Eliminate manual, error‑prone stock tracking (registers / spreadsheets) with a centralized system of record
- Provide real‑time visibility into stock levels, pending operations, and exceptions (late / waiting operations)
- Standardize receiving, dispatch, internal‑movement, and reconciliation workflows across warehouses
- Support multi‑warehouse and multi‑location operations with a consistent document‑numbering scheme
- Give managers a single dashboard to monitor daily operational health

---

## Features

### 🔐 Authentication
- Credential‑based login with **JWT sessions** (no server‑side session storage)
- Sign up with strong validation (Login ID uniqueness, email uniqueness, password strength rules)
- **OTP‑based password reset** via email (Resend) with HMAC‑hashed tokens, 15‑min expiry, rate limiting, and brute‑force protection

### 📊 Dashboard
- **5 KPI cards** — Total Products in Stock, Low/Out of Stock, Pending Receipts, Pending Delivery Orders, Scheduled Transfers
- **Operation summary cards** — per‑type counts broken down by Late, Upcoming, and Waiting
- **Dynamic filters** — by document type, status, warehouse, location, and product category
- **Interactive charts** powered by Recharts

### 📦 Product Management
- Full CRUD with searchable, paginated table
- Fields: Name, SKU (unique), Category, Unit of Measure, Per Unit Cost, Reorder Level, Reorder Quantity
- Low‑stock alerts triggered by reorder level thresholds

### 📈 Stock Overview
- Read‑only view of per‑product per‑location stock levels
- Displays **On Hand**, **Reserved**, and **Free to Use** (computed: On Hand − Reserved)
- Search by product or SKU, filter by warehouse/location
- Direct edits are blocked — all corrections must go through Stock Adjustments to maintain audit integrity

### 🔄 Operations

| Operation | Code | Purpose | Status Workflow |
|---|---|---|---|
| **Receipts** | `WH/IN/xxxx` | Incoming stock from vendors | Draft → Ready → Done |
| **Delivery Orders** | `WH/OUT/xxxx` | Outgoing stock to customers | Draft → Waiting/Ready → Done |
| **Internal Transfers** | `WH/INT/xxxx` | Move stock between locations | Draft → Ready → Done |
| **Stock Adjustments** | `WH/ADJ/xxxx` | Reconcile system vs. physical count | Draft → Done |

- **Auto‑generated reference numbers** — atomic per‑warehouse per‑operation‑type sequences (`WH/IN/0001`)
- **Receipts**: Stock automatically increases at destination on validation
- **Delivery Orders**: Stock automatically decreases on validation; out‑of‑stock items trigger Waiting status + red line highlighting
- **Internal Transfers**: Total stock unchanged — each line produces two movements (TRANSFER_OUT + TRANSFER_IN)
- **Stock Adjustments**: Reasons required (Damaged / Lost / Miscount / Other)

### 📜 Move History
- Consolidated, **read‑only audit ledger** of every stock movement
- Incoming moves in **green**, outgoing in **red**
- Search by reference or contact
- Insert‑only — no edits or deletes allowed

### ⚙️ Settings
- **Warehouse Master** — Name, Short Code (used in references), Address
- **Location Master** — Name, Short Code, linked to parent Warehouse

### 🔍 Additional
- **Global search** — search across products, operations, and warehouses
- **Notifications** — alerts for low stock, late operations, waiting orders
- **Pagination** across all list views
- **Color‑coded status badges** throughout the app
- **Responsive design** — works on desktop and tablet

---

## Tech Stack

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| [Next.js](https://nextjs.org/) | 16 | Full‑stack React framework (App Router, Server Components) |
| [React](https://react.dev/) | 19 | UI library with Server Actions and `useActionState` |
| [TypeScript](https://typescriptlang.org/) | 5 | End‑to‑end type safety |
| [Tailwind CSS](https://tailwindcss.com/) | 4 | Utility‑first CSS framework |
| [Shadcn UI](https://ui.shadcn.com/) | Latest | Accessible UI component library |
| [Recharts](https://recharts.org/) | 2.x | Data visualization / charts |
| [React Icons](https://react-icons.github.io/) | 5.x | Material Design icon set |
| [Geist Font](https://vercel.com/font) | — | Modern sans‑serif + monospace typography |

### Backend
| Technology | Version | Purpose |
|---|---|---|
| [NextAuth.js](https://authjs.dev/) (Auth.js) | v5 beta | Authentication (Credentials provider, JWT strategy) |
| [bcryptjs](https://github.com/nicolo-ribaudo/bcryptjs) | 3.x | Secure password hashing |
| [Zod](https://zod.dev/) | 4.x | Runtime schema validation for all inputs |
| [Resend](https://resend.com/) | 6.x | Transactional email API (OTP delivery) |

### Database & ORM
| Technology | Version | Purpose |
|---|---|---|
| [PostgreSQL](https://www.postgresql.org/) | — | Relational database |
| [Neon](https://neon.tech/) | — | Serverless PostgreSQL hosting |
| [Prisma ORM](https://www.prisma.io/) | 7 | Type‑safe ORM with migrations |
| [@prisma/adapter‑neon](https://www.prisma.io/docs/orm/overview/databases/neon) | 7.x | Serverless Neon driver adapter |
| [@prisma/adapter‑pg](https://www.prisma.io/docs/orm/overview/databases/postgresql) | 7.x | Standard PG adapter (local dev) |

---

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│                       Client (Browser)                   │
│  React 19 · Server Components · Client Components        │
└──────────────┬────────────────────────┬──────────────────┘
               │ Server Actions         │ API Routes
               ▼                        ▼
┌──────────────────────────────────────────────────────────┐
│                    Next.js 16 Server                     │
│                                                          │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────┐  │
│  │   Actions    │  │   Services   │  │  Validations   │  │
│  │  (mutations) │──│ (biz logic)  │  │   (Zod v4)     │  │
│  └──────┬──────┘  └──────┬───────┘  └────────────────┘  │
│         │                │                               │
│         ▼                ▼                               │
│  ┌──────────────────────────────────┐                    │
│  │  Prisma ORM v7 (Type‑safe)      │                    │
│  │  Auto‑detects Neon vs Local PG   │                    │
│  └──────────────┬───────────────────┘                    │
└─────────────────┼────────────────────────────────────────┘
                  │
                  ▼
┌──────────────────────────────────────────────────────────┐
│           PostgreSQL (Neon Serverless / Local)            │
│                                                          │
│  18 Models · 7 Enums · Insert‑only Movement Ledger       │
└──────────────────────────────────────────────────────────┘
```

**Key architectural decisions:**
- **No separate REST/GraphQL API** — all mutations go through Next.js Server Actions
- **Prisma auto‑adapter detection** — the client auto‑detects Neon vs local PostgreSQL based on the connection string hostname
- **Insert‑only audit trail** — `StockMovement` rows are never updated or deleted
- **Warehouse derivation** — warehouse is always derived from `location.warehouseId`, never stored redundantly on operations

---

## Database Schema

The Prisma schema defines **18 models** and **7 enums**:

```
Auth:        User, Account, Session, VerificationToken
Inventory:   Warehouse, Location, Category, Product, Stock
Operations:  Receipt, ReceiptLine,
             DeliveryOrder, DeliveryOrderLine,
             InternalTransfer, InternalTransferLine,
             StockAdjustment
Audit:       StockMovement
Sequences:   OperationCounter
```

### Reference Number Format

```
<Warehouse ShortCode> / <Operation Code> / <Sequence>

Examples:
  WH/IN/0001   — 1st Receipt at warehouse "WH"
  WH/OUT/0003  — 3rd Delivery Order at warehouse "WH"
  WH/INT/0001  — 1st Internal Transfer
  WH/ADJ/0002  — 2nd Stock Adjustment
```

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **PostgreSQL** (local instance or [Neon](https://neon.tech/) account)
- **npm** (comes with Node.js)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/amanrj03/StockSense.git
cd StockSense

# 2. Install dependencies
npm install

# 3. Set up environment variables (see section below)
cp .env.example .env
# Edit .env with your database URL and secrets

# 4. Generate Prisma client
npx prisma generate

# 5. Run database migrations
npx prisma migrate dev

# 6. (Optional) Seed the database with demo data
npm run db:seed

# 7. Start the development server
npm run dev
```

The app will be available at **http://localhost:3000**.

### Available Scripts

| Script | Command | Description |
|---|---|---|
| `dev` | `npm run dev` | Start Next.js development server |
| `build` | `npm run build` | Create production build |
| `start` | `npm run start` | Start production server |
| `lint` | `npm run lint` | Run ESLint |
| `db:seed` | `npm run db:seed` | Seed database with demo data |

---

## Environment Variables

Create a `.env` file in the project root with the following variables:

```env
# Database
DATABASE_URL="postgresql://user:password@host:5432/dbname?sslmode=require"

# Auth
AUTH_SECRET="your-auth-secret-here"       # Generate with: openssl rand -base64 32
AUTH_URL="http://localhost:3000"

# Email (Resend — for OTP password reset)
RESEND_API_KEY="re_xxxxxxxxxxxxx"
RESEND_FROM_EMAIL="noreply@yourdomain.com"
```

> **Note:** For Neon databases, the Prisma client automatically uses the serverless adapter. For local PostgreSQL, it uses the standard `pg` adapter. No configuration change needed.

---

## Project Structure

```
stocksense/
├── prisma/
│   ├── schema.prisma           # Database schema (18 models, 7 enums)
│   ├── migrations/             # Version‑controlled DB migrations
│   └── seed.ts                 # Demo data seeder
├── public/
│   ├── lemon_logo.png          # App logo
│   └── login.png               # Login page image
├── src/
│   ├── app/
│   │   ├── (auth)/             # Unauthenticated routes
│   │   │   ├── login/          #   Login page
│   │   │   ├── signup/         #   Sign up page
│   │   │   ├── forgot-password/#   Forgot password (enter email)
│   │   │   └── reset-password/ #   Reset password (enter OTP + new password)
│   │   ├── (app)/              # Protected routes (requires auth)
│   │   │   ├── dashboard/      #   Dashboard with KPIs and charts
│   │   │   ├── products/       #   Product management
│   │   │   ├── stock/          #   Stock overview (read‑only)
│   │   │   ├── operations/     #   Operations
│   │   │   │   ├── receipts/   #     Incoming stock
│   │   │   │   ├── delivery-orders/  Outgoing stock
│   │   │   │   ├── internal-transfers/ Location transfers
│   │   │   │   └── adjustments/#     Stock corrections
│   │   │   ├── move-history/   #   Audit ledger
│   │   │   ├── settings/       #   Warehouses & Locations
│   │   │   ├── search/         #   Global search results
│   │   │   ├── notifications/  #   Notification center
│   │   │   └── profile/        #   User profile
│   │   ├── api/auth/           # NextAuth API route handler
│   │   ├── layout.tsx          # Root layout (fonts, metadata)
│   │   └── globals.css         # Design tokens + Tailwind config
│   ├── components/
│   │   ├── layout/             # AppShell, Sidebar, TopHeader
│   │   ├── auth/               # Login, SignUp, ForgotPassword, ResetPassword forms
│   │   ├── dashboard/          # DashboardCharts
│   │   ├── products/           # ProductsTable, ProductDialog
│   │   ├── stock/              # StockTable
│   │   ├── receipts/           # NewReceiptForm, ReceiptActions
│   │   ├── delivery-orders/    # NewDeliveryOrderForm, DeliveryOrderActions
│   │   ├── internal-transfers/ # NewInternalTransferForm, InternalTransferActions
│   │   ├── adjustments/        # NewStockAdjustmentForm, StockAdjustmentActions
│   │   ├── settings/           # WarehousesTable, LocationsTable, Dialogs
│   │   └── ui/                 # Button, StatusBadge, Pagination
│   ├── lib/
│   │   ├── auth.ts             # NextAuth config (Credentials, JWT callbacks)
│   │   ├── prisma.ts           # Prisma client singleton (auto Neon/PG detection)
│   │   ├── actions/            # Server Actions (auth, receipt, delivery, etc.)
│   │   ├── services/           # Business logic (dashboard, move‑history, reference)
│   │   └── validations/        # Zod schemas for every form
│   ├── generated/prisma/       # Auto‑generated Prisma client
│   └── types/                  # TypeScript type definitions
├── .env                        # Environment variables (not committed)
├── package.json
├── tsconfig.json
├── next.config.ts
├── postcss.config.mjs
├── eslint.config.mjs
└── prisma7.config.ts           # Prisma 7 config (driver adapter setup)
```

---

## Screenshots

> Add screenshots of your application here:
> 
> - Login Page
> - Dashboard
> - Products Table
> - Receipt Form
> - Move History
> - Stock Overview

---

## License

This project is private and not licensed for public distribution.

---

<p align="center">
  Built with ❤️ using Next.js, React, Prisma, and PostgreSQL
</p>
