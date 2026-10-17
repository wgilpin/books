// Where the app is served. vite.config.js and tests/deploy-config.test.ts both read these.
/** The public origin, through Caddy and the Cloudflare tunnel. The CSRF check trusts it. */
export const PUBLIC_ORIGIN = 'https://books.teleosis.ai';
/** The Mac's own origin. Form posts from it are trusted too. */
export const LOCAL_ORIGIN = 'http://localhost:3000';
