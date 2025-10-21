# Payments integration — notes and recommendations

This document outlines recommended approaches, cost considerations, and implementation notes for Stripe and PayPal integration for the Yuck project.

1) Stripe (recommended primary)
- Use Stripe Checkout for a quick, PCI-compliant flow (server creates Checkout Session, client redirects).
- For subscriptions use Stripe Billing with Price objects configured as recurring. Use webhooks to handle subscription lifecycle (invoice.paid, invoice.payment_failed, customer.subscription.deleted).
- Test keys: use test API keys in `.env` during development. Never commit live keys.
- Costing: Stripe fees typically ~2.9% + $0.30 per transaction (varies by country). For subscriptions, consider prorations/refunds and tax handling.
- Implementation notes:
  - Create product and price IDs in the Stripe dashboard for one-time and subscription SKUs.
  - Server endpoint: POST /create-checkout-session with {priceId, quantity} → create session and return session.url.
  - Securely verify webhooks using `STRIPE_WEBHOOK_SECRET` and verify signatures on the server.

2) PayPal (optional secondary)
- Use PayPal Orders API or their JS SDK if you need PayPal as a payment option.
- Business model and UX: PayPal checkout can be embedded as a button or performed via server-side order creation & client redirection.

3) Fraud & Security
- Use address verification and require CVV for card payments. Use Stripe Radar rules to manage fraud.
- Use webhooks to confirm payment success before fulfilling orders.

4) Local testing and cost considerations
- Use Stripe test mode and the test card numbers documented by Stripe.
- Estimate monthly payment processing costs as (volume * avg price) * fee-rate + per-transaction fixed fees. Make conservative assumptions for chargebacks and refunds.

5) Recurring subscriptions and benefits
- Consider gating community perks and invite tokens for subscribers. Use a server-side job to generate invite tokens (Discord/Slack) and email them to paid subscribers.
