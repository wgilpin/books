// Backup retention: keep the newest 7 daily, 4 weekly and 6 monthly copies.
// Run as `node retention.mjs <dir>` to delete the rest. Backups are named books-YYYY-MM-DD.db.
import { readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const PATTERN = /^books-(\d{4}-\d{2}-\d{2})\.db$/;
const KEEP = { daily: 7, weekly: 4, monthly: 6 };

/** The Monday that starts the week of a YYYY-MM-DD date. */
function weekOf(day) {
	const date = new Date(`${day}T00:00:00Z`);
	date.setUTCDate(date.getUTCDate() - ((date.getUTCDay() + 6) % 7));
	return date.toISOString().slice(0, 10);
}

/** The newest backup in each of the first `count` periods, newest period first. */
function newestPerPeriod(backups, periodOf, count) {
	const seen = new Map();
	for (const backup of backups) {
		const period = periodOf(backup.day);
		if (!seen.has(period)) seen.set(period, backup.name);
	}
	return [...seen.values()].slice(0, count);
}

/** @param {string[]} names @returns {string[]} the dated backups to delete */
export function backupsToDelete(names) {
	const backups = names
		.map((name) => ({ name, day: PATTERN.exec(name)?.[1] }))
		.filter((backup) => backup.day)
		.sort((a, b) => b.day.localeCompare(a.day));

	const keep = new Set([
		...backups.slice(0, KEEP.daily).map((backup) => backup.name),
		...newestPerPeriod(backups, weekOf, KEEP.weekly),
		...newestPerPeriod(backups, (day) => day.slice(0, 7), KEEP.monthly)
	]);
	return backups.filter((backup) => !keep.has(backup.name)).map((backup) => backup.name);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
	const dir = process.argv[2];
	if (!dir) throw new Error('Usage: node retention.mjs <backup dir>');
	for (const name of backupsToDelete(readdirSync(dir))) {
		rmSync(join(dir, name));
		console.log(`deleted ${name}`);
	}
}
