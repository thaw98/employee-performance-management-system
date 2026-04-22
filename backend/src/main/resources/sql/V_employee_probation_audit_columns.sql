-- =============================================================
-- Migration: Add audit columns to employee_probation table
-- Date: 2026-04-22
-- =============================================================

-- Add audit columns if they don't already exist
ALTER TABLE employee_probation
    ADD COLUMN IF NOT EXISTS created_on DATETIME NULL,
    ADD COLUMN IF NOT EXISTS created_by BIGINT NULL,
    ADD COLUMN IF NOT EXISTS updated_on DATETIME NULL,
    ADD COLUMN IF NOT EXISTS updated_by BIGINT NULL;

-- Backfill existing rows with safe defaults
UPDATE employee_probation
SET created_on = NOW(),
    created_by = NULL
WHERE created_on IS NULL;
