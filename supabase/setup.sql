create table if not exists public.demo_counter (
  id text primary key,
  count integer not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.reaction_counts (
  emoji text primary key,
  count integer not null default 0,
  updated_at timestamptz not null default now()
);

insert into public.demo_counter (id, count)
values ('main', 0)
on conflict (id) do nothing;

alter table public.demo_counter enable row level security;
alter table public.reaction_counts enable row level security;

drop policy if exists "Anyone can read demo counter" on public.demo_counter;
create policy "Anyone can read demo counter"
on public.demo_counter
for select
to anon
using (true);

drop policy if exists "Anyone can read reaction counts" on public.reaction_counts;
create policy "Anyone can read reaction counts"
on public.reaction_counts
for select
to anon
using (true);

create or replace function public.increment_demo_counter(counter_id text)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  next_count integer;
begin
  update public.demo_counter
  set count = count + 1,
      updated_at = now()
  where id = counter_id
  returning count into next_count;

  return next_count;
end;
$$;

grant execute on function public.increment_demo_counter(text) to anon;

create or replace function public.increment_reaction_count(reaction_emoji text)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  next_count integer;
begin
  insert into public.reaction_counts (emoji, count, updated_at)
  values (reaction_emoji, 1, now())
  on conflict (emoji)
  do update
    set count = public.reaction_counts.count + 1,
        updated_at = now()
  returning count into next_count;

  return next_count;
end;
$$;

grant execute on function public.increment_reaction_count(text) to anon;

create or replace function public.reset_reaction_counts()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.reaction_counts
  set count = 0,
      updated_at = now()
  where true;
end;
$$;

grant execute on function public.reset_reaction_counts() to anon;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'demo_counter'
  ) then
    alter publication supabase_realtime add table public.demo_counter;
  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'reaction_counts'
  ) then
    alter publication supabase_realtime add table public.reaction_counts;
  end if;
end;
$$;
