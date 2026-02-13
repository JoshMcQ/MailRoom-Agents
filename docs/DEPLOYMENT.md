# Deployment Guide

## Prerequisites
- Supabase project (database + storage + auth)
- Supabase CLI (`supabase`)
- Node.js 20+
- Optional: Vercel (or Supabase Hosting) for the Next.js application

## Configuration Steps
1. **Environment**
   - Copy `.env.example` to `.env` and populate Supabase keys plus connector credentials as available.
2. **Database**
   - `supabase db push` to apply `db/schema.sql` (or `pnpm ts-node scripts/migrate.ts`).
   - `supabase db execute --file db/seed.sql` to load demo data.
3. **Edge Functions**
   - From `apps/functions`: `supabase functions deploy webhooks/inbound actions/send worker digest/nightly sla/check`.
   - Configure cron triggers:
     - `/worker` every 1 minute
     - `/sla/check` every 5 minutes
     - `/digest/nightly` daily at 08:00 org-local
4. **Next.js Web**
   - `npm install` (or `pnpm install`).
   - `npm run dev` for local development (`supabase start` recommended for local Postgres + real-time).
   - Deploy via Vercel or Supabase Hosting, supplying runtime env vars (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, connector keys).
5. **Email Sending**
   - Provide SMTP credentials (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`).
   - Configure DNS records (SPF, DKIM, DMARC) for `SENDING_DOMAIN`.
6. **OAuth Providers**
   - Gmail: set `GMAIL_CLIENT_ID` / `GMAIL_CLIENT_SECRET`, configure consent screen + redirect URI.
   - Microsoft 365: `MS_CLIENT_ID` / `MS_CLIENT_SECRET` via Azure App Registration.
7. **Secrets Management**
   - Store all credentials using Supabase Secrets (`supabase secrets set ...`).

## Local Development Helper
`scripts/dev.sh` spins up Supabase local stack and runs the turborepo dev pipeline.

## Monitoring & Logs
- Edge function invocations visible via `supabase functions logs`.
- Use `events` table for application-level audit trails (subscribe in UI for live feed).
