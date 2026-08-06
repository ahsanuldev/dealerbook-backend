# Project Idea: Poultry Dealer Ledger Management Platform (Multi-Tenant SaaS)

## 1. Problem

In Bangladesh, poultry feed/medicine/chick dealers currently track farmer (khamari) transactions using a fully manual, paper-based process:

1. When a farmer takes goods (feed, medicine, chicks), the shop manager logs it in a **Receipt Book** (daily transaction log).
2. The entry is later transferred into a **Main Ledger**, which has a **dedicated page per farmer** — essentially a running account/ledger.
3. Each farmer's page tracks date, item, quantity, and running balance.

This manual "journal → ledger" process is slow, error-prone, hard to search, and offers no reporting, backups, or visibility for the dealer owner.

## 2. Solution

A **multi-tenant SaaS platform** where any dealer can sign up, set up their own business/shop space, and digitize this exact workflow — receipt entry → auto-updated farmer ledger — without changing the mental model dealers already use.

Each dealer operates in their own isolated tenant space; other dealers' data is never visible to them.

## 3. User Roles

| Role | Scope | Permissions |
|---|---|---|
| **Admin** | Dealer owner | Full control within their tenant — manage managers, farmers, items, view all ledgers & reports |
| **Manager** | Dealer's staff | Add/edit daily transactions, view farmer ledgers |
| **Farmer** | Individual farmer | Login and view **only their own** transaction history/ledger (read-only) |

## 4. Core Workflow

1. Dealer signs up → creates their business/shop on the platform (tenant created).
2. Admin sets up managers and the item/product list (feed types, medicine, chicks).
3. Manager adds farmers and records daily transactions (purchases or payments).
4. Each transaction auto-updates that farmer's running balance/ledger.
5. Farmer can log in anytime to view their own balance and transaction history.
6. Admin gets dashboards/reports across all farmers.

## 5. Core Entities

- **Dealer** (tenant)
- **User** (admin / manager / farmer — login account)
- **Farmer** (profile, linked to a user account)
- **Item** (feed, medicine, chicks — per-dealer product list)
- **Transaction** (purchase or payment entry)
- **Transaction Items** (line items within a transaction — supports multiple products per entry)
- **Audit Log** (tracks edits for accountability)

## 6. Database Design Approach

- **Shared database, shared schema** — every tenant-scoped table has a `dealer_id` column (standard, cost-effective multi-tenancy for this scale)
- Tenant isolation enforced at the application layer (v1), with Postgres Row-Level Security as a future hardening step
- Balance is **derived** (sum of purchases minus payments), not manually stored/edited — optionally cached for performance later
- Key tables: `dealers`, `users`, `farmers`, `items`, `transactions`, `transaction_items`, `audit_log`
- Indexes on `dealer_id`, and composite `(dealer_id, farmer_id)` / `(dealer_id, date)` for common queries (farmer ledger view, daily reports)

## 7. Suggested Tech Stack

- **Frontend**: Next.js + TypeScript + Tailwind CSS
- **Backend**: ASP.NET Core Web API (or Node.js)
- **Database**: PostgreSQL (Neon)
- **Auth**: JWT-based, role-based access control (admin / manager / farmer)
- **Hosting**: Vercel (frontend) + Railway (backend)

## 8. MVP Feature Scope

- Dealer signup & tenant setup
- Admin/Manager/Farmer role-based login
- Farmer management (CRUD)
- Item/product master list
- Transaction entry (purchase/payment) with auto ledger update
- Farmer ledger view (per-farmer transaction history + running balance)
- Farmer self-login to view own ledger
- Admin dashboard (total dues, daily activity summary)
- Search/filter transactions by farmer, date, item

## 9. Design Decisions

- **Farmer-Dealer relationship**: A farmer is **strictly tied to one dealer**. If the same person buys from multiple dealers, they are treated as separate farmer records (separate accounts) per dealer — no many-to-many join table needed. `farmers` table has a direct `dealer_id` FK, and a 1:1 (optional) relationship to `users` for login.

```
dealers 1---* farmers
farmers 1---0/1 users (login account, role=farmer)
```

---

*This document consolidates the project concept, requirements, and initial database design discussed so far.*