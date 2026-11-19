-- ==============================================================================
-- Migration: Add pet_links column to customers table
-- Purpose: Store unique permanent Lost & Found landing page URLs for each pet
-- ==============================================================================

-- 1. Add pet_links JSONB column if it does not exist
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS pet_links JSONB DEFAULT '{}'::jsonb;

-- 2. Add comment explaining the column
COMMENT ON COLUMN customers.pet_links IS 'Maps each pet ID/name to its unique permanent Lost & Found QR landing page URL';

-- 3. Ensure customers table allows reading by ID/phone for public Lost & Found tag scanning
-- (If RLS is enabled on customers table, ensure public anon select is permitted)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'customers' AND policyname = 'Public read for lost and found tag lookup'
  ) THEN
    -- Allow public read of customer info for lost & found QR tag scanning
    CREATE POLICY "Public read for lost and found tag lookup" 
    ON customers FOR SELECT 
    USING (true);
  END IF;
EXCEPTION
  WHEN undefined_object THEN NULL;
  WHEN others THEN NULL;
END $$;
