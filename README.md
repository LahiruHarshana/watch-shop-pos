# Watch Shop POS

Next.js monolith POS for watch retail and repair (MVP Phase One).

## Setup

1. Copy `.env.local.example` to `.env.local` and fill credentials.
2. `npm install`
3. `npm run seed` — resets demo transactions and seeds users, catalog, repairs, sales, shifts, and stock adjustments (safe to re-run).
4. `npm run dev` — open [http://localhost:3000](http://localhost:3000)

### Default logins (after seed)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@shop.local | Admin@12345 |
| Cashier | cashier@shop.local | Cashier@12345 |
| Technician (cashier) | tech@shop.local | Tech@12345 |

After seeding you get 13 products across 6 categories, 5 repair tickets, 8 sample sales (7-day chart), one open shift, and low-stock sample (`BAT-CR2016`).

Change these passwords in production.

## LAN access (tablet / phone)

```bash
npm run dev -- -H 0.0.0.0
```

Visit `http://<your-pc-ip>:3000` on the same network.

## Docs

See [docs/MVP-PHASE-ONE-IMPLEMENTATION-GUIDE.md](docs/MVP-PHASE-ONE-IMPLEMENTATION-GUIDE.md).
