-- ============================================
-- Migration: Add metode field to absensi table
-- Date: 2025-12-02
-- Purpose: Support face recognition device tracking
-- ============================================

USE absensi_kampus;

-- Add metode column to absensi table if not exists
ALTER TABLE absensi 
ADD COLUMN IF NOT EXISTS metode ENUM('face_recognition_device', 'webcam', 'manual') 
NOT NULL DEFAULT 'webcam' 
AFTER status;

-- Update existing records to have default metode
UPDATE absensi SET metode = 'webcam' WHERE metode IS NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_metode ON absensi(metode);

-- Success message
SELECT 'Migration completed: metode field added to absensi table' AS status;
