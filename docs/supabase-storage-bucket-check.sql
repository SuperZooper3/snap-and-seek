-- Storage bucket: ensure anon cannot list objects (no index of files).
-- Bucket snap-and-seek-image stays public so direct object URLs still work.
-- Run in Supabase SQL Editor.

-- Step 1: Inspect existing policies (run first)
-- Policies on storage.objects (list/read/upload/delete are controlled here)
SELECT policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'storage' AND tablename = 'objects';

-- Bucket metadata (id = bucket name for storage.objects.bucket_id)
SELECT id, name, public
FROM storage.buckets
WHERE name = 'snap-and-seek-image';

-- How to interpret:
-- - If NO rows from the first query: anon has no explicit access. With default RLS, anon cannot
--   list objects. The app uses the service role (bypasses RLS). No further action required.
-- - If there ARE policies and any has cmd = 'SELECT' and roles includes anon/public: that policy
--   can allow listing. Drop it so anon cannot list (see Step 2).

-- Step 2: Only if a policy allows anon SELECT — drop it (replace policy_name_here with actual name)
-- DROP POLICY IF EXISTS "policy_name_here" ON storage.objects;

-- We do not create any policy that grants anon or authenticated SELECT on storage.objects for
-- snap-and-seek-image, so listing via the Storage API remains disabled. Service role is used
-- for uploads and for generating public URLs; direct file URLs remain valid because the bucket
-- is public.
