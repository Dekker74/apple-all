-- Allow buyers to request weekly recurring deliveries.
-- Safe to re-run: ADD VALUE IF NOT EXISTS is supported on PostgreSQL 9.6+.
alter type request_frequency add value if not exists 'weekly';
