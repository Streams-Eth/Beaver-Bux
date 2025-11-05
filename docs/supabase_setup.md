# Supabase setup for Beaver Bux

This document explains how to set up Supabase and wire it into the PayPal webhook endpoint so payments are stored in a persistent Postgres table.

## Environment variables
Add the following environment variables to your deployment (Netlify, Vercel, etc.):

- `SUPABASE_URL` — your Supabase project URL (e.g. `https://abcd1234.supabase.co`)
- `SUPABASE_SERVICE_ROLE_KEY` — the Service Role key (server-only, keep secret)

Do NOT expose the service role key to client-side code.

## SQL to create `payments` table
Run this SQL in the Supabase SQL editor (or via psql):

```sql
create table public.payments (
  transaction_id text primary key,
  source text,
  event_type text,
  received_at timestamptz default now(),
  gross_cad numeric,
  currency text,
  description text,
  tokens numeric,
  raw_event jsonb
);

-- optional index for reporting
create index if not exists idx_payments_received_at on public.payments (received_at desc);
```

## How the webhook uses Supabase

- The webhook at `/api/paypal/webhook` verifies the PayPal signature.
- If `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set, it will upsert the payment into `payments` using `transaction_id` as the unique key.
- If Supabase isn't configured, the webhook falls back to appending the event to `data/payments.json` (development-only fallback).

## Local development


```

# Optional for on-chain delivery (admin)
ETHEREUM_RPC_URL=https://mainnet-or-testnet-rpc.example
ADMIN_PRIVATE_KEY=0xYOUR_PRIVATE_KEY
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Security Notes

- Use the Service Role key only in server-side code. Rotate the key if it is ever exposed.
- Keep PayPal verification enabled (the webhook verifies signatures before writing to DB).
