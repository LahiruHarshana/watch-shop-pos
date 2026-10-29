# Shop PC deployment

Run the POS on the shop computer and open it from browsers on the same network. This is a local server deployment. It is not an offline desktop app, and it does not add a USB printer driver.

Sales, voids, and stock adjustments use MongoDB transactions. The database must be a replica set, including a single-node set on the shop PC. A standalone `mongod` will reject those writes.

## Requirements

- Windows 10/11 or the shop PC OS
- Node.js 20 LTS or newer (`node -v`)
- MongoDB 7 Community, started as a replica set
- Google Chrome or Microsoft Edge on the counter and tablets
- A thermal printer that the browser can print to (58mm or 80mm)

## 1. MongoDB replica set

Install MongoDB Community and create the data directory, for example `C:\data\db`.

Start one node as a replica set:

```bat
mongod --dbpath C:\data\db --replSet rs0 --bind_ip 127.0.0.1 --port 27017
```

In a second terminal, initialize it once:

```bat
mongosh --eval "rs.initiate({_id:'rs0',members:[{_id:0,host:'127.0.0.1:27017'}]})"
```

Confirm with `mongosh --eval "rs.status().ok"`. The result should be `1`.

Keep MongoDB bound to `127.0.0.1`. Other shop devices talk to Next.js, not directly to the database.

## 2. Application

```bat
cd C:\watch-shop-pos
copy .env.local.example .env.local
```

Set these in `.env.local`. Do not commit that file.

- `MONGODB_URI=mongodb://127.0.0.1:27017/watch-shop-pos?replicaSet=rs0`
- `AUTH_SECRET` from `openssl rand -base64 32` (or an equivalent 32-byte random value)
- `NEXTAUTH_URL` the URL staff type, such as `http://192.168.1.20:3000`
- Cloudinary keys only if the shop logo is uploaded through Cloudinary

Then:

```bat
npm install
npm run build
npm run start -- -H 0.0.0.0 -p 3000
```

Open `http://127.0.0.1:3000` on the shop PC. Tablets on the same Wi-Fi use `http://<shop-pc-lan-ip>:3000`. Allow inbound TCP 3000 in Windows Firewall for the private network only.

## 3. First staff account

`npm run seed` loads demonstration catalog data and development-only passwords. Do not run it against a database that already holds real sales.

On a brand-new disposable database you may seed once, then immediately:

1. Sign in as the seeded admin.
2. Change that password from Staff, or create a new admin and disable the seeded account.
3. Create the real cashier accounts.
4. Replace shop name, address, phone, receipt note, and paper width in Settings.

The seed script refuses to run when `NODE_ENV=production` unless `ALLOW_DEMO_SEED=true` is set. Leave that unset on the shop PC.

## 4. Start after reboot

Run MongoDB as a Windows service with the replica-set arguments above, or with a scheduled task at startup:

`mongod --dbpath C:\data\db --replSet rs0 --bind_ip 127.0.0.1 --port 27017`

Run the app with Task Scheduler, “At startup”, whether the user is logged on or not:

`npm run start -- -H 0.0.0.0 -p 3000`

Set the task’s “Start in” directory to the project folder so `.env.local` is found. Next.js reads `.env.local` for `next start`.

## 5. Printing

In Settings choose 58mm or 80mm. Receipts and claim tokens use the browser print dialog.

In Chrome or Edge: More settings → Margins: None → Headers and footers: off → select the thermal printer. Cancelling the dialog does not change the sale.

There is no direct USB/ESC-POS integration in this build.

## 6. Backup and restore

From the project folder, with `MONGODB_URI` set:

```bat
bash scripts/backup-mongo.sh C:\backups\pos-%DATE%
```

If Git Bash is not installed, the same command is:

```bat
mongodump --uri="%MONGODB_URI%" --out=C:\backups\pos
```

Restore only when you intend to replace the current database:

```bat
mongorestore --uri="%MONGODB_URI%" --drop C:\backups\pos\watch-shop-pos
```

Schedule `mongodump` daily. Copy the backup folder off the shop PC.

## 7. Logs and health

- Application logs: the Task Scheduler history and the console of `npm run start`
- MongoDB logs: the MongoDB service log, typically under the MongoDB installation `log` directory
- Health check: `GET /api/health` returns `{ "data": { "status": "ok" } }` when the database accepts a connection. It does not return connection details.

## 8. Password rotation checklist

- [ ] `AUTH_SECRET` is unique to this shop and is not the example value
- [ ] `.env.local` is not in git
- [ ] Seeded demonstration accounts are disabled or their passwords have been changed
- [ ] Each cashier has their own account
- [ ] Cloudinary secrets, if used, are only in `.env.local`
- [ ] MongoDB is not reachable from the public internet

## Restart

1. Stop the Node task.
2. Confirm `mongosh --eval "rs.status().ok"` returns `1`.
3. Start `npm run start -- -H 0.0.0.0 -p 3000` again.
4. Open `/api/health`, then sign in and confirm the open shift.
