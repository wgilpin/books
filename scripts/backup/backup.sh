#!/bin/sh
# Backup sidecar: copy the live database once a day, then prune old copies.
set -eu
DB="${DATABASE_PATH:-/app/data/books.db}"
DIR="${BACKUP_DIR:-/backups}"

while true; do
	if [ -f "$DB" ]; then
		sqlite3 "$DB" ".backup '$DIR/books-$(date +%F).db'"
		node /app/scripts/backup/retention.mjs "$DIR"
		echo "backup done $(date -Iseconds)"
		sleep 86400
	else
		# The app makes the database on its first request. Check again soon.
		echo "no database at $DB yet"
		sleep 300
	fi
done
