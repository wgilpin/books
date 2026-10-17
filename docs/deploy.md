# Deploy — books on the internet

The app runs in OrbStack as `books-app`. Caddy reaches it on the shared
`web-routing` network, and the Cloudflare tunnel carries `books.teleosis.ai`
to Caddy. TLS ends at Cloudflare. Caddy and the app talk plain http.

`http://localhost:3000` keeps working on the Mac. Both addresses need the
password.

## 1. Set the secrets

Copy `.env.example` to `.env` next to `docker-compose.yml`, and fill it in:

```bash
cp .env.example .env
openssl rand -base64 32
```

Put the `openssl` output in `SESSION_SECRET`, and the login password in
`APP_PASSWORD`. `.env` stays out of git and out of the image. The app reads it
when the container starts, and refuses to start when either value is missing.

To log every device out, change `SESSION_SECRET` and restart the container.
There is no log-out button.

## 2. Start the container

```bash
docker compose up -d --build
```

The `web-routing` network must exist already. Caddy and the other apps use it.

## 3. Add the Caddy route

Add this block to `~/projects/caddy/Caddyfile`, then reload Caddy:

```text
http://books.teleosis.ai {
	reverse_proxy {
		dynamic a {
			name books-app
			port 3000
			refresh 10s
		}
	}
}
```

`dynamic a` re-resolves the container address every 10 seconds, so a restart
of `books-app` does not leave Caddy pointing at an old address.

## 4. Add the hostname to the tunnel

In the Cloudflare tunnel, route `books.teleosis.ai` to Caddy, the same way as
the other `teleosis.ai` hostnames.

## How the app trusts the two addresses

- `origins.js` holds both. The build sets `paths.origin` to
  `https://books.teleosis.ai`, and `csrf.trustedOrigins` adds
  `http://localhost:3000`. A form post from any other origin fails.
- The session cookie is `HttpOnly` and `SameSite=Lax`. It is `Secure` for every
  host except `localhost` and `127.0.0.1`. Safari drops a `Secure` cookie on
  `http://localhost`.
- Five wrong passwords in 15 minutes lock every login for 15 minutes. A
  container restart clears the lock.

## Manual A

Run this after the steps above, and after any change to the route.

1. On the phone, with Wi-Fi off, open `https://books.teleosis.ai`. Expect
   Login.
2. Enter a wrong password. Expect "Wrong password".
3. Enter the right password. Expect the list.
4. Press "Refresh from Wikidata". Expect the progress notice, and no
   "Cross-site POST form submissions are forbidden" error. This form changes no
   mark, so it is a safe check of every form post.
5. On the Mac, open `https://books.teleosis.ai` in Chrome with DevTools open.
   Log in, and read the `Set-Cookie` header on the `/login` response. Expect
   `HttpOnly`, `SameSite=Lax` and `Secure`.
6. On the Mac, open `http://localhost:3000`, log in, and press "Refresh from
   Wikidata". Expect no error.
7. Run `docker compose logs app` and search the output for the password.
   Expect no match.
