#!/usr/bin/env bash
# Daily local backup for the shop PC. Schedule with cron or Windows Task Scheduler.
set -euo pipefail
OUT="${1:-./backups/$(date +%Y-%m-%d)}"
URI="${MONGODB_URI:-mongodb://127.0.0.1:27017/watch-shop-pos}"
mkdir -p "$OUT"
mongodump --uri="$URI" --out="$OUT"
echo "Backup written to $OUT"
echo "Restore with: mongorestore --uri=\"$URI\" --drop \"$OUT/watch-shop-pos\""
