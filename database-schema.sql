create extension if not exists "pgcrypto";

-- =========================
-- TABELLE MINIME PER AGENDA
-- =========================

-- Orario: 6 ore x 5 giorni (salviamo solo i campi, la UI gestisce 6x5)
-- vincolo unique per upsert su (user_id, day_of_week, hour)
create table if not exists public.timetable (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 1 and 7),
  hour smallint not null check (hour between 1 and 12),
  subject text not null default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, day_of_week, hour)
);

create index if not exists idx_timetable_user on public.timetable(user_id);

comment on column public.timetable.day_of_week is
'1=Lunedì, 2=Martedì, 3=Mercoledì, 4=Giovedì, 5=Venerdì, 6=Sabato, 7=Domenica';

-- Compiti
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject text not null,
  text text not null,
  created_at timestamptz default now()
);

create index if not exists idx_tasks_user on public.tasks(user_id);

-- Appunti
create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject text not null,
  text text not null,
  created_at timestamptz default now()
);

create index if not exists idx_notes_user on public.notes(user_id);

-- updated_at trigger (per timetable)
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_timetable_updated_at on public.timetable;
create trigger trg_timetable_updated_at
before update on public.timetable
for each row execute function public.touch_updated_at();

-- =========================
-- RLS (OBBLIGATORIO)
-- =========================
alter table public.timetable enable row level security;
alter table public.tasks enable row level security;
alter table public.notes enable row level security;

-- TIMETABLE policies
drop policy if exists "timetable_select_own" on public.timetable;
create policy "timetable_select_own"
on public.timetable for select
using (auth.uid() = user_id);

drop policy if exists "timetable_insert_own" on public.timetable;
create policy "timetable_insert_own"
on public.timetable for insert
with check (auth.uid() = user_id);

drop policy if exists "timetable_update_own" on public.timetable;
create policy "timetable_update_own"
on public.timetable for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "timetable_delete_own" on public.timetable;
create policy "timetable_delete_own"
on public.timetable for delete
using (auth.uid() = user_id);

-- TASKS policies
drop policy if exists "tasks_select_own" on public.tasks;
create policy "tasks_select_own"
on public.tasks for select
using (auth.uid() = user_id);

drop policy if exists "tasks_insert_own" on public.tasks;
create policy "tasks_insert_own"
on public.tasks for insert
with check (auth.uid() = user_id);

drop policy if exists "tasks_delete_own" on public.tasks;
create policy "tasks_delete_own"
on public.tasks for delete
using (auth.uid() = user_id);

-- NOTES policies
drop policy if exists "notes_select_own" on public.notes;
create policy "notes_select_own"
on public.notes for select
using (auth.uid() = user_id);

drop policy if exists "notes_insert_own" on public.notes;
create policy "notes_insert_own"
on public.notes for insert
with check (auth.uid() = user_id);

drop policy if exists "notes_delete_own" on public.notes;
create policy "notes_delete_own"
on public.notes for delete
using (auth.uid() = user_id);