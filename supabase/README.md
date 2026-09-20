# Supabase Migrations

This folder contains versioned SQL migrations for BreastAware.

- `20260919_init.sql` — full initial schema (10 user tables + RLS + indexes + education)
- `20260920_visit_readiness.sql` — adds `ba_visit_readiness` table for Visit Readiness feature
- `20260921_body_map_premium.sql` — adds `quadrant` and `clock_position` columns to `ba_body_map_markers`

To apply on a fresh project:
1. Create new Supabase project
2. Run `20260919_init.sql` in SQL Editor
3. Run `20260920_visit_readiness.sql`
4. Run `20260921_body_map_premium.sql`
5. Verify with `step-3b-verify.sql` (optional)

For existing project, run only new migrations.

All tables have RLS owner-only policies (auth.uid() = user_id).
