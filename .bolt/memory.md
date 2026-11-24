# Project memory

## Product intent & audience

- **Shadow Map**: a paid product that delivers a report to buyers upon purchase.
- Purchases are processed through Stripe; buyers receive their report after payment is confirmed.
- Stripe account owner is **Morgan**, who also sells other products (a challenge, subscriptions) through the same Stripe account.
- Audience: individual buyers purchasing the Shadow Map report.

## Brand personality & voice

- Communication style is reassuring, plain-language, and customer-support oriented.
- User-facing explanations favor clarity over technical jargon; summaries lead with the most important takeaway (e.g., "no customers were affected").

## Visual design & UX direction

- Not yet inferred from available context.

## Decisions, constraints & rationale

- **Framework:** Vite + React.
- **Stripe webhooks** are the mechanism Stripe uses to notify the app of payments. A dedicated webhook endpoint receives these events.
- **Backup verification:** an automated check runs every 15 minutes to confirm buyers are marked paid and have received their reports; this has been running continuously.
- **Webhook fix (recent):** old, broken subscription-handling code was attempting to process Stripe events for Morgan's non-Shadow-Map products, failing, and causing Stripe to record failures. Fix: app now accepts all Stripe events and ignores ones for other products; broken subscription code removed. Shadow Map purchase flow unchanged.
- **Customer impact (verified):** all 7 Shadow Map buyers since Nov 1 were marked paid and received full reports; no customer affected.
- Stripe account is shared across multiple product lines; only Shadow Map events are relevant to this app.

## Open questions & assumptions

- Assumption: the webhook fix will eliminate future Stripe failure emails for non-Shadow-Map events.
- Assumption: the 15-minute backup check is sufficient as a safety net for payment/report delivery.
- Open: whether any further subscription-related functionality is needed in the app long-term (broken code was removed rather than repaired).