-- Premium Body Map enhancement
-- Adds quadrant and clock_position for detailed data input
-- Safe to run multiple times (if not exists)

alter table public.ba_body_map_markers
  add column if not exists quadrant text not null default '';

alter table public.ba_body_map_markers
  add column if not exists clock_position text not null default '';

create index if not exists idx_ba_markers_quadrant on public.ba_body_map_markers (quadrant);
create index if not exists idx_ba_markers_clock on public.ba_body_map_markers (clock_position);
