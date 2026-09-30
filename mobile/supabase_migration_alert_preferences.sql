-- Run this migration in Supabase SQL Editor after review.
-- It adds per-authenticated-user alert preferences and enables Realtime for
-- the existing app tables where they are present. It does not add or rename
-- any notification read/resolved columns and creates no alert-generation rule.

create table if not exists public.notification_preferences (
  user_id uuid primary key references auth.users (id) on delete cascade,
  defect_count_threshold integer not null default 1
    check (defect_count_threshold between 1 and 20),
  defect_rate_threshold numeric not null default 0.05
    check (defect_rate_threshold between 0 and 1),
  in_app_enabled boolean not null default true,
  email_enabled boolean not null default false,
  sms_enabled boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.notification_preferences enable row level security;
grant select, insert, update on public.notification_preferences to authenticated;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'notification_preferences'
      and policyname = 'Users manage their own notification preferences'
  ) then
    create policy "Users manage their own notification preferences"
      on public.notification_preferences
      for all to authenticated
      using (user_id = auth.uid())
      with check (user_id = auth.uid());
  end if;
end
$$;

do $$
declare
  relation_name text;
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    foreach relation_name in array array[
      'inspections', 'defects', 'notifs', 'notifications'
    ] loop
      if to_regclass(format('public.%I', relation_name)) is not null
        and not exists (
          select 1 from pg_publication_tables
          where pubname = 'supabase_realtime'
            and schemaname = 'public'
            and tablename = relation_name
        ) then
        execute format(
          'alter publication supabase_realtime add table public.%I',
          relation_name
        );
      end if;
    end loop;
  end if;
end
$$;
