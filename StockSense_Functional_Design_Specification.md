> **Note on this revision:** Applied reviewer feedback — Internal Transfers added as a full operation, navigation switched to a left sidebar, product renamed to **Lemon** (formerly StockSense), Stock split out as its own nav item, Internal Transfer and Stock Adjustment forms fully specified, and terminology standardized to **Delivery Orders** / **Internal Transfers** throughout. Assumption made: since the naming/nav choice wasn't confirmed, this version adopts the reviewer's recommendation on both — flag if you intended to keep StockSense / top nav instead.

# 🍋 Lemon
### Inventory Management System — Functional Requirements & Design Specification

| | |
|---|---|
| **Document Type** | Functional & Design Specification (FDS) |
| **Product** | Lemon — Inventory Management System *(formerly StockSense)* |
| **Version** | 1.1 (Draft for Review) |
| **Date** | 26 September 2026 |
| **Prepared For** | Project Stakeholders / Engineering & QA Teams |
| **Source Inputs** | Problem Statement Document • Excalidraw Wireframes • Internal Design Review Feedback |
| **Classification** | Internal – Confidential |

*Replacing manual registers and spreadsheets with a centralized, real-time inventory platform.*

---

## Table of Contents

1. [Introduction & Project Overview](#1-introduction--project-overview)
2. [Scope](#2-scope)
3. [System Modules & Navigation](#3-system-modules--navigation)
4. [Functional Requirements – Authentication](#4-functional-requirements--authentication)
5. [Functional Requirements – Dashboard](#5-functional-requirements--dashboard)
6. [Functional Requirements – Products & Stock](#6-functional-requirements--products--stock)
7. [Functional Requirements – Operations](#7-functional-requirements--operations)
8. [Document Reference Numbering Convention](#8-document-reference-numbering-convention)
9. [Functional Requirements – Settings](#9-functional-requirements--settings)
10. [Non-Functional Requirements](#10-non-functional-requirements)
11. [Assumptions & Open Items](#11-assumptions--open-items)
12. [Appendix A – End-to-End Inventory Flow Example](#appendix-a--end-to-end-inventory-flow-example)
13. [Appendix B – Reference Material](#appendix-b--reference-material)
14. [Appendix C – Change Log](#appendix-c--change-log)

---

## 1. Introduction & Project Overview

Lemon is a modular Inventory Management System (IMS) designed to digitize and centralize all stock-related operations across a business. It replaces manual registers, spreadsheets, and disconnected tracking tools with a single, real-time platform that gives inventory and warehouse teams a live, auditable view of stock across locations.

The platform is built around **five operational pillars**: incoming stock (Receipts), outgoing stock (Delivery Orders), internal stock movement (Internal Transfers), stock reconciliation (Stock Adjustments), and a consolidated reporting layer (Dashboard and Move History). Every transaction — regardless of type — is logged to a single stock ledger, ensuring full traceability of "who moved what, from where, to where, and when."

### 1.1 Business Objective

- Eliminate manual, error-prone stock tracking (registers / Excel) with a centralized system of record.
- Provide real-time visibility into stock levels, pending operations, and exceptions (late or waiting operations).
- Standardize the receiving, dispatch, internal-movement, and reconciliation workflows across warehouses.
- Support multi-warehouse and multi-location operations with a consistent document-numbering scheme.
- Give managers and staff a single dashboard to monitor daily operational health.

### 1.2 Target Users

| Role | Responsibilities |
|---|---|
| **Inventory Manager** | Owns end-to-end stock accuracy; manages incoming and outgoing stock, reviews dashboard KPIs, approves adjustments, and configures warehouses/locations. |
| **Warehouse Staff** | Executes day-to-day operational tasks — receiving, picking, packing, shelving, internal transfers, and physical stock counts. |

---

## 2. Scope

### 2.1 In Scope

- User authentication (sign up, login, OTP-based password reset).
- Inventory Dashboard with KPIs and dynamic filters.
- Product master management (create/update, categories, unit of measure, stock availability).
- Stock overview screen (on-hand / free-to-use quantities, editable, SKU search).
- Operations: **Receipts**, **Delivery Orders**, **Internal Transfers**, **Stock Adjustments**.
- Move History (consolidated ledger of all stock movements).
- Settings: Warehouse master and Location master.
- Profile menu (My Profile, Logout).

### 2.2 Out of Scope (Phase 1)

- Purchase order / sales order management (assumed to originate the Receipt / Delivery Order trigger, but not modeled in this release).
- Barcode / RFID scanning hardware integration.
- Third-party accounting or ERP integration.
- Advanced demand forecasting or automated reordering execution (reordering rules are captured as product metadata only).

---

## 3. System Modules & Navigation

**Navigation pattern: left sidebar**, with a slim persistent top strip for global search, notifications, and the profile menu. This replaces the top-nav-bar layout shown in the earlier wireframes so the app can accommodate the full Operations sub-menu (four items) without crowding a horizontal bar.

```
┌────────────────────────────────────────────────────────────┐
│ 🍋 Lemon                          Search      🔔      👤    │
├───────────────┬──────────────────────────────────────────--┤
│ Dashboard     │                                             │
│ Products      │                                             │
│ Stock         │                                             │
│ Operations    │                  Content                    │
│   Receipts    │                                             │
│   Delivery    │                                             │
│    Orders     │                                             │
│   Internal    │                                             │
│    Transfers  │                                             │
│   Adjustments │                                             │
│ Move History  │                                             │
│ Settings      │                                             │
│   Warehouse   │                                             │
│   Locations   │                                             │
└───────────────┴─────────────────────────────────────────────┘
```

| Sidebar Item | Contains |
|---|---|
| **Dashboard** | Landing page with operational KPIs and quick statistics. |
| **Products** | Product master: create/update products, categories, UoM, reordering rules. |
| **Stock** | Stock overview: on-hand / free-to-use quantities per product, SKU search, manual stock edits. Separated from Products because its behavior (live quantities, inline editing) is functionally distinct from product master data. |
| **Operations** | Sub-menu: 1. Receipts  2. Delivery Orders  3. Internal Transfers  4. Adjustments |
| **Move History** | Consolidated read-only ledger of every stock movement (in and out) across locations. |
| **Settings** | Sub-menu: 1. Warehouse  2. Locations |
| **Top strip (global, all pages)** | Search, notifications bell, profile menu (My Profile, Logout) |

> **Design reference:** field lists, status definitions, and business rules below are consolidated from annotations captured directly on the Excalidraw wireframes, cross-checked against the written problem statement. The sidebar layout above supersedes the top-nav-bar wireframes to keep all four Operations sub-items visible and reachable in one click, per design review.

---

## 4. Functional Requirements – Authentication

The authentication module governs account creation, sign-in, and password recovery. On successful login, the user is redirected to the Inventory Dashboard.

### 4.1 Login Page

- Fields: Login ID, Password.
- Primary action: "SIGN IN" button.
- Secondary links: "Forget Password?" and "Sign Up."
- App logo displayed above both the Login and Sign Up panels.

### 4.2 Sign Up Page

- Fields: Login ID, Email ID, Password, Re-enter Password.
- Primary action: "SIGN UP" button.

### 4.3 Validation Rules

| Rule | Detail |
|---|---|
| Login credential match | On sign-in, credentials are validated against the stored user record. |
| Invalid credential handling | If credentials do not match, display the error: "Invalid Login Id or Password." |
| Navigation – Sign Up | Clicking "Sign Up" from the login page navigates to the Sign Up page. |
| Navigation – Forgot Password | Clicking "Forget Password?" navigates to the OTP-based Forgot Password flow. |
| Login ID uniqueness | Must be unique across the system and between 6–12 characters long. |
| Email uniqueness | Email ID must not already exist in the database. |
| Password strength | Must be unique, contain at least one lowercase letter, one uppercase letter, one special character, and be a minimum of 8 characters long. |
| Password confirmation | "Re-Enter Password" must match "Enter Password" before submission is allowed. |

> Password reset itself is OTP-based per the problem statement; the wireframe covers Login and Sign Up only — the OTP screen should follow the same visual language during implementation.

---

## 5. Functional Requirements – Dashboard

The Dashboard is the landing page after login and gives a real-time operational snapshot, organized as summary cards per operation type plus system-wide KPIs and filters.

### 5.1 Dashboard KPIs

- Total Products in Stock
- Low Stock / Out of Stock Items
- Pending Receipts
- Pending Delivery Orders
- Internal Transfers Scheduled

### 5.2 Operation Summary Cards

Each operation type is rendered as a card showing a live count broken down by exception state, e.g. "4 to receive," "1 Late," "6 operations" for Receipts, and "1 Late, 2 waiting, 6 operations" for Delivery Orders. Receipts and Delivery Orders are the two cards confirmed in wireframes; Internal Transfers and Adjustments should follow the same card pattern once wireframed.

| State | Definition |
|---|---|
| **Late** | Schedule date is earlier than today's date. |
| **Operations** | Schedule date is later than today's date (upcoming / scheduled work). |
| **Waiting** | Operation is waiting for the required stock to become available. |

### 5.3 Dynamic Filters

- By document type: Receipts / Delivery Orders / Internal Transfers / Adjustments
- By status: Draft, Waiting, Ready, Done, Canceled
- By warehouse or location
- By product category

---

## 6. Functional Requirements – Products & Stock

### 6.1 Product Management

Products are the master data referenced by every operation (Receipt, Delivery Order, Internal Transfer, Adjustment). Each product record includes:

- Name
- SKU / Code
- Category
- Unit of Measure
- Initial stock (optional, at creation time)
- Reordering rules (metadata used to trigger low-stock alerts)

### 6.2 Stock Screen

Accessible as its own sidebar item (not nested under Products). Lists every product with its cost and quantity position, and supports search by SKU. Quantities update automatically whenever a Receipt, Delivery Order, Internal Transfer, or Adjustment is validated.

| Product | Per Unit Cost | On Hand | Free to Use |
|---|---|---|---|
| Desk | ₹ 3,000 | 50 | 45 |
| Table | ₹ 3,000 | 50 | 50 |

- "On Hand" reflects total physical quantity at the location; "Free to Use" reflects quantity not already reserved against an open Delivery Order.
- Users must be able to update stock directly from this screen (manual correction, distinct from a formal Adjustment document).
- A search control (magnifying-glass icon) allows quick SKU / product lookup.

---

## 7. Functional Requirements – Operations

All operations (Receipts, Delivery Orders, Internal Transfers, Stock Adjustments) share a common list/kanban pattern and a common document-form pattern, described once here and then specialized per operation type below.

### 7.1 Common List View Behavior

- Default landing view for every operation is the List View.
- A search control allows the user to search by document Reference and by Contact.
- A view-toggle allows switching between List View and Kanban View, with kanban columns grouped by Status.
- A "NEW" button creates a new document of that operation type.

### 7.2 Receipts (Incoming Stock)

Used when items arrive from a vendor into a warehouse location.

**7.2.1 Process**
- Create a new Receipt.
- Add supplier (contact) and products.
- Input quantities received.
- Validate → stock increases automatically.

**7.2.2 List View Fields**

| Reference | From | To | Contact | Schedule Date / Status |
|---|---|---|---|---|
| WH/IN/0001 | vendor | WH/Stock1 | Azure Interior | Ready |
| WH/IN/0002 | vendor | WH/Stock1 | Azure Interior | Ready |

**7.2.3 Form View Fields**
- Header: document reference (e.g., WH/IN/0001)
- Receive From (vendor / contact)
- Schedule Date
- Responsible — auto-filled with the currently logged-in user
- Products table: Product, Quantity, with an "Add New Product" row

**7.2.4 Status Workflow**

| Status | Meaning |
|---|---|
| **Draft** | Initial stage when the Receipt is first created. |
| **Ready** | Ready to receive; reached when the user clicks the "TO DO" action. |
| **Done** | Stock has been received; reached when the user clicks "Validate." Stock increases automatically at this point. |

- Button behavior: "TO DO" (shown while in Draft) moves the document to Ready; "Validate" (shown while in Ready) moves it to Done.
- Once a Receipt reaches Done, the "Print" action becomes available to print the receipt.

### 7.3 Delivery Orders (Outgoing Stock)

Used when stock leaves the warehouse for a customer shipment.

**7.3.1 Process**
- Pick items.
- Pack items.
- Validate → stock decreases automatically.

**7.3.2 List View Fields**

| Reference | From | To | Contact | Schedule Date / Status |
|---|---|---|---|---|
| WH/OUT/0001 | WH/Stock1 | vendor | Azure Interior | Ready |
| WH/OUT/0002 | WH/Stock1 | vendor | Azure Interior | Ready |

**7.3.3 Form View Fields**
- Header: document reference (e.g., WH/OUT/0001)
- Delivery Address
- Responsible
- Schedule Date
- Operation Type (dropdown)
- Products table: Product, Quantity, with an "Add New Product" row

**7.3.4 Status Workflow**

| Status | Meaning |
|---|---|
| **Draft** | Initial state when the Delivery Order is created. |
| **Waiting** | Waiting for an out-of-stock product to become available. |
| **Ready** | Ready to deliver. |
| **Done** | Delivered; stock decreases automatically. |

**7.3.5 Exception Handling**
- If a line-item product is not in stock, the application must trigger a notification alert and visually mark that line red so staff can immediately identify the shortfall.

### 7.4 Internal Transfers

Moves stock between locations inside the company (e.g., Main Warehouse → Production Floor, Rack A → Rack B, Warehouse 1 → Warehouse 2). Every movement is written to the Move History ledger.

**7.4.1 Process**
- Select source warehouse/location and destination warehouse/location.
- Add products and the quantity to move.
- Validate → total stock is unchanged, but each product's location is updated.

**7.4.2 List View Fields**

| Reference | Source Location | Destination Location | Responsible | Schedule Date / Status |
|---|---|---|---|---|
| WH/INT/0001 | WH/Rack-A | WH/Rack-B | Karthik | Ready |

**7.4.3 Form View Fields**

```
Internal Transfer — WH/INT/0001

Source Warehouse:        Destination Warehouse:
Source Location:         Destination Location:
Responsible:              Schedule Date:

Products
--------------------------------------------
Product          Available     Qty
Steel Rod           100         30
Chair                 50         10
--------------------------------------------
[ Save Draft ]        [ Validate ]
```

- Reference (auto-generated, see [Section 8](#8-document-reference-numbering-convention))
- Source Warehouse / Source Location
- Destination Warehouse / Destination Location
- Responsible
- Schedule Date
- Products table: Product, Available (read-only, current free-to-use quantity at source), Quantity to transfer

**7.4.4 Status Workflow**

| Status | Meaning |
|---|---|
| **Draft** | Initial state when the transfer is created. |
| **Ready** | Source and destination confirmed; ready to move stock. |
| **Done** | Transfer validated; stock relocated and logged to Move History. |

### 7.5 Stock Adjustments

Used to reconcile mismatches between recorded stock and the physical count.

**7.5.1 Process**
- Select product, warehouse, and location.
- Enter the counted (physical) quantity.
- System calculates the difference against the recorded (system) quantity.
- Validate → stock is corrected and the adjustment is logged to the Move History ledger.

**7.5.2 Form View Fields**

```
Stock Adjustment — WH/ADJ/0001

Product:                  Warehouse:
Location:

System Quantity:    100
Physical Quantity:   97
Difference:           -3

Reason: [ Damaged | Lost | Miscount | Other ]

[ Save Draft ]        [ Validate Adjustment ]
```

- Product / Warehouse / Location
- System Quantity (read-only, pulled from current stock record)
- Physical Quantity (entered by user during the count)
- Difference (auto-calculated: Physical − System)
- Reason (selectable: Damaged, Lost, Miscount, Other — free text optional for "Other")

**7.5.3 Status Workflow**

| Status | Meaning |
|---|---|
| **Draft** | Initial state when the count is being entered. |
| **Done** | Adjustment validated; stock corrected and logged. |

> No dedicated wireframe was provided for Stock Adjustments in the current mockup set; the fields above are proposed by analogy to the Receipt/Delivery Order pattern and should be confirmed with design before build.

### 7.6 Move History

A consolidated, read-only ledger of every stock movement — Receipts, Delivery Orders, Internal Transfers, and Adjustments alike.

**7.6.1 List View**

| Reference | Date | Contact | From | To | Quantity | Status |
|---|---|---|---|---|---|---|
| 🟢 WH/IN/0001 | 12/1/2001 | Azure Interior | vendor | WH/Stock1 | — | Ready |
| 🔴 WH/OUT/0002 | 12/1/2001 | Azure Interior | WH/Stock1 | vendor | — | Ready |
| 🔴 WH/OUT/0002 | 12/1/2001 | Azure Interior | WH/Stock2 | vendor | — | Ready |

**7.6.2 Business Rules**
- The screen populates every recorded move between a From and To location within the inventory.
- If a single reference (document) contains multiple products, each product is displayed as its own row.
- Incoming moves (Receipts, and the receiving side of Internal Transfers) are displayed in **green**; outgoing moves (Delivery Orders, and the sending side of Internal Transfers) are displayed in **red**.
- Search by reference/contact and a List ↔ Kanban (grouped by status) toggle are available, consistent with other operation screens.

---

## 8. Document Reference Numbering Convention

All operational documents follow a single, predictable reference pattern so that any document can be traced back to its warehouse and operation type at a glance:

```
<Warehouse> / <Operation> / <ID>
```

| Segment | Definition |
|---|---|
| **Warehouse** | ID of the warehouse where the operation occurs (e.g., WH). |
| **Operation** | IN (Receipts) · OUT (Delivery Orders) · INT (Internal Transfers) · ADJ (Adjustments) |
| **ID** | Auto-incremented unique identifier, e.g., 0001, 0002 … |

- `WH/IN/0001` — first Receipt at warehouse "WH."
- `WH/OUT/0002` — second Delivery Order at warehouse "WH."
- `WH/INT/0001` — first Internal Transfer at warehouse "WH."
- `WH/ADJ/0001` — first Stock Adjustment at warehouse "WH."
- The reference must auto-increment per warehouse/operation combination and can never be reused.

---

## 9. Functional Requirements – Settings

### 9.1 Warehouse Master

Holds the top-level warehouse details.

- Name
- Short Code
- Address

### 9.2 Location Master

Holds the multiple locations (rooms, racks, stock areas, etc.) that exist within a warehouse.

- Name
- Short Code
- Warehouse — linked to the parent Warehouse record (e.g., "WH")

> A warehouse can have many locations; a location always belongs to exactly one warehouse. Location codes feed the "Source / Destination" and "From / To" fields shown across Receipts, Delivery Orders, Internal Transfers, and Move History.

---

## 10. Non-Functional Requirements

| Category | Requirement |
|---|---|
| Real-time accuracy | Stock quantities (On Hand / Free to Use) must reflect validated transactions immediately, with no manual refresh required. |
| Multi-warehouse support | The data model and every operation screen must support multiple warehouses and multiple locations per warehouse. |
| Auditability | Every stock movement (Receipt, Delivery Order, Internal Transfer, Adjustment) must be permanently logged to the Move History ledger; no destructive edits to historical records. |
| Search & filtering | Reference-, contact-, and SKU-based search must return results without a full page reload, on all list screens. |
| Alerting | Low-stock / out-of-stock conditions must trigger a visible alert (e.g., red line highlighting) at the point of data entry, not only on the dashboard. |
| Access control | Only authenticated users may access any screen beyond Login / Sign Up / Forgot Password. |
| Usability | List and Kanban views must be available and interchangeable on every operation screen for user preference. |
| Data integrity | Password and Login ID uniqueness/strength rules must be enforced server-side, not only in the UI. |

---

## 11. Assumptions & Open Items

- Receipts and Delivery Orders are assumed to be created manually in this release; upstream Purchase Order / Sales Order integration is out of scope for Phase 1.
- The "Operation Type" dropdown on the Delivery Order form is assumed to classify delivery sub-types (e.g., standard shipment, return) — exact values to be confirmed with stakeholders.
- Cancelled status is referenced in the Dashboard filter list but has no dedicated workflow diagram in the wireframes; it is assumed available from Draft, Waiting, or Ready.
- Internal Transfer and Stock Adjustment screens are not yet wireframed; the field specifications in Sections 7.4–7.5 are proposed by analogy to Receipts/Delivery Orders and need design sign-off.
- OTP delivery channel (SMS vs. email) for password reset is not specified in the source document and should be confirmed.
- **Naming and navigation pattern (Lemon / sidebar) were adopted from reviewer feedback without an explicit prior decision on record in this project's documentation history — confirm before this becomes the system of record.**

---

## Appendix A – End-to-End Inventory Flow Example

The following simplified walkthrough illustrates how a single unit of stock moves through the system, and how each module updates the ledger.

| Step | Action | System Effect | Stock Δ |
|---|---|---|---|
| 1 | Receive 100 kg Steel from vendor | Receipt validated → stock increases | +100 |
| 2 | Internal transfer: Main Store → Production Rack | Total stock unchanged; location updated | 0 |
| 3 | Deliver 20 kg (finished goods) | Delivery Order validated → stock decreases | −20 |
| 4 | Adjust for 3 kg damaged steel | Adjustment validated → stock corrected | −3 |

Net result: 100 − 20 − 3 = **77 kg** of steel remains on hand, fully traceable through four ledger entries in Move History.

---

## Appendix B – Reference Material

- Source requirement document: StockSense (Lemon) – Problem Statement (PDF).
- Wireframes: Excalidraw board – https://link.excalidraw.com/l/65VNwvy7c4X/3ENvQFu9o8R
- This specification consolidates and formalizes annotations captured directly on the wireframes (field lists, status definitions, and business rules) alongside the written problem statement and the v1.0 design review feedback.

---

## Appendix C – Change Log

| Version | Date | Change |
|---|---|---|
| 1.0 | 26 Sep 2026 | Initial FDS drafted from problem statement + wireframes (product named StockSense, top nav bar). |
| 1.1 | 26 Sep 2026 | Applied design review feedback: renamed product to Lemon (formerly StockSense); switched to left-sidebar navigation; added Internal Transfers as a full operation with list/form/status spec; added Stock as its own sidebar item; added detailed Stock Adjustment form spec; standardized terminology to "Delivery Orders" and "Internal Transfers"; extended numbering convention to cover INT and ADJ prefixes. |
