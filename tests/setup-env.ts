import { vi } from 'vitest';

// SvelteKit fills $app/env/private only when its server starts, so tests supply test values.
export const TEST_PASSWORD = 'correct horse battery staple';
export const TEST_PASSWORD_2 = 'tr0ub4dor and three';
export const TEST_SECRET = 'test-session-secret';

vi.mock('$app/env/private', () => ({
	APP_PASSWORD: 'correct horse battery staple',
	APP_PASSWORD_2: 'tr0ub4dor and three',
	SESSION_SECRET: 'test-session-secret'
}));
