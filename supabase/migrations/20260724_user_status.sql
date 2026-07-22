-- Lets an admin suspend (temporary) or ban (permanent) a user account.
-- Enforced server-side in the auth-login Edge Function: a suspended/banned
-- user's session is immediately invalidated and login is refused with an
-- explicit message, rather than only being hidden client-side.

alter table profiles
  add column if not exists status text not null default 'active'
    check (status in ('active', 'suspended', 'banned'));

-- ── Guard: only an admin may promote to admin or change status ──────────────
-- The existing "Users can update own profile" RLS policy has no column
-- restriction, so any authenticated user could otherwise self-promote to
-- admin, or lift their own suspension/ban, with a direct client update.
-- Legitimate self-service role changes (client -> vendor via onboarding,
-- client -> driver via driver signup) stay allowed — only escalation to
-- 'admin' specifically, and any status change, require is_admin().
create or replace function protect_profile_privileged_fields()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.role = 'admin' and old.role is distinct from 'admin' and not is_admin() then
    new.role := old.role;
  end if;
  if new.status is distinct from old.status and not is_admin() then
    new.status := old.status;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_profile_privileged_fields_trigger on profiles;
create trigger protect_profile_privileged_fields_trigger
  before update on profiles
  for each row execute procedure protect_profile_privileged_fields();
