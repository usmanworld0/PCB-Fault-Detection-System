-- ============================================================
-- PCB-Vision: Add PCB Unique ID + Image Index to inspections
-- Run this migration in your Supabase SQL Editor
-- ============================================================

-- 1. Add pcb_id column (user-entered unique identifier for each physical PCB board)
ALTER TABLE inspections
  ADD COLUMN IF NOT EXISTS pcb_id TEXT;

-- 2. Add image_index column (sub-image number within a PCB inspection session)
--    e.g. PCB-2026-A001 may have images 1, 2, 3... each saved as separate inspection rows
ALTER TABLE inspections
  ADD COLUMN IF NOT EXISTS image_index INTEGER NOT NULL DEFAULT 1;

-- 3. Create index on pcb_id for fast lookups of all images belonging to one PCB
CREATE INDEX IF NOT EXISTS idx_inspections_pcb_id ON inspections (pcb_id);

-- 4. Create composite index for PCB + image ordering
CREATE INDEX IF NOT EXISTS idx_inspections_pcb_image ON inspections (pcb_id, image_index);

-- 5. Update the reports table to ensure summary_json column exists
ALTER TABLE reports
  ADD COLUMN IF NOT EXISTS summary_json JSONB;

-- 6. Verify the changes
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'inspections'
  AND column_name IN ('pcb_id', 'image_index')
ORDER BY column_name;
