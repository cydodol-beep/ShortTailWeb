-- ==============================================================================
-- Migration: Add pet_gps_settings column & ensure pets JSONB schema compatibility
-- Purpose: Support per-pet One-Time GPS Location Sharing preferences for customers
-- Date: 2026-11-10
-- ==============================================================================

-- 1. Ensure `pets` column exists as JSONB in customers table (where each pet object stores enable_gps_sharing: true/false)
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS pets JSONB DEFAULT '[]'::jsonb;

-- 2. Optional: Add a dedicated `pet_gps_settings` JSONB lookup column
-- Maps pet_id or tag_number directly to boolean (e.g. {"pet_1_boss": true, "tag_1": true})
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS pet_gps_settings JSONB DEFAULT '{}'::jsonb;

-- 3. Document the columns for database maintainability
COMMENT ON COLUMN customers.pets IS 'List of customer pets with photos, medical notes, custom WA templates, and enable_gps_sharing toggle status';
COMMENT ON COLUMN customers.pet_gps_settings IS 'Key-value map of pet ID or tag number to GPS sharing toggle (true = One-Time GPS active, false = disabled)';

-- 4. Fast JSONB index to quickly query pets with active GPS sharing enabled
CREATE INDEX IF NOT EXISTS idx_customers_pets_gps 
ON customers USING gin (pets);

-- 5. Helper function: check if a customer pet has GPS sharing active by tag number
CREATE OR REPLACE FUNCTION public.check_pet_gps_enabled(customer_phone TEXT, pet_tag_num INT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(
    (
      SELECT (elem->>'enable_gps_sharing')::boolean
      FROM customers c,
      LATERAL jsonb_array_elements(c.pets) AS elem
      WHERE c.phone = customer_phone
        AND (elem->>'tag_number')::int = pet_tag_num
      LIMIT 1
    ),
    false
  );
$$;
