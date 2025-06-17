create table plant_locations (
  id bigint primary key generated always as identity,
  latitude double precision not null,
  longitude double precision not null,
  species text not null,
  description text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
); 