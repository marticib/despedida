-- ================================================================
-- SUPABASE SETUP — Despedida
-- Executa aquest SQL a: Supabase Dashboard → SQL Editor → New Query
-- ================================================================

-- 1. Taula de confirmacions
create table if not exists public.confirmations (
  id          uuid        default gen_random_uuid() primary key,
  user_id     uuid        references auth.users(id) on delete cascade unique,
  username    text        not null,
  attending   boolean     not null,
  updated_at  timestamptz default now()
);

-- 2. Replica identity perquè real-time enviï dades completes
alter table public.confirmations replica identity full;

-- 3. Row Level Security
alter table public.confirmations enable row level security;

-- Tothom pot llegir les confirmacions
create policy "public read"
  on public.confirmations for select
  to anon, authenticated
  using (true);

-- Cada usuari pot insertar/actualitzar/eliminar la seva pròpia
create policy "own write"
  on public.confirmations for all
  to authenticated
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 4. Habilitar real-time per a la taula
alter publication supabase_realtime add table public.confirmations;
