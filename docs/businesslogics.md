Here's the full business logic, broken down by feature area:

## 1. Authentication & Registration

- When a dealer signs up, two things happen atomically: a new `Dealer` record is created, AND a `User` record with role `ADMIN` is created and linked to that dealer. This is the only way a new tenant gets created — there's no separate "create dealer" endpoint after signup.
- Login requires phone (or email) + password + implicitly resolves which dealer the user belongs to (since phone is unique per dealer, not globally unique).
- On successful login, issue a JWT containing `userId`, `dealerId`, and `role`. Every subsequent request uses this token to resolve tenant context — the `dealerId` in the token is the source of truth, never trust a `dealerId` passed in the request body/params.
- Passwords are hashed (bcrypt/argon2) — never stored in plain text.
- Farmers log in the same way, but their JWT role is `FARMER`, which restricts route access entirely to their own data.

## 2. Multi-Tenancy Enforcement (applies to everything below)

- Every single query for tenant-scoped resources (farmers, items, transactions, users) must be filtered by `dealerId` extracted from the JWT — not from the request. This should ideally be enforced in a middleware/service layer so no individual route can "forget" it.
- Cross-tenant access attempts (e.g., Manager from Dealer A tries to fetch a farmer belonging to Dealer B by guessing an ID) must return 404, not 403 — don't leak the existence of another tenant's data.

## 3. Role-Based Permissions

- **Admin**: full CRUD on users, farmers, items, transactions within their own dealer. Can create/deactivate Manager accounts.
- **Manager**: can create/edit farmers, items, transactions. Cannot manage other users (no creating/deleting Admin or Manager accounts). Cannot delete transactions outright — see edit/delete rules below.
- **Farmer**: read-only access, and only to their own farmer profile + their own transaction list. Every farmer-facing endpoint must resolve "which farmer am I" from the JWT's linked farmer profile, not from a farmer ID passed in the URL.

## 4. Farmer Management

- Creating a farmer does NOT require a login account — Admin/Manager can create a bare profile (name, phone, address) with `currentBalance = 0`.
- A farmer can optionally be "invited" later — this generates login credentials and links `userId` to the farmer profile. Until invited, `userId` stays null and the farmer has no platform access.
- Deleting a farmer is a **soft delete** (`status = false`), never a hard delete, because historical transactions reference them. Hard-deleting would break the ledger's integrity.
- A farmer with a non-zero balance should trigger a warning (not necessarily a hard block) if someone tries to deactivate them — "this farmer still has outstanding dues of X, are you sure?"

## 5. Item Management

- Items are scoped per dealer — each dealer builds their own product catalog (their own naming/categorization of feed brands, medicines, etc).
- Deleting an item is also a soft delete for the same reason as farmers (historical transaction_items reference it).
- `unitPrice` on the item is a *default* — the actual price used gets captured per transaction line (see below), so historical transactions aren't affected if the dealer changes prices later.

## 6. Transaction Creation — the core logic

This is the most important piece, mirroring the "receipt → ledger" flow:

1. A transaction is created with a `type`: `PURCHASE` (farmer received goods) or `PAYMENT` (farmer paid money).
2. If `PURCHASE`: it includes one or more transaction items (item + quantity). For each line, `subtotal = quantity × unitPrice` (unitPrice captured at time of transaction, not looked up live from the item later). The transaction's total `amount` = sum of all line subtotals.
3. If `PAYMENT`: no items needed, just a direct `amount` (money received) and optionally a `paymentMethod`.
4. **Balance impact**: `PURCHASE` increases the farmer's `currentBalance` (they now owe more). `PAYMENT` decreases it (they owe less). This must happen inside a single DB transaction (atomic) along with the record creation — creating a `Transaction` row and updating `Farmer.currentBalance` must succeed or fail together, never partially.
5. The `createdBy` field always records which user (Manager/Admin) entered it — this is your accountability trail, replicating "which manager wrote this in the book."

## 7. Editing / Deleting a Transaction

- Editing a transaction (e.g., correcting a wrong quantity) must **reverse** the old balance impact and **reapply** the new one — not just overwrite blindly. E.g., if a purchase amount changes from 500 to 700, the farmer's balance increases by the +200 delta, not recalculated from scratch (unless you choose to always recompute balance by full resum, which is safer but more expensive).
- Every edit should write an `AuditLog` entry capturing old value vs new value, who changed it, and when — this replaces the "you can see the crossed-out old number in the khata" transparency of the paper system.
- Deletion should generally be **restricted** or require Admin-level approval — a Manager shouldn't be able to freely delete transactions, since that erases financial history. Consider either: (a) disallow hard delete entirely, only allow a "void/reversal" entry, or (b) allow delete only within a short time window (e.g., same day) and only by the creator or an Admin.
- Deleting must also reverse the balance impact, same as editing.

## 8. Farmer Ledger View

- This is a **derived/read view**, not a stored table — it's just "all transactions for farmer X, ordered by date," with a running balance calculated by walking through the list chronologically (or simply showing each transaction's amount alongside the farmer's current cached balance for the summary).
- Support filtering by date range, since farmers/managers will often want "this month's activity" rather than full history.

## 9. Dashboard & Reports (Admin-facing)

- **Summary dashboard**: total outstanding dues = sum of `currentBalance` across all active farmers for that dealer; today's transaction count/value; count of active farmers.
- **Daily report**: essentially a digital version of the old receipt book — all transactions entered on a given day, across all farmers, listable/printable.
- **Farmers-by-due report**: sorted by `currentBalance` descending — helps the dealer prioritize who to follow up with for collection.

## 10. Data Integrity Rules (cross-cutting)

- Never allow negative quantities.
- Amount fields should never allow negative values directly — direction (increase/decrease of balance) is controlled by `type` (`PURCHASE` vs `PAYMENT`), not by sign of the amount. This avoids confusing double-negative bugs.
- All monetary calculations happen server-side — never trust a `subtotal` or `amount` sent from the frontend without recalculating and validating it against `quantity × unitPrice`.
- Every write operation (create/update/delete on Farmer, Item, Transaction) should generate an audit log entry — this is your core trust feature, since you're replacing a paper trail that dealers currently rely on for disputes.
