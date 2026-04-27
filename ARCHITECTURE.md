# Architecture Notes

## Current demo

The app is intentionally static so it can be reviewed without private credentials. `app.js` uses a small local data store backed by `localStorage`, seeded with demo subscribers, charities, scores, invoices, winners, and admin data.

## Production upgrade path

1. Replace `localStorage` persistence with Supabase queries.
2. Move draw publishing to a protected Supabase Edge Function so the jackpot and winner calculations cannot be altered client-side.
3. Replace mock checkout with Stripe Checkout and a webhook that updates `subscriptions`, `donations`, and `notifications`.
4. Store proof uploads in Supabase Storage and keep signed URLs in the `winners.proof_url` field.
5. Enforce role-based access with Supabase Row Level Security.

## Core entities

- `profiles`: subscriber/admin identity and role.
- `subscriptions`: plan, Stripe IDs, status, and renewal date.
- `scores`: dated Stableford scores with a unique `(user_id, score_date)` constraint.
- `charities`: searchable charity directory and event content.
- `user_charity_preferences`: selected charity and contribution percentage.
- `draws`: official monthly draw result and jackpot state.
- `draw_entries`: score snapshot for each monthly draw.
- `winners`: tier, amount, proof review, and payment state.
- `donations`: subscription-funded or independent donations.
- `notifications`: email-ready system messages.

## Important rules

- Stableford score must be between 1 and 45.
- Only one score is allowed per date.
- Each subscriber keeps the latest five scores.
- Minimum charity contribution is 10%.
- Prize tiers are 40% for 5-match, 35% for 4-match, and 25% for 3-match.
- If there is no 5-match winner, the jackpot rolls over.
