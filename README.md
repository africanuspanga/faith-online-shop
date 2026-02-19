# Faith Online Shop

Modern mobile-first Tanzanian e-commerce build with Next.js 16, React 19, TypeScript, Tailwind v4, Lucide icons, and Supabase-ready admin APIs.

## Run locally

```bash
npm install
npm run dev
```

## Environment setup

Copy `.env.example` to `.env.local` and fill values:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_ADMIN_PASSWORD` (optional, defaults to `DukaAdmin@2026!`)
- `PESAPAL_ENVIRONMENT` (`live` or `sandbox`)
- `PESAPAL_CONSUMER_KEY`
- `PESAPAL_CONSUMER_SECRET`
- `PESAPAL_NOTIFICATION_ID`
- `SMS_API_USERNAME` + `SMS_API_PASSWORD` (or `SMS_API_BASIC_AUTH`)
- `SMS_API_AUTH_HEADER` (optional raw auth header, e.g. `Bearer ...`)
- `ORDER_ALERT_SMS_TO` (country code format, e.g. `255653670590`)
- `SMS_API_SENDER_ID` (default `NEXTSMS`)
- `SMS_API_TEST_MODE` (`true` to use test endpoint)

## Supabase setup

1. Create a Supabase project.
2. Run `supabase/schema.sql` in SQL editor.
3. Add env values to `.env.local`.

## Key routes

- `/` Homepage
- `/shop` Shop with URL-based filtering/sort/pagination
- `/categories/[slug]` Category pages
- `/checkout/[id]` Direct-to-checkout order page
- `/thank-you` Order confirmation
- `/contact` Contact page
- `/admin` Admin dashboard (orders + add product)
- `/admin/login` Admin login
- `/api/payments/pesapal/callback` Pesapal callback endpoint
- `/api/payments/pesapal/ipn` Pesapal IPN endpoint

## Admin auth flow

- Password-only login (localStorage key: `admin_auth`).
- Default password: `DukaAdmin@2026!` unless overridden by `NEXT_PUBLIC_ADMIN_PASSWORD`.
- Admin API requests send `x-admin-password` header.

## Duka-style flow implemented

- Product card `See details` goes directly to `/checkout/[id]`.
- No cart step in checkout flow.
- Checkout has quantity offers: Buy 1, Buy 2 Get 1 Free (default), Buy 3 Get 2 Free.
- Checkout supports size/color variants, payment methods (COD, Pesapal, Bank Deposit), and installment deposit option.
- Order POST goes to `/api/orders`, stores payment/status metadata, and can return Pesapal redirect URL.
- Thank-you page includes post-delivery review form.
- Admin dashboard has auto-refresh, order print, payment-status updates, visitor analytics, product upload/create, SKU/brand, and dynamic category input.

## Notes

- If Supabase keys are missing, products/orders fallback to static + in-memory API behavior.
- First-time visitor signup + site view tracking are saved via `/api/signups` and `/api/visits`.
- Build may fail in restricted networks because `next/font/google` needs to fetch Inter from Google Fonts during build.
- Product image upload in admin uses Supabase Storage bucket `product-images` (created in `supabase/schema.sql`).
