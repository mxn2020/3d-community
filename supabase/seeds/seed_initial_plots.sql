-- Add database seed script to create initial plots in the community

-- supabase/seeds/seed_initial_plots.sql
-- Seed script to create initial plots for the community

-- Clear existing plots first (be careful with this in production)
-- TRUNCATE public.plots;

-- Insert available plots with varied positions
INSERT INTO public.plots (name, position, created_at, updated_at)
VALUES
  ('Central Plot 1', '{"x": 5, "y": 0, "z": 5}', now(), now()),
  ('Central Plot 2', '{"x": -5, "y": 0, "z": -5}', now(), now()),
  ('Corner Plot 1', '{"x": 10, "y": 0, "z": 10}', now(), now()),
  ('Corner Plot 2', '{"x": -10, "y": 0, "z": -10}', now(), now()),
  ('Corner Plot 3', '{"x": 10, "y": 0, "z": -10}', now(), now()),
  ('Corner Plot 4', '{"x": -10, "y": 0, "z": 10}', now(), now()),
  ('East Plot 1', '{"x": 15, "y": 0, "z": 0}', now(), now()),
  ('West Plot 1', '{"x": -15, "y": 0, "z": 0}', now(), now()),
  ('North Plot 1', '{"x": 0, "y": 0, "z": 15}', now(), now()),
  ('South Plot 1', '{"x": 0, "y": 0, "z": -15}', now(), now()),
  ('Northeast Plot 1', '{"x": 15, "y": 0, "z": 15}', now(), now()),
  ('Northwest Plot 1', '{"x": -15, "y": 0, "z": 15}', now(), now()),
  ('Southeast Plot 1', '{"x": 15, "y": 0, "z": -15}', now(), now()),
  ('Southwest Plot 1', '{"x": -15, "y": 0, "z": -15}', now(), now()),
  ('Premium Plot 1', '{"x": 8, "y": 0, "z": -8}', now(), now()),
  ('Premium Plot 2', '{"x": -8, "y": 0, "z": 8}', now(), now());

-- Create integration with user profile to set up proper hooks

