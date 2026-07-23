-- Reactivating a suspended/banned vendor or driver did not bring their
-- restaurant/driver listing back online — cascade_profile_suspension only
-- handled the deactivation direction. Track which rows were force-deactivated
-- by a suspension (as opposed to already inactive for an unrelated reason —
-- never verified, or independently rejected by an admin) so reactivation can
-- restore exactly those, and only those.

alter table restaurants
  add column if not exists deactivated_by_suspension boolean not null default false;

alter table delivery_drivers
  add column if not exists deactivated_by_suspension boolean not null default false;

create or replace function cascade_profile_suspension()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if old.status is distinct from new.status then
    if new.status in ('suspended', 'banned') then
      update restaurants
        set is_active = false, deactivated_by_suspension = true
        where owner_id = new.id and is_active = true;
      update delivery_drivers
        set is_active = false, deactivated_by_suspension = true
        where profile_id = new.id and is_active = true;
    elsif new.status = 'active' then
      update restaurants
        set is_active = true, deactivated_by_suspension = false
        where owner_id = new.id and deactivated_by_suspension = true;
      update delivery_drivers
        set is_active = true, deactivated_by_suspension = false
        where profile_id = new.id and deactivated_by_suspension = true;
    end if;
  end if;
  return new;
end;
$$;
