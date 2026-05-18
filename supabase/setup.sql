create table if not exists public.demo_counter (
  id text primary key,
  count integer not null default 0,
  updated_at timestamptz not null default now()
);

insert into public.demo_counter (id, count)
values ('main', 0)
on conflict (id) do nothing;

alter table public.demo_counter enable row level security;

drop policy if exists "Anyone can read demo counter" on public.demo_counter;
create policy "Anyone can read demo counter"
on public.demo_counter
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

alter publication supabase_realtime add table public.demo_counter;
