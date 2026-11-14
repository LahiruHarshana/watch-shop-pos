# POS MVP completion report

Date: 28 October 2026

The existing Next.js and MongoDB POS was kept. Financial totals and stock changes stay on the server. This report records what was finished, what was actually tested, and what is still not proven on shop hardware.

## 1. Completed fixes

1. **Daily report timezone.** A calendar date is an Asia/Colombo day. `2026-10-28` runs from `2026-10-27T18:30:00.000Z` through `2026-10-28T18:29:59.999Z`. Retail sales, repair payments, payment mixes, voids, and the dashboard “today” and 7-day chart use the same helper.
2. **Cash drawer.** Expected cash is opening float + completed retail cash + cash repair payments inside the shift window − voided retail cash in that window. Card and bank transfer are ignored. Repair cash is matched on `payment.paidAt` because repair tickets do not store a shift id. The shift bar and shift close both call `calculateExpectedCashCents`.
3. **Inventory ledger.** Product edit no longer accepts `quantity`. The edit form shows stock as read-only and points staff to Stock adjustments. Creating a product with opening quantity writes the product and an “Opening stock” adjustment in one transaction. Negative opening quantity is rejected.
4. **Delivered repairs.** The active board is Pending, In Progress, and Ready for Collection. Delivered jobs are a separate latest-12 list, and search can include them. The board query still excludes delivered tickets.
5. **Checkout search.** `/checkout?q=` fills the product search. Typing in checkout does not rewrite the URL, so the router does not loop. Category filters still apply with that search.

## 2. Completed missing features

6. **Sales history** at `/sales`. Search covers invoice number, SKU, item name, and cashier name. Filters cover Colombo date, payment method, and completed/voided. Each row opens the existing receipt page for print, share, PDF, and admin void.
7. **Repair search and history.** Search covers ticket id, customer, phone, brand, and model, with status and created-date filters. The board stays on active tickets.
8. **Repair intake edit.** Customer, phone, brand, model, issue, and estimate can be corrected. A cashier can edit before delivery. A delivered ticket can be edited by an admin. The save adds a status-history note and does not rewrite `payment`.
9. **Category management** at `/inventory/categories` (admin only). List, create, rename, parent, and activate/deactivate. A category cannot be its own ancestor. There is no delete action, so products cannot lose a category by accident.
10. **Daily report export.** CSV and PDF use `buildDailyReport`, the same function as the screen. They include retail, repair, total, discounts, cash, card, bank transfer, counts, voids, and drawer variance when a shift closed that day.
11. **Digital receipt sharing.** The receipt page can download the existing PDF, share that file through the browser Web Share API when the browser allows files, or copy the receipt page link. Nothing is uploaded to a public host.
12. **Receipt and claim-token layout.** Both follow the shop paper width (58mm or 80mm), wrap long text, and include the shop identity, line detail, payment, tendered, change, and thank-you text on receipts. Claim tokens include contact, ticket, customer, phone, brand, model, issue, estimate, terms, and received time when those values exist.
13. **Printer UX.** Browser print remains the method. The page explains margins and headers, keeps a reprint button, and cancelling the dialog does not change the sale. No USB/ESC-POS driver was added.
14. **Local deployment.** Documented as a shop PC running Next.js, with browsers on the same LAN. See `docs/SHOP-PC-DEPLOYMENT.md`. Electron was not added.
15. **Security.** `/api/health` returns only `{ data: { status: "ok" } }` or a generic database failure. The seed script refuses to run when `NODE_ENV=production` unless `ALLOW_DEMO_SEED=true`. The deployment doc requires password rotation and does not repeat demonstration passwords.

## 3. Files changed

Modified:

