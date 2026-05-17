-- =============================================================
-- Migration: Add PIP signature columns
-- Date: 2026-05-17
-- =============================================================

ALTER TABLE performance_improvement_plan
    ADD COLUMN IF NOT EXISTS employee_signature LONGTEXT NULL,
    ADD COLUMN IF NOT EXISTS employee_signature_date DATETIME(6) NULL,
    ADD COLUMN IF NOT EXISTS manager_signature LONGTEXT NULL,
    ADD COLUMN IF NOT EXISTS manager_signature_date DATETIME(6) NULL;
