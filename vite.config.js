import adapter from '@sveltejs/adapter-node';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [
		sveltekit({
			adapter: adapter(),
			// Trusted origin for form CSRF checks. Set at build time; phase 04 changes it.
			paths: { origin: process.env.APP_ORIGIN ?? 'http://localhost:3000' }
		})
	],
	test: {
		include: ['src/**/*.test.ts', 'scripts/**/*.test.ts'],
		environment: 'node',
		// Tests run on a dedicated in-memory database, never the live file.
		env: { DATABASE_PATH: ':memory:' }
	}
});
