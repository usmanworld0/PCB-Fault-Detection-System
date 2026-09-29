-- Review and run manually if shared resolved state is wanted across devices.
-- The mobile app works before this migration using local device storage and
-- the existing notifications.is_read column.
alter table public.notifications
  add column if not exists resolved boolean not null default false;

grant update (resolved) on public.notifications to authenticated;

do $$
begin
  if exists (
    select 1
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = 'notifications'
      and c.relrowsecurity
  ) then
    execute 'drop policy if exists authenticated_update_notification_resolved on public.notifications';
    execute 'create policy authenticated_update_notification_resolved
      on public.notifications for update to authenticated
      using (true) with check (true)';
  end if;
end
$$;
