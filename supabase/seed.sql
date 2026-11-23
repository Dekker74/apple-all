-- CircularLink · demo seed for Supabase
-- Run after the initial migration. Idempotent: safe to re-run.
--
-- Demo accounts are created through Supabase Auth (email/password):
--   elena.ricci@northwind.demo   (buyer, Northwind Packaging)
--   marco.bianchi@greenloop.demo (supplier, GreenLoop Fibres)
-- After both users exist, the linking block at the bottom attaches them to
-- the seeded organizations. Sign in once with each account first, or insert
-- the users from the dashboard, then re-run this file.

-- ── Organizations ────────────────────────────────────────────────────────────
insert into organizations (id, name, vat_number, country, website, type, verified, description)
values
  (
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'Northwind Packaging S.p.A.',
    'IT04829170159',
    'IT',
    'northwind-packaging.demo',
    'buyer',
    true,
    'Corrugated converter and food-packaging manufacturer. Replacing virgin fibre and polymer in trays, cases and protective packaging.'
  ),
  (
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    'GreenLoop Fibres S.r.l.',
    'IT03918420372',
    'IT',
    'greenloop-fibres.demo',
    'both',
    true,
    'Recovery and upgrading of paper, wood and plastic streams across Emilia-Romagna and Veneto.'
  )
on conflict (id) do nothing;

-- ── Locations ────────────────────────────────────────────────────────────────
insert into locations (id, org_id, name, address_line, city, postal_code, country, lat, lng, is_primary)
values
  (
    'aaaaaaaa-0000-4000-8000-000000000001',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'Milan plant',
    'Via Savona 42',
    'Milan',
    '20144',
    'IT',
    45.4642,
    9.19,
    true
  ),
  (
    'aaaaaaaa-0000-4000-8000-000000000002',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'Verona converting line',
    'Via dell''Industria 18',
    'Verona',
    '37135',
    'IT',
    45.4384,
    10.9916,
    false
  ),
  (
    'bbbbbbbb-0000-4000-8000-000000000001',
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    'Bologna recovery hub',
    'Via del Frullo 9',
    'Bologna',
    '40138',
    'IT',
    44.4949,
    11.3426,
    true
  )
on conflict (id) do nothing;

-- ── Partners ─────────────────────────────────────────────────────────────────
insert into partners (id, name, kind, coverage, rating, on_time_pct)
values
  ('cccccccc-0000-4000-8000-000000000001', 'TransItalia Logistics', 'transport', 'Northern & Central Italy', 4.70, 96),
  ('cccccccc-0000-4000-8000-000000000002', 'Alpine Freight', 'transport', 'IT / AT / DE corridor', 4.50, 93),
  ('cccccccc-0000-4000-8000-000000000003', 'RePlast Hub Emilia', 'processing', 'Emilia-Romagna · polymers', 4.80, 97),
  ('cccccccc-0000-4000-8000-000000000004', 'Cartiera di Verona', 'processing', 'Veneto · fibre', 4.60, 95),
  ('cccccccc-0000-4000-8000-000000000005', 'LegnoCircolare', 'processing', 'Lombardy · wood', 4.40, 92),
  ('cccccccc-0000-4000-8000-000000000006', 'Bureau Veritas Circular', 'qc', 'EU-wide sampling', 4.90, 99),
  ('cccccccc-0000-4000-8000-000000000007', 'SGS Materials', 'qc', 'Italy · materials lab', 4.70, 97)
on conflict (id) do nothing;

