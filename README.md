# Snap and Seek

Hide. Seek. Snap. Find them all. — Landing + Supabase for hackathon.

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Supabase setup

### 1. Create a Supabase project

- Go to [supabase.com](https://supabase.com) and create a project.
- Wait for the DB to be ready.

### 2. Create the `games` table

In the Supabase **SQL Editor**, run:

```sql
create table if not exists public.games (
  id uuid primary key default gen_random_uuid(),
  name text,
  status text default 'active',
  created_at timestamptz default now()
);

-- Optional: insert a couple of rows
insert into public.games (name, status) values
  ('First game', 'active'),
  ('Second game', 'pending');
```

You can change columns as you like; the app will show whatever you return from `games`.

### 3. Get your API keys

- In Supabase: **Project Settings** → **API**.
- Copy:
  - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
  - **service_role** key (under "Project API keys") → `SUPABASE_SERVICE_ROLE_KEY`

**Important:** The service role key bypasses Row Level Security (RLS). Use it only on the server (we do). Don’t expose it in client-side code or commit it.

### 4. Env file

Copy the example env and fill in your values:

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

- `NEXT_PUBLIC_SUPABASE_URL` — your Supabase project URL (public is fine).
- `SUPABASE_SERVICE_ROLE_KEY` — server-only; used in `lib/supabase.ts` to read from `games` with full access (no RLS).

Restart the dev server after changing env vars.

## What’s in the repo

- **Landing page:** `app/page.tsx` — Snap and Seek hero + list of games from Supabase.
- **Supabase client:** `lib/supabase.ts` — server-side client using the service role key; reads from the `games` table.
- **No RLS:** We’re using the service role key so the app can read all rows in `games` without setting up RLS (hackathon shortcut).

## Scripts

- `npm run dev` — dev server
- `npm run build` — production build
- `npm run start` — run production build
