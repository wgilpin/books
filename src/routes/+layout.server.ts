import { getDb } from '#lib/server/db.js';
import { queueCount } from '#lib/server/marks.js';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async () => ({ queueCount: queueCount(getDb()) });
