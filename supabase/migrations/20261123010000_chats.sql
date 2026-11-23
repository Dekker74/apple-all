-- CircularLink · persistent B2B chat
-- Apply with `supabase db push` or paste into the Supabase SQL editor.
-- Uses the organizations/memberships/material tables from 20260101000000_init.sql.

create table if not exists chats (
  id uuid primary key default gen_random_uuid(),
  buyer_org_id uuid not null references organizations (id) on delete cascade,
  supplier_org_id uuid not null references organizations (id) on delete cascade,
  listing_id uuid references material_listings (id) on delete set null,
  request_id uuid references material_requests (id) on delete set null,
  match_id uuid references matches (id) on delete set null,
  subject text not null,
  created_at timestamptz not null default now(),
  constraint chats_participants_distinct check (buyer_org_id <> supplier_org_id)
);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid not null references chats (id) on delete cascade,
  sender_id uuid not null references auth.users (id) on delete cascade,
  body text not null check (char_length(trim(body)) between 1 and 4000),
  created_at timestamptz not null default now()
);

create index if not exists messages_chat_created_idx on messages (chat_id, created_at);
create index if not exists chats_buyer_idx on chats (buyer_org_id);
create index if not exists chats_supplier_idx on chats (supplier_org_id);

create or replace function can_access_chat(target_chat uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from chats c
    where c.id = target_chat
      and (is_org_member(c.buyer_org_id) or is_org_member(c.supplier_org_id))
  );
$$;

grant execute on function can_access_chat(uuid) to authenticated;

alter table chats enable row level security;
alter table messages enable row level security;

drop policy if exists chats_select_participant on chats;
create policy chats_select_participant on chats
  for select to authenticated using (can_access_chat(id));

drop policy if exists chats_insert_participant on chats;
create policy chats_insert_participant on chats
  for insert to authenticated
  with check (is_org_member(buyer_org_id) or is_org_member(supplier_org_id));

drop policy if exists messages_select_participant on messages;
create policy messages_select_participant on messages
  for select to authenticated using (can_access_chat(chat_id));

drop policy if exists messages_insert_sender on messages;
create policy messages_insert_sender on messages
  for insert to authenticated
  with check (sender_id = auth.uid() and can_access_chat(chat_id));

revoke all on chats, messages from anon;
grant select, insert on chats, messages to authenticated;
