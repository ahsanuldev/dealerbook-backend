Here's the endpoint list, grouped by resource:

**Auth**
- `POST /api/auth/register` — dealer signup (creates dealer + admin user)
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`

**Dealers**
- `GET /api/dealers/:id` — get own dealer/business profile
- `PUT /api/dealers/:id` — update business info

**Users (admin/manager accounts)**
- `GET /api/users`
- `POST /api/users` — create manager account
- `GET /api/users/:id`
- `PUT /api/users/:id`
- `DELETE /api/users/:id`

**Farmers**
- `GET /api/farmers`
- `POST /api/farmers`
- `GET /api/farmers/:id`
- `PUT /api/farmers/:id`
- `DELETE /api/farmers/:id`
- `GET /api/farmers/:id/ledger` — farmer's transaction history + balance
- `POST /api/farmers/:id/invite` — generate login for existing farmer profile

**Items**
- `GET /api/items`
- `POST /api/items`
- `GET /api/items/:id`
- `PUT /api/items/:id`
- `DELETE /api/items/:id`

**Transactions**
- `GET /api/transactions`
- `POST /api/transactions`
- `GET /api/transactions/:id`
- `PUT /api/transactions/:id`
- `DELETE /api/transactions/:id`

**Dashboard / Reports**
- `GET /api/dashboard/summary` — total dues, today's activity
- `GET /api/reports/daily` — daily transaction report
- `GET /api/reports/farmers-due` — farmers sorted by outstanding balance

**Farmer self-service (role: FARMER)**
- `GET /api/me/ledger` — own transaction history + balance