- `README.md`
- `app/(pos)/checkout/page.tsx`
- `app/(pos)/dashboard/page.tsx`
- `app/(pos)/inventory/products/[id]/page.tsx`
- `app/(pos)/reports/daily/page.tsx`
- `app/api/categories/route.ts`
- `app/api/health/route.ts`
- `app/api/products/[id]/route.ts`
- `app/api/products/route.ts`
- `app/api/repairs/[id]/route.ts`
- `app/api/repairs/route.ts`
- `app/api/reports/daily/route.ts`
- `app/api/sales/route.ts`
- `components/pos/checkout-client.tsx`
- `components/pos/claim-token-view.tsx`
- `components/pos/daily-report.tsx`
- `components/pos/pos-shell.tsx`
- `components/pos/product-detail-client.tsx`
- `components/pos/product-form.tsx`
- `components/pos/receipt-view.tsx`
- `components/pos/repair-detail.tsx`
- `components/pos/repairs-board.tsx`
- `components/pos/shift-bar.tsx`
- `components/pos/stock-adjustments-form.tsx`
- `components/pos/users-admin.tsx`
- `lib/rbac/permissions.ts`
- `lib/shifts/cash.ts`
- `package.json`
- `scripts/seed.ts`

Created:

- `app/(pos)/inventory/categories/page.tsx`
- `app/(pos)/sales/page.tsx`
- `app/api/categories/[id]/route.ts`
- `app/api/reports/daily/export.csv/route.ts`
- `app/api/reports/daily/export.pdf/route.tsx`
- `components/pos/categories-admin.tsx`
- `components/pos/sales-history.tsx`
- `docs/SHOP-PC-DEPLOYMENT.md`
- `lib/reports/daily-summary.ts`
- `lib/shifts/expected-cash.ts`
- `lib/shifts/expected-cash.test.ts`
- `lib/time/business-day.ts`
- `lib/time/business-day.test.ts`
- `POS_MVP_COMPLETION_REPORT.md`

## 4. APIs changed

| Endpoint | Behavior |
| --- | --- |
| `GET /api/reports/daily` | Colombo day via `buildDailyReport`. Invalid date returns 400. |
| `GET /api/reports/daily/export.csv` | Admin CSV of that same report. |
| `GET /api/reports/daily/export.pdf` | Admin PDF of that same report. |
| `GET /api/sales` | Filters: `q`, `date` (Colombo), `method`, `status`, plus existing pagination. |
| `GET /api/repairs` | `board=true` excludes delivered. Otherwise `q`, `status`, `from`, `to`, and pagination. |
| `PATCH /api/repairs/[id]` | Intake fields for a cashier before delivery, and for an admin after delivery. Payment is unchanged. |
| `PATCH /api/products/[id]` | `quantity` is ignored. |
| `POST /api/products` | Opening quantity and its stock-adjustment row are one transaction. |
| `GET /api/categories?all=true` | Admin receives inactive categories too. |
| `PATCH /api/categories/[id]` | Admin rename, parent, sort, and active flag. Parent cycles are rejected. |
| `GET /api/health` | `{ data: { status: "ok" } }` only. |
| `GET /api/shifts` and close | Expected cash includes repair cash in the shift window. |

## 5. Database changes

No collection or index migration. Existing fields are used:

- Sale and repair timestamps are interpreted in Asia/Colombo at query time.
- A new product with stock greater than zero inserts one `StockAdjustment` (`reason: purchase`, note `Opening stock`) in the same transaction as the product.
- A repair intake edit appends `statusHistory` with the note “Intake details updated” and updates `updatedAt`. It does not change `payment`.

MongoDB transactions are still required for sales, voids, stock adjustments, and opening stock. Do not switch the database to a standalone `mongod`.

## 6. Test results

Commands, all from the project directory:

| Command | Result |
| --- | --- |
| `npm test` | 13 passed, 0 failed. Includes Colombo 00:30 and 23:30, UTC midnight conversion, retail cash, repair cash, combined cash, card repair ignored, voided retail cash, and several transactions in one shift. |
| `npx tsc --noEmit` | Passed (also rechecked inside `npm run build`). |
| `npm run lint` | Passed. 0 errors. 4 existing warnings in settings, users, mongoose, and seed. |
| `npm run build` | Passed. Next.js 16.4.3. Middleware-to-proxy is a warning only. |

Browser checks against the running dev server, signed in as the local admin:

