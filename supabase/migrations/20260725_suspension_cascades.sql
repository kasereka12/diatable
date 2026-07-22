-- When a vendor or driver's profile is suspended/banned, immediately take
-- their public-facing listing(s) offline too — a suspended vendor's
-- restaurant stops being shown/orderable, a suspended driver stops being
-- assignable — instead of just blocking their login while everything else
-- stays live.

create or replace function cascade_profile_suspension()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status in ('suspended', 'banned') and old.status is distinct from new.status then
    update restaurants set is_active = false where owner_id = new.id and is_active = true;
    update delivery_drivers set is_active = false where profile_id = new.id and is_active = true;
  end if;
  return new;
end;
$$;

drop trigger if exists on_profile_suspension on profiles;
create trigger on_profile_suspension
  after update on profiles
  for each row execute procedure cascade_profile_suspension();
