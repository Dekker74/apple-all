-- CircularLink · paste this whole file into the Supabase SQL editor once.
-- It combines the initial schema, quote leads, and persistent B2B chat.
-- Only for a FRESH project. If the first two migrations are already applied,
-- paste only supabase/migrations/20261123010000_chats.sql instead.
-- CircularLink · initial schema
-- Target: Supabase (PostgreSQL 15+)
-- Run with: supabase db push   (or paste into the SQL editor)

create extension if not exists "pgcrypto";

-- ─────────────────────────────────────────────────────────────────────────────
-- Enums
-- ─────────────────────────────────────────────────────────────────────────────
create type account_role as enum ('business', 'individual');
create type org_type as enum ('supplier', 'buyer', 'both');
create type member_role as enum ('owner', 'admin', 'member');
create type membership_status as enum ('active', 'invited');
create type material_category as enum ('paper_cardboard', 'wood', 'plastic');
create type material_condition as enum ('clean', 'mixed', 'needs_processing');
create type processing_type as enum (
  'sorting', 'washing', 'shredding', 'pelletizing', 'deinking', 'drying', 'baling'
);
create type listing_status as enum ('draft', 'active', 'matched', 'reserved', 'sold', 'archived');
create type request_status as enum ('draft', 'open', 'matched', 'fulfilled', 'closed');
create type match_confidence as enum ('strong', 'review', 'weak');
create type match_status as enum ('suggested', 'shortlisted', 'dismissed', 'quoted');
create type order_status as enum (
  'draft', 'matched', 'quote_issued', 'quote_accepted',
  'collection_scheduled', 'completed', 'cancelled'
);
create type quote_status as enum ('issued', 'accepted', 'declined', 'expired');
create type qc_status as enum ('pending', 'scheduled', 'passed', 'failed');
create type partner_kind as enum ('processing', 'transport', 'qc');
create type notification_tone as enum ('info', 'success', 'warning');
create type order_event_kind as enum ('system', 'user', 'partner', 'finance');
create type request_frequency as enum ('one_off', 'weekly', 'monthly', 'quarterly');

-- ─────────────────────────────────────────────────────────────────────────────
-- Tables
-- ─────────────────────────────────────────────────────────────────────────────
create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  email text not null unique,
  account_role account_role not null default 'business',
  job_title text,
  onboarded boolean not null default false,
  created_at timestamptz not null default now()
);

create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  vat_number text not null unique,
  country text not null default 'IT',
  website text,
  type org_type not null default 'buyer',
  verified boolean not null default false,
  description text,
  created_at timestamptz not null default now()
);

create table memberships (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations (id) on delete cascade,
  user_id uuid not null references profiles (id) on delete cascade,
  role member_role not null default 'member',
  title text,
  status membership_status not null default 'active',
  invited_email text,
  joined_at timestamptz not null default now(),
  unique (org_id, user_id)
);

create table locations (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations (id) on delete cascade,
  name text not null,
  address_line text not null,
  city text not null,
  postal_code text not null,
  country text not null default 'IT',
  lat double precision not null,
  lng double precision not null,
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);

create table material_listings (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  org_id uuid not null references organizations (id) on delete cascade,
  location_id uuid not null references locations (id),
  title text not null,
  description text not null,
  category material_category not null,
  composition jsonb not null default '[]'::jsonb,
  quantity_kg numeric(12, 2) not null check (quantity_kg > 0),
  condition material_condition not null default 'clean',
  purity_pct numeric(5, 2) not null check (purity_pct between 0 and 100),
  price_per_kg numeric(10, 4) not null check (price_per_kg >= 0),
  currency text not null default 'EUR' check (currency = 'EUR'),
  available_from date not null,
  available_until date not null,
  photos jsonb not null default '[]'::jsonb,
  handling text[] not null default '{}',
  packaging text not null,
  min_order_kg numeric(12, 2) not null check (min_order_kg > 0),
  status listing_status not null default 'draft',
  views integer not null default 0,
  created_by uuid references profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (available_until >= available_from),
  check (min_order_kg <= quantity_kg)
);

