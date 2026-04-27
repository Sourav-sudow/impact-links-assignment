# Impact Links Assignment

Impact Links is a browser-ready demo for the Digital Heroes full-stack trainee PRD. It covers subscription states, Stableford score management, charity contribution logic, monthly draw simulation/publishing, winner verification, reports, and separate subscriber/admin panels.

## Run locally

```bash
node server.js
```

Open `http://127.0.0.1:5173`.

## Demo credentials

- Subscriber: `member@impactlinks.test` / `member123`
- Admin: `admin@impactlinks.test` / `admin123`

## Feature coverage

- Public homepage with charity-led positioning and responsive UI.
- Login, demo signup, role-based subscriber/admin screens.
- Monthly/yearly subscription state, mock checkout, invoice record, renewal date, cancellation, and active subscriber checks.
- Stableford scores with range validation, duplicate-date blocking, edit/delete support, and latest-five rolling retention.
- Charity search/filter, selected charity, minimum 10% contribution, adjustable percentage, and independent donation action.
- Draw engine with random and weighted modes, simulation before publish, 3/4/5 match tiers, equal split per tier, and jackpot rollover.
- Winner proof upload state, admin approval, and payout tracking.
- Admin reports, editable user table, charity add/edit/delete, draw publishing, draw history, and winner controls.

## PRD testing checklist

- [x] User signup and login.
- [x] Subscription flow for monthly and yearly plans.
- [x] Mock payment success and invoice record.
- [x] Score entry with 5-score rolling logic.
- [x] Duplicate date prevention for scores.
- [x] Draw simulation and official publish flow.
- [x] Charity selection and contribution calculation.
- [x] Winner proof upload state and admin review.
- [x] Payout tracking.
- [x] User dashboard modules.
- [x] Admin dashboard modules.
- [x] Responsive layout for mobile and desktop.
- [x] Supabase-style schema included.

## Production path

The PRD asks for Vercel, Supabase, Stripe, email notifications, and a public URL. Those require real account credentials and environment variables, so this repository includes an implementation-ready prototype plus a Supabase schema in `supabase-schema.sql`.

Suggested environment variables for production are included in `.env.example`:

```bash
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
EMAIL_PROVIDER_API_KEY=
JWT_SECRET=
```

## Notes for evaluators

This version uses `localStorage` as the demo data layer so it can run without private accounts. The state model mirrors tables in `supabase-schema.sql`, making it straightforward to replace local persistence with Supabase queries and edge functions.

See `ARCHITECTURE.md` for the production migration plan and entity model.

## Deployment note

`vercel.json` is included for a simple static deployment. For a real PRD-complete deployment, connect Supabase and Stripe environment variables first, then deploy the same public files to a new Vercel account as requested in the assignment.
