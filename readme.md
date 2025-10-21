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

Security & production notes
- Configure SPF, DKIM, and DMARC for your sending domain.
- Use webhooks and server-side verification for payment events.
- Consider a frontend framework (Next.js) and managed DB for production.

Docs: see the `docs/` folder for project plan and recommendations.
