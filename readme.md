# Yuck — Mockup

Prototype site for the "Yuck" natural workout powder. This repo contains a static mockup under `src/mockups/1` and a demo backend for Stripe checkout in `backend/`.

Quick start (frontend only)

1. Open `src/mockups/1/index.html` in your browser, or run a simple static server:

```bash
python3 -m http.server 8080
# or
npx http-server src/mockups/1 -p 8080
```

Backend (demo Stripe)

1. Install dependencies and set `.env` from `backend/.env.example`.

```bash
cd backend
npm init -y
npm i express stripe dotenv
cp .env.example .env
# edit .env and set STRIPE_SECRET
node index.js
```

2. Use the frontend `Buy now` flow to call `/create-checkout-session` when integrated with a real client.

Admin & demo signups
- The backend exposes a demo admin page at `/admin.html` (no auth) which lists signups saved to `backend/data/signups.json` and allows CSV download. Use only in local/dev environments and add auth for production.
Admin & demo signups
- The backend stores signups in a local SQLite database by default at `backend/database/yuck.db` (configurable via `DB_PATH` in `.env`).
- Admin endpoints are now protected with Basic Auth. Set `ADMIN_USER` and `ADMIN_PASS` in your `.env` (see `backend/.env.example`).
- To view signups in the browser, visit `http://localhost:4242/admin.html` and authenticate with the Basic Auth credentials when prompted (or use the admin endpoint with proper Authorization header).

API endpoints
- POST /api/signup  {email, hp?} — stores signup (basic rate-limiting and honeypot). Returns {ok:true}.
- GET /admin/signups — returns JSON array of signups (demo-only, no auth).


Security & production notes
- Configure SPF, DKIM, and DMARC for your sending domain.
- Use webhooks and server-side verification for payment events.
- Consider a frontend framework (Next.js) and managed DB for production.

Docs: see the `docs/` folder for project plan and recommendations.
