# Yuck — Project Documentation

This folder contains a brief overview of the Yuck mockup project, suggested production services, tech stack, and a sample Gantt timeline for initial rollout.

## Overview
- Brand: Yuck — intentionally "yuck" tasting natural workout powder.
- Goal: Build a marketing-forward e-commerce site to sell product and recruit community ambassadors.

## Tech stack (proposal)
- Frontend: Static HTML/CSS/Vanilla JS prototype. Later: React/Next.js or SvelteKit for production.
- Backend: Node.js + Express demo. Production: serverless functions (Vercel, Netlify) or hosted Node with Docker.
- Payments: Stripe (Checkout + Billing) and optional PayPal integration.
- Email/Transactional: SendGrid or Amazon SES. Use a verified sending domain and enable DKIM/SPF/DMARC.
- Community: Discord or Slack for community. Use role-based invites for subscribers.
- DB: PostgreSQL or managed provider (Supabase) for orders, users, and signups.

## Services to consider
- Stripe: payments, subscriptions, webhooks for fulfillment
- SendGrid/SES: transactional emails and deliverability
- Sentry/Datadog: monitoring and security alerts
- Cloudflare: CDN, WAF, and DNS (DNS records for email + DMARC)

## Security & Email
- Configure SPF, DKIM, and DMARC for the sending domain.
- Use HTTPS everywhere, Content Security Policy, and secure cookies.
- Implement rate-limiting and bot detection for signup endpoints.

## Gantt (sample, 6-week rollout)
- Week 1: Design & branding finalisation, palette and copydrafts
- Week 2: Frontend implementation of pages and responsive styles
- Week 3: Backend endpoints, Stripe integration, email provider setup
- Week 4: QA, accessibility, security hardening (DMARC/SPF), automation
- Week 5: Beta launch to ambassadors, collect feedback
- Week 6: Production launch and marketing push to reach 1,000/mo

## Notes
This prototype is a static mockup. See `backend/index.js` for a demo Stripe checkout endpoint. Replace demo keys with real production configurations and implement server-side validation for production readiness.
