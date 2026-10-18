import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { LOCAL_ORIGIN, PUBLIC_ORIGIN } from '../origins.js';

const read = (path: string) => readFileSync(path, 'utf8');

describe('origins', () => {
	it('trusts the public domain as the origin and localhost for form posts', () => {
		expect(PUBLIC_ORIGIN).toBe('https://books.teleosis.ai');
		expect(LOCAL_ORIGIN).toBe('http://localhost:3000');
		const config = read('vite.config.js');
		expect(config).toMatch(/origin:\s*process\.env\.APP_ORIGIN \?\? PUBLIC_ORIGIN/);
		expect(config).toMatch(/csrf:\s*\{\s*trustedOrigins:\s*\[LOCAL_ORIGIN\]\s*\}/);
	});

	it('builds the image for the public origin by default', () => {
		expect(read('Dockerfile')).toContain('ARG APP_ORIGIN=https://books.teleosis.ai');
	});
});

describe('docker-compose.yml', () => {
	const compose = read('docker-compose.yml');
	const app = compose.slice(compose.indexOf('  app:'), compose.indexOf('  backup:'));

	it('puts the app on the external web-routing network under a fixed name', () => {
		expect(app).toContain('container_name: books-app');
		expect(app).toMatch(/networks:\s*\n\s*- web-routing/);
		expect(compose).toMatch(/\nnetworks:\s*\n\s+web-routing:\s*\n\s+external: true/);
	});

	it('gives the app its secrets from .env at run time', () => {
		expect(app).toMatch(/env_file:\s*\n\s*- \.env/);
	});
});

describe('the password stays out of the image', () => {
	it('keeps .env out of the build context', () => {
		expect(read('.dockerignore').split('\n')).toContain('.env');
	});

	it('passes no secret as a build arg or an inline value', () => {
		const code = (file: string) =>
			read(file)
				.split('\n')
				.filter((line) => !line.trim().startsWith('#'))
				.join('\n');
		for (const file of ['Dockerfile', 'docker-compose.yml']) {
			expect(code(file)).not.toMatch(/APP_PASSWORD|APP_PASSWORD_2|SESSION_SECRET/);
		}
	});
});

describe('docs/deploy.md', () => {
	const doc = read('docs/deploy.md');

	it('holds the Caddy block for books-app on port 3000 with dynamic upstreams', () => {
		const block = doc.slice(doc.indexOf('http://books.teleosis.ai {'));
		expect(block).toMatch(
			/^http:\/\/books\.teleosis\.ai \{\s*reverse_proxy \{\s*dynamic a \{\s*name books-app\s*port 3000\s*refresh 10s\s*\}\s*\}\s*\}/
		);
	});

	it('holds the manual phone check', () => {
		expect(doc).toContain('## Manual A');
	});
});
