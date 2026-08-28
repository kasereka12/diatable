-- The public /contact form never actually sent anything anywhere — handleSubmit
-- just did a setTimeout() and showed a fake success screen. This table lets
-- it persist real messages, readable by admins in SectionMessages.

create table if not exists contact_messages (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  email       text not null,
  reason      text,
  message     text not null,
  status      text not null default 'new' check (status in ('new','read','archived')),
  created_at  timestamptz default now()
);

create index if not exists idx_contact_messages_created on contact_messages (created_at desc);

alter table contact_messages enable row level security;

create policy "Public peut envoyer un message de contact"
  on contact_messages for insert with check (true);

create policy "Admin peut lire les messages de contact"
  on contact_messages for select using (is_admin());

create policy "Admin peut modifier les messages de contact"
  on contact_messages for update using (is_admin());

create policy "Admin peut supprimer les messages de contact"
  on contact_messages for delete using (is_admin());