- Sales history lists seed invoices. Searching `INV-SEED-0001` returns that one invoice. Opening it shows print, share, PDF, void, unit price, shop name, address, and phone.
- `/checkout?q=BAT-CR2032` loads that SKU. The Batteries category filter still shows it.
- Repairs board shows Pending, In Progress, and Ready only. `R-SEED-0004` appears under Recently delivered. Searching “Dilani” returns that delivered ticket.
- Categories page lists the seeded categories, including Men’s Watches.
- Product edit shows quantity read-only. `PATCH` with `quantity: 1` left the stored quantity at 4.
- `GET /api/reports/daily?date=2026-10-20` returned Asia/Colombo totals for that seed day (retail LKR 900.00, 1 sale). CSV export for 2026-10-28 returned 200 and the same column set.
- The open shift bar showed expected cash after the page finished loading.

Cashier session, checked with the credentials API (no shop data was created):

| Request | Result |
| --- | --- |
| `GET /api/reports/daily` | 403 |
| `GET /api/users` | 403 |
| `POST /api/products` | 403 |
| `POST /api/stock-adjustments` | 403 |
| `POST /api/categories` | 403 |
| `PATCH /api/settings` | 403 |
| `POST /api/sales/[id]/void` | 403 |
| `/users`, `/inventory/categories`, `/reports/daily`, `/settings`, `/inventory/adjustments` | 307 to `/dashboard` |
| `GET /api/settings` | 200 for any signed-in user, so a cashier receipt can still show the shop name |
| `GET /api/health` | `{ "data": { "status": "ok" } }` |

Not executed, because they would change the live shop database or need hardware:

- A new cash sale, stock deduction, change calculation, void, and stock restoration.
- A new repair taken through Pending → In Progress → Ready → Delivered with a cash payment, then checked on the drawer and daily report.
- Inserting sales at 00:30 and 23:30 Colombo and reading them back from MongoDB. The boundary math is covered by unit tests only.
- `rs.status()` on the shop MongoDB.
- A physical 58mm or 80mm print.

## 7. Printer verification

Verified in the browser, not on a printer: the receipt and claim token use the width saved in Settings, keep text inside that width, and the print dialog can be cancelled without another action.

Not verified: clipping, logo darkness, and cut length on a real 58mm or 80mm thermal printer. Set the browser margins to None and turn headers and footers off before the first shop print.

## 8. Deployment instructions

Exact procedure and commands are in `docs/SHOP-PC-DEPLOYMENT.md`. They were written for the shop PC and were not run on a Windows machine in this session.

Verified here:

```bash
npm test
npx tsc --noEmit
npm run lint
npm run build
```

Local development was already running with `npm run dev`. Production start, replica-set initialization, Task Scheduler, backup, and restore were not executed on a shop PC.

## 9. Remaining gaps

- The full retail and repair acceptance scripts were not run against the database.
- Thermal output is not proven on hardware.
- The shop PC replica set, reboot startup, backup, and restore have not been executed from this session.
- Demonstration accounts still exist in this database. Rotate or disable them before real customers are served. The README lists them only as development seed values.
- `taxEnabled` is stored and is not applied to sale totals.
- The header bell does not open notifications.
- The shop still has one open shift at a time.
- Invoice and ticket numbers are generated outside the sale transaction.
- `GET /api/settings` is available to cashiers so receipts can render. Cashiers cannot change settings.

Phase 2 items (CRM, suppliers, purchase orders, warranty, accounting, loyalty, multi-branch, payment gateway, barcode hardware, and a mobile app) were not added.

## 10. Final readiness

| Area | Status | Why |
| --- | --- | --- |
| Functional readiness | Not ready | Sales history, checkout search, repair history, categories, exports, and receipt actions work in the browser. A new sale, void, stock restore, and paid repair were not completed. |
| Data integrity | Not ready | Timezone and drawer math passed unit tests, and a direct quantity edit was ignored. The opening-stock transaction and a live void were not run. |
| Security | Not ready | Cashier blocks above were confirmed. Demonstration passwords are still valid on this database. |
| Printer readiness | Not ready | Layout and browser print UX only. No thermal printer was used. |
| Local deployment readiness | Not ready | The LAN runbook is written. Replica set, reboot, backup, and restore were not executed here. |
| Production readiness | Not ready | The production build passes. The shop PC checks in section 9 are still open. |