-- ── Supply ───────────────────────────────────────────────────────────────────
insert into material_listings (
  id, reference, org_id, location_id, title, description, category, composition,
  quantity_kg, condition, purity_pct, price_per_kg, available_from, available_until,
  photos, handling, packaging, min_order_kg, status, views
)
values
  (
    'bbbbbbbb-0000-4000-8000-000000000101',
    'LST-2026-0311',
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    'bbbbbbbb-0000-4000-8000-000000000001',
    'Kraft OCC offcuts 90/10, baled',
    'Clean kraft corrugated offcuts from a box plant. Dry, free of wax, laminate and food residue. Suitable for recycled containerboard and moulded fibre. Bales are strapped and stored indoors.',
    'paper_cardboard',
    '[{"material":"OCC kraft","percent":90},{"material":"Mixed board","percent":10}]'::jsonb,
    18500, 'clean', 96.00, 0.1100, current_date, current_date + 45,
    '[]'::jsonb,
    array['Baled', 'Indoor storage', 'Loading dock available', 'Hazard-free declaration'],
    'Bales ~650 kg', 5000, 'active', 84
  ),
  (
    'bbbbbbbb-0000-4000-8000-000000000102',
    'LST-2026-0308',
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    'bbbbbbbb-0000-4000-8000-000000000001',
    'Washed rPET flake, food-contact grade',
    'Post-consumer PET bottles, sorted by colour, washed and flake-screened. Food-contact declaration available. IV suitable for tray extrusion when re-pelletized.',
    'plastic',
    '[{"material":"rPET clear","percent":94},{"material":"rPET coloured","percent":6}]'::jsonb,
    6400, 'clean', 98.00, 0.7750, current_date, current_date + 30,
    '[]'::jsonb,
    array['Palletized', 'Shrink-wrapped', 'Indoor storage', 'Hazard-free declaration'],
    'Octabins ~1,100 kg', 2000, 'active', 137
  ),
  (
    'bbbbbbbb-0000-4000-8000-000000000103',
    'LST-2026-0297',
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    'bbbbbbbb-0000-4000-8000-000000000001',
    'Kiln-dried oak offcuts, untreated',
    'Untreated oak offcuts from furniture production. Kiln-dried to 10–12% moisture, no glue, paint or fixings. Suitable for pallet blocks, briquettes or panel cores.',
    'wood',
    '[{"material":"Oak","percent":97},{"material":"Mixed hardwood","percent":3}]'::jsonb,
    9200, 'clean', 95.00, 0.0650, current_date, current_date + 60,
    '[]'::jsonb,
    array['Loose / bulk', 'Palletized', 'Forklift on site', 'Hazard-free declaration'],
    'Loose in 40 m³ walking floor', 4000, 'active', 61
  ),
  (
    'bbbbbbbb-0000-4000-8000-000000000104',
    'LST-2026-0303',
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    'bbbbbbbb-0000-4000-8000-000000000001',
    'LDPE stretch film, post-industrial',
    'Post-industrial stretch and shrink film from distribution centres. Light contamination, sortable. Requires washing and regranulation before blown-film use.',
    'plastic',
    '[{"material":"LDPE film","percent":92},{"material":"Labels / tape","percent":8}]'::jsonb,
    11200, 'needs_processing', 91.00, 0.2450, current_date, current_date + 40,
    '[]'::jsonb,
    array['Baled', 'Loose / bulk', 'Loading dock available'],
    'Bales ~480 kg', 3000, 'active', 49
  )
on conflict (id) do nothing;

-- ── Demand ───────────────────────────────────────────────────────────────────
insert into material_requests (
  id, reference, org_id, location_id, title, description, category,
  acceptable_composition, min_purity_pct, max_moisture_pct, max_contamination_pct,
  quantity_kg, frequency, max_budget, required_processing, needed_by, radius_km, status
)
values
  (
    'aaaaaaaa-0000-4000-8000-000000000201',
    'REQ-2026-0188',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'aaaaaaaa-0000-4000-8000-000000000001',
    'Recycled containerboard furnish — OCC kraft',
    'Replacing virgin kraft in a corrugated case line. Needs clean OCC with low moisture and no wax or laminate. Monthly recurring volume.',
    'paper_cardboard',
    array['OCC kraft', 'Mixed board', 'Kraft offcuts'],
    94.00, 10.00, 1.50,
    18000, 'monthly', 4800.00, array['sorting']::processing_type[],
    current_date + 21, 300, 'open'
  ),
  (
    'aaaaaaaa-0000-4000-8000-000000000202',
    'REQ-2026-0191',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'aaaaaaaa-0000-4000-8000-000000000001',
    'Food-grade rPET flake for tray extrusion',
    'Replacing virgin PET in thermoformed food trays. Food-contact compliance and traceability required. Flake or pellet accepted if IV is declared.',
    'plastic',
    array['rPET flake', 'rPET pellet', 'PET clear'],
    97.00, 1.00, 0.50,
    6000, 'monthly', 7800.00, array['washing', 'pelletizing']::processing_type[],
    current_date + 14, 250, 'open'
  ),
  (
    'aaaaaaaa-0000-4000-8000-000000000203',
    'REQ-2026-0184',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'aaaaaaaa-0000-4000-8000-000000000002',
    'Untreated hardwood for pallet blocks',
    'Pallet block production. Untreated hardwood only, kiln-dried below 14% moisture, metal-free. One-off trial volume with a recurring option.',
    'wood',
    array['Oak', 'Mixed hardwood', 'Beech'],
    92.00, 14.00, 2.00,
    8000, 'one_off', 2600.00, array['sorting', 'drying']::processing_type[],
    current_date + 30, 350, 'open'
  )
on conflict (id) do nothing;

-- ── Link demo profiles to seeded organizations ───────────────────────────────
-- Runs only when the Auth users (and therefore profiles) already exist.
insert into memberships (org_id, user_id, role, status)
select 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', p.id, 'owner', 'active'
from profiles p
where lower(p.email) = 'elena.ricci@northwind.demo'
on conflict (org_id, user_id) do nothing;

insert into memberships (org_id, user_id, role, status)
select 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', p.id, 'owner', 'active'
from profiles p
where lower(p.email) = 'marco.bianchi@greenloop.demo'
on conflict (org_id, user_id) do nothing;

update profiles
set onboarded = true
where lower(email) in ('elena.ricci@northwind.demo', 'marco.bianchi@greenloop.demo');

update memberships m
set role = 'owner', status = 'active'
where m.org_id in (
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
)
and m.user_id in (
  select id from profiles
  where lower(email) in ('elena.ricci@northwind.demo', 'marco.bianchi@greenloop.demo')
);
