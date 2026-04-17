-- Add address fields to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS address_lat NUMERIC,
  ADD COLUMN IF NOT EXISTS address_lng NUMERIC;

-- Zones (geographic service areas)
CREATE TABLE public.zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  city TEXT,
  -- Simple bounding box for assignment (min/max lat/lng)
  min_lat NUMERIC NOT NULL,
  max_lat NUMERIC NOT NULL,
  min_lng NUMERIC NOT NULL,
  max_lng NUMERIC NOT NULL,
  center_lat NUMERIC NOT NULL,
  center_lng NUMERIC NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Vehicles
CREATE TABLE public.vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_code TEXT NOT NULL UNIQUE, -- e.g. GV-01
  driver_name TEXT,
  zone_id UUID NOT NULL REFERENCES public.zones(id) ON DELETE CASCADE,
  depot_lat NUMERIC NOT NULL,
  depot_lng NUMERIC NOT NULL,
  -- Daily start time (HH:MM, local 24h)
  start_time TIME NOT NULL DEFAULT '08:00',
  avg_speed_kmh NUMERIC NOT NULL DEFAULT 25,
  status TEXT NOT NULL DEFAULT 'active', -- active | maintenance
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Route waypoints (ordered stops along a vehicle's daily route)
CREATE TABLE public.vehicle_route_stops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  stop_order INT NOT NULL,
  stop_name TEXT,
  lat NUMERIC NOT NULL,
  lng NUMERIC NOT NULL,
  UNIQUE(vehicle_id, stop_order)
);

CREATE INDEX idx_vehicle_route_stops_vehicle ON public.vehicle_route_stops(vehicle_id, stop_order);
CREATE INDEX idx_vehicles_zone ON public.vehicles(zone_id);

-- RLS: read-only for everyone (public reference data)
ALTER TABLE public.zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_route_stops ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view zones" ON public.zones FOR SELECT USING (true);
CREATE POLICY "Anyone can view vehicles" ON public.vehicles FOR SELECT USING (true);
CREATE POLICY "Anyone can view route stops" ON public.vehicle_route_stops FOR SELECT USING (true);

-- Seed: 3 zones in Bangalore + 3 vehicles with realistic routes
INSERT INTO public.zones (id, name, city, min_lat, max_lat, min_lng, max_lng, center_lat, center_lng) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Koramangala', 'Bangalore', 12.920, 12.955, 77.610, 77.645, 12.9352, 77.6245),
  ('22222222-2222-2222-2222-222222222222', 'Indiranagar', 'Bangalore', 12.960, 12.985, 77.630, 77.660, 12.9716, 77.6412),
  ('33333333-3333-3333-3333-333333333333', 'HSR Layout', 'Bangalore', 12.895, 12.925, 77.635, 77.670, 12.9116, 77.6473);

INSERT INTO public.vehicles (id, vehicle_code, driver_name, zone_id, depot_lat, depot_lng, start_time, avg_speed_kmh) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'GV-01', 'Ravi Kumar', '11111111-1111-1111-1111-111111111111', 12.9250, 77.6150, '08:00', 22),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', 'GV-02', 'Suresh M',   '22222222-2222-2222-2222-222222222222', 12.9650, 77.6350, '08:30', 25),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3', 'GV-03', 'Anil P',     '33333333-3333-3333-3333-333333333333', 12.9000, 77.6400, '07:30', 20);

-- Route stops for GV-01 (Koramangala loop)
INSERT INTO public.vehicle_route_stops (vehicle_id, stop_order, stop_name, lat, lng) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 1, 'Depot',           12.9250, 77.6150),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 2, '1st Block',       12.9300, 77.6200),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 3, '4th Block',       12.9352, 77.6245),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 4, '5th Block',       12.9380, 77.6280),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 5, '6th Block',       12.9420, 77.6310),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 6, '7th Block',       12.9450, 77.6340),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 7, 'BDA Complex',     12.9500, 77.6380);

-- Route stops for GV-02 (Indiranagar)
INSERT INTO public.vehicle_route_stops (vehicle_id, stop_order, stop_name, lat, lng) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', 1, 'Depot',           12.9650, 77.6350),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', 2, 'CMH Road',        12.9680, 77.6380),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', 3, '100ft Road',      12.9716, 77.6412),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', 4, 'Defence Colony',  12.9750, 77.6450),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', 5, 'HAL 2nd Stage',   12.9790, 77.6500),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', 6, 'Old Madras Rd',   12.9820, 77.6550);

-- Route stops for GV-03 (HSR)
INSERT INTO public.vehicle_route_stops (vehicle_id, stop_order, stop_name, lat, lng) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3', 1, 'Depot',           12.9000, 77.6400),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3', 2, 'Sector 1',        12.9050, 77.6420),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3', 3, 'Sector 3',        12.9116, 77.6473),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3', 4, 'Sector 6',        12.9170, 77.6520),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3', 5, 'Agara Lake',      12.9220, 77.6580),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3', 6, 'BDA Complex',     12.9250, 77.6630);
