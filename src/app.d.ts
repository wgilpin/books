import type { UserId } from '#lib/server/session.js';

declare global {
	namespace App {
		interface Locals {
			user?: UserId;
		}
	}
}

export {};
