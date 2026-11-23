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
