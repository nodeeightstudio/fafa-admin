-- Migration: Setup Supabase Storage for Resources (Refined)
-- Description: Creates the 'fafa-resources' bucket and configures RLS policies.
-- Note: If you get an ownership error on 'storage.objects', try running only the bucket insertion.

-- 1. Create the bucket (Safe to run multiple times)
INSERT INTO storage.buckets (id, name, public)
VALUES ('fafa-resources', 'fafa-resources', true)
ON CONFLICT (id) DO NOTHING;

-- 2. DROP existing policies to avoid conflicts
-- Supabase SQL editor usually allows dropping/creating policies on storage.objects
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Admin Upload" ON storage.objects;
DROP POLICY IF EXISTS "Admin Update" ON storage.objects;
DROP POLICY IF EXISTS "Admin Delete" ON storage.objects;

-- 3. Create Public Read Policy
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'fafa-resources');

-- 4. Create Admin Management Policies
CREATE POLICY "Admin Upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'fafa-resources' AND
  (SELECT 1 FROM public.admins WHERE id = auth.uid()) IS NOT NULL
);

CREATE POLICY "Admin Update"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'fafa-resources' AND
  (SELECT 1 FROM public.admins WHERE id = auth.uid()) IS NOT NULL
);

CREATE POLICY "Admin Delete"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'fafa-resources' AND
  (SELECT 1 FROM public.admins WHERE id = auth.uid()) IS NOT NULL
);