create table material_requests (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  org_id uuid not null references organizations (id) on delete cascade,
  location_id uuid not null references locations (id),
  title text not null,
  description text not null,
  category material_category not null,
  acceptable_composition text[] not null default '{}',
  min_purity_pct numeric(5, 2) not null default 90 check (min_purity_pct between 0 and 100),
  max_moisture_pct numeric(5, 2) not null default 10 check (max_moisture_pct between 0 and 100),
  max_contamination_pct numeric(5, 2) not null default 2 check (max_contamination_pct between 0 and 100),
  quantity_kg numeric(12, 2) not null check (quantity_kg > 0),
  frequency request_frequency not null default 'one_off',
  max_budget numeric(12, 2) not null check (max_budget > 0),
  required_processing processing_type[] not null default '{}',
  needed_by date not null,
  radius_km integer not null default 250 check (radius_km between 1 and 2000),
  status request_status not null default 'open',
  created_by uuid references profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table matches (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references material_listings (id) on delete cascade,
  request_id uuid not null references material_requests (id) on delete cascade,
  score integer not null check (score between 0 and 100),
  confidence match_confidence not null,
  reasons text[] not null default '{}',
  risks text[] not null default '{}',
  required_processing processing_type[] not null default '{}',
  distance_km integer not null default 0,
  quantity_kg numeric(12, 2) not null,
  breakdown jsonb not null default '{}'::jsonb,
  status match_status not null default 'suggested',
  created_at timestamptz not null default now(),
  unique (request_id, listing_id)
);

create table partners (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  kind partner_kind not null,
  coverage text not null,
  rating numeric(3, 2) not null default 5,
  on_time_pct integer not null default 95 check (on_time_pct between 0 and 100)
);

create table orders (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  buyer_org_id uuid not null references organizations (id),
  supplier_org_id uuid not null references organizations (id),
  listing_id uuid not null references material_listings (id),
  request_id uuid not null references material_requests (id),
  match_id uuid references matches (id),
  quote_id uuid,
  quantity_kg numeric(12, 2) not null check (quantity_kg > 0),
  status order_status not null default 'draft',
  collection jsonb,
  created_by uuid references profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table quotes (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders (id) on delete cascade,
  breakdown jsonb not null,
  valid_until timestamptz not null,
  status quote_status not null default 'issued',
  issued_at timestamptz not null default now(),
  notes text
);

alter table orders
  add constraint orders_quote_fk
  foreign key (quote_id) references quotes (id) on delete set null;

create table order_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders (id) on delete cascade,
  at timestamptz not null default now(),
  label text not null,
  note text,
  actor text not null,
  kind order_event_kind not null default 'system'
);

create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  org_id uuid references organizations (id) on delete cascade,
  title text not null,
  body text not null,
  href text not null,
  tone notification_tone not null default 'info',
  read boolean not null default false,
  created_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Indexes
-- ─────────────────────────────────────────────────────────────────────────────
create index memberships_user_idx on memberships (user_id) where status = 'active';
create index memberships_org_idx on memberships (org_id);
create index locations_org_idx on locations (org_id);
create index listings_org_idx on material_listings (org_id);
create index listings_market_idx on material_listings (category, status);
create index listings_location_idx on material_listings (location_id);
create index requests_org_idx on material_requests (org_id);
create index requests_market_idx on material_requests (category, status);
create index matches_request_idx on matches (request_id);
create index matches_listing_idx on matches (listing_id);
create index matches_score_idx on matches (score desc);
create index orders_buyer_idx on orders (buyer_org_id);
create index orders_supplier_idx on orders (supplier_org_id);
create index orders_status_idx on orders (status);
create index quotes_order_idx on quotes (order_id);
create index order_events_order_idx on order_events (order_id, at);
create index notifications_user_idx on notifications (user_id, read);

-- ─────────────────────────────────────────────────────────────────────────────
-- Utility functions
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger listings_updated_at before update on material_listings
  for each row execute function set_updated_at();
create trigger requests_updated_at before update on material_requests
  for each row execute function set_updated_at();
create trigger orders_updated_at before update on orders
  for each row execute function set_updated_at();

-- Create a profile row for every Supabase Auth user.
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into profiles (id, full_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    new.email
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Membership helpers. SECURITY DEFINER avoids recursive RLS evaluation.
create or replace function is_org_member(target_org uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from memberships
    where org_id = target_org
      and user_id = auth.uid()
      and status = 'active'
  );
$$;

create or replace function has_org_role(target_org uuid, roles member_role[])
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from memberships
    where org_id = target_org
      and user_id = auth.uid()
      and status = 'active'
      and role = any (roles)
  );
$$;

create or replace function can_access_order(target_order uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from orders
    where id = target_order
      and (is_org_member(buyer_org_id) or is_org_member(supplier_org_id))
  );
$$;

create or replace function is_request_visible(target_request uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from material_requests
    where id = target_request
      and (is_org_member(org_id) or status in ('open', 'matched'))
  );
$$;

create or replace function is_listing_visible(target_listing uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from material_listings
    where id = target_listing
      and (is_org_member(org_id) or status in ('active', 'matched'))
  );
$$;

-- Onboarding in one call: organization + owner membership + primary site.
create or replace function create_organization(
  p_name text,
  p_vat_number text,
  p_country text,
  p_type org_type,
  p_address_line text,
  p_city text,
  p_postal_code text,
  p_lat double precision,
  p_lng double precision,
  p_website text default null,
  p_description text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_org uuid;
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'Authentication required';
  end if;
  if length(trim(p_name)) < 2 then
    raise exception 'Company name is too short';
  end if;
  if exists (select 1 from memberships where user_id = uid and status = 'active') then
    raise exception 'This user already belongs to an organization';
  end if;

  insert into organizations (name, vat_number, country, type, website, description)
  values (trim(p_name), upper(trim(p_vat_number)), p_country, p_type, p_website, p_description)
  returning id into new_org;

  insert into memberships (org_id, user_id, role, status)
  values (new_org, uid, 'owner', 'active');

  insert into locations (org_id, name, address_line, city, postal_code, country, lat, lng, is_primary)
  values (
    new_org, p_city || ' site', trim(p_address_line), p_city,
    p_postal_code, p_country, p_lat, p_lng, true
  );

  update profiles set onboarded = true where id = uid;

  return new_org;
end;
$$;

-- Invite a colleague. Creates an invited membership row; the invited user
-- claims it through an edge function or the Supabase Auth invite flow.
create or replace function invite_member(
  p_org uuid,
  p_email text,
  p_role member_role default 'member'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_id uuid;
begin
  if not has_org_role(p_org, array['owner', 'admin']::member_role[]) then
    raise exception 'Only owners and admins can invite members';
  end if;

  insert into memberships (org_id, user_id, role, status, invited_email)
  select p_org, p.id, p_role, 'invited', lower(trim(p_email))
  from profiles p
  where lower(p.email) = lower(trim(p_email))
  limit 1
  returning id into new_id;

  if new_id is null then
    raise exception 'No profile exists for that email yet. Ask them to sign up first.';
  end if;

  return new_id;
end;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- Row Level Security
-- ─────────────────────────────────────────────────────────────────────────────
alter table profiles enable row level security;
alter table organizations enable row level security;
alter table memberships enable row level security;
alter table locations enable row level security;
alter table material_listings enable row level security;
alter table material_requests enable row level security;
alter table matches enable row level security;
alter table partners enable row level security;
alter table orders enable row level security;
alter table quotes enable row level security;
alter table order_events enable row level security;
alter table notifications enable row level security;

-- Profiles
create policy "profiles: read own" on profiles
  for select using (id = auth.uid());
create policy "profiles: update own" on profiles
  for update using (id = auth.uid()) with check (id = auth.uid());
create policy "profiles: insert own" on profiles
  for insert with check (id = auth.uid());

-- Organizations
create policy "organizations: members can read" on organizations
  for select using (is_org_member(id));
create policy "organizations: admins can update" on organizations
  for update using (has_org_role(id, array['owner', 'admin']::member_role[]))
  with check (has_org_role(id, array['owner', 'admin']::member_role[]));
-- Inserts happen through create_organization(); deletes are support-only.

-- Memberships
create policy "memberships: members can read" on memberships
  for select using (is_org_member(org_id));
create policy "memberships: admins can update" on memberships
  for update using (has_org_role(org_id, array['owner', 'admin']::member_role[]));
create policy "memberships: admins can remove" on memberships
  for delete using (has_org_role(org_id, array['owner', 'admin']::member_role[]));
-- Inserts happen through create_organization() and invite_member().

-- Locations: authenticated users can read city-level data for distance and
-- marketplace display; writes are restricted to the owning organization.
create policy "locations: authenticated can read" on locations
  for select to authenticated using (true);
create policy "locations: members can write" on locations
  for insert with check (is_org_member(org_id));
create policy "locations: members can update" on locations
  for update using (is_org_member(org_id)) with check (is_org_member(org_id));
create policy "locations: members can delete" on locations
  for delete using (is_org_member(org_id));

-- Listings: public market sees active/matched supply; owners see everything.
create policy "listings: market or owner can read" on material_listings
  for select using (status in ('active', 'matched') or is_org_member(org_id));
create policy "listings: members can create" on material_listings
  for insert with check (is_org_member(org_id));
create policy "listings: members can update" on material_listings
  for update using (is_org_member(org_id)) with check (is_org_member(org_id));
create policy "listings: members can delete" on material_listings
  for delete using (is_org_member(org_id));

-- Requests: open/matched demand is readable so both sides can see a match.
create policy "requests: market or owner can read" on material_requests
  for select using (status in ('open', 'matched') or is_org_member(org_id));
create policy "requests: members can create" on material_requests
  for insert with check (is_org_member(org_id));
create policy "requests: members can update" on material_requests
  for update using (is_org_member(org_id)) with check (is_org_member(org_id));
create policy "requests: members can delete" on material_requests
  for delete using (is_org_member(org_id));

-- Matches: only the two sides of the match.
create policy "matches: parties can read" on matches
  for select using (is_request_visible(request_id) and is_listing_visible(listing_id));
create policy "matches: parties can update status" on matches
  for update using (is_request_visible(request_id) and is_listing_visible(listing_id));
create policy "matches: parties can create" on matches
  for insert with check (is_request_visible(request_id) and is_listing_visible(listing_id));

-- Partners: read-only directory for authenticated users.
create policy "partners: authenticated can read" on partners
  for select to authenticated using (true);

-- Orders
create policy "orders: parties can read" on orders
  for select using (is_org_member(buyer_org_id) or is_org_member(supplier_org_id));
create policy "orders: parties can create" on orders
  for insert with check (is_org_member(buyer_org_id) or is_org_member(supplier_org_id));
create policy "orders: parties can update" on orders
  for update using (is_org_member(buyer_org_id) or is_org_member(supplier_org_id))
  with check (is_org_member(buyer_org_id) or is_org_member(supplier_org_id));

-- Quotes
create policy "quotes: order parties can read" on quotes
  for select using (can_access_order(order_id));
create policy "quotes: order parties can create" on quotes
  for insert with check (can_access_order(order_id));
create policy "quotes: order parties can update" on quotes
  for update using (can_access_order(order_id)) with check (can_access_order(order_id));

-- Order events
create policy "order_events: parties can read" on order_events
  for select using (can_access_order(order_id));
create policy "order_events: parties can append" on order_events
  for insert with check (can_access_order(order_id));

-- Notifications
create policy "notifications: own can read" on notifications
  for select using (user_id = auth.uid());
create policy "notifications: own can update" on notifications
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "notifications: own can delete" on notifications
  for delete using (user_id = auth.uid());

-- ─────────────────────────────────────────────────────────────────────────────
-- Grants
-- ─────────────────────────────────────────────────────────────────────────────
grant usage on schema public to anon, authenticated;
grant select on partners to authenticated;
grant execute on function create_organization(
  text, text, text, org_type, text, text, text, double precision, double precision, text, text
) to authenticated;
grant execute on function invite_member(uuid, text, member_role) to authenticated;
grant execute on function is_org_member(uuid) to authenticated;
grant execute on function has_org_role(uuid, member_role[]) to authenticated;
grant execute on function can_access_order(uuid) to authenticated;
-- CircularLink · quote requests (lead capture for /preventivo)
-- Apply with: supabase db push   (or paste into the Supabase SQL editor)

create table if not exists public.quote_requests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  intent text not null check (intent in ('have', 'search')),
  material text not null check (char_length(material) between 1 and 80),
  quantity_kg integer not null check (quantity_kg between 1 and 1000000),
  zone text not null check (char_length(zone) between 1 and 80),
  email text not null check (char_length(email) between 3 and 254 and position('@' in email) > 1),
  company text check (company is null or char_length(company) <= 120),
  notes text check (notes is null or char_length(notes) <= 2000),

  locale text not null default 'it' check (locale in ('it', 'en')),
  source text not null default 'website' check (char_length(source) <= 40),
  status text not null default 'new' check (status in ('new', 'contacted', 'quoted', 'won', 'lost', 'spam')),

  email_sent boolean not null default false,
  email_error text check (email_error is null or char_length(email_error) <= 500),

  user_agent text check (user_agent is null or char_length(user_agent) <= 500),
  referrer text check (referrer is null or char_length(referrer) <= 500),
  client_request_id text check (client_request_id is null or char_length(client_request_id) <= 64)
);

comment on table public.quote_requests is 'Inbound quote requests from the public /preventivo form. Written by the server-side API route only.';

create index if not exists quote_requests_created_at_idx
  on public.quote_requests (created_at desc);

create index if not exists quote_requests_status_idx
  on public.quote_requests (status, created_at desc);

alter table public.quote_requests enable row level security;

-- Public form: anonymous visitors may only INSERT a new request.
-- No SELECT / UPDATE / DELETE policies exist for anon or authenticated:
-- reads happen from the Supabase dashboard or a service-role backend.
drop policy if exists "quote_requests: public insert" on public.quote_requests;
create policy "quote_requests: public insert"
  on public.quote_requests
  for insert
  to anon, authenticated
  with check (true);

grant insert on public.quote_requests to anon, authenticated;
revoke select, update, delete on public.quote_requests from anon, authenticated;
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
