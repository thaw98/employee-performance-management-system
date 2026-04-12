-- Compensation, compliance, currency, work permit, and tax: new tables + employees columns.
-- Intended for MySQL 8+ / MariaDB 10.5+ (uses IF NOT EXISTS on ADD COLUMN where supported).
-- Run once. If a step fails because an object already exists, skip that step or adjust manually.
--
-- Summary:
--   currencies, employee_compliance, work_permit, employee_tax (new tables)
--   employees: FK columns + pay/cost/SSB/ACE phone/pay_by_backlog + dates
--   Optional: move legacy employees.work_permit_* into work_permit and drop those columns

-- ---------------------------------------------------------------------------
-- 1) New tables
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS currencies (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(10) NOT NULL,
  name VARCHAR(100) NOT NULL,
  symbol VARCHAR(10) NULL,
  UNIQUE KEY uq_currencies_code (code)
);

CREATE TABLE IF NOT EXISTS employee_compliance (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  compliance_earned_points INT NULL,
  compliance_balance_points INT NULL
);

CREATE TABLE IF NOT EXISTS work_permit (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  work_permit_no VARCHAR(100) NULL,
  work_permit_valid_date DATE NULL,
  work_permit_expire_date DATE NULL
);

CREATE TABLE IF NOT EXISTS employee_tax (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  tax_status VARCHAR(100) NULL,
  tax_no VARCHAR(100) NULL
);

-- ---------------------------------------------------------------------------
-- 2) employees: new columns (foreign keys + scalars)
-- ---------------------------------------------------------------------------

ALTER TABLE employees
  ADD COLUMN IF NOT EXISTS employee_compliance_id BIGINT NULL,
  ADD COLUMN IF NOT EXISTS currency_id BIGINT NULL,
  ADD COLUMN IF NOT EXISTS work_permit_id BIGINT NULL,
  ADD COLUMN IF NOT EXISTS employee_tax_id BIGINT NULL,
  ADD COLUMN IF NOT EXISTS cost_allocate VARCHAR(200) NULL,
  ADD COLUMN IF NOT EXISTS pay_type VARCHAR(100) NULL,
  ADD COLUMN IF NOT EXISTS salary DECIMAL(14, 2) NULL,
  ADD COLUMN IF NOT EXISTS date_of_pay_type_changed DATE NULL,
  ADD COLUMN IF NOT EXISTS date_of_currency_change DATE NULL,
  ADD COLUMN IF NOT EXISTS ssb_status VARCHAR(100) NULL,
  ADD COLUMN IF NOT EXISTS ssb_no VARCHAR(100) NULL,
  ADD COLUMN IF NOT EXISTS ace_internal_phone_no VARCHAR(30) NULL,
  ADD COLUMN IF NOT EXISTS pay_by_backlog TINYINT(1) NOT NULL DEFAULT 0;

-- Ensure contact / attendance columns exist (already present on greenfield onboarding DDL)
ALTER TABLE employees
  ADD COLUMN IF NOT EXISTS labour_registration_no VARCHAR(100) NULL,
  ADD COLUMN IF NOT EXISTS permanent_phone_no VARCHAR(20) NULL,
  ADD COLUMN IF NOT EXISTS present_phone_no VARCHAR(20) NULL,
  ADD COLUMN IF NOT EXISTS product_project VARCHAR(200) NULL,
  ADD COLUMN IF NOT EXISTS mobile_attendance VARCHAR(50) NULL,
  ADD COLUMN IF NOT EXISTS fingerprint VARCHAR(100) NULL;

-- ---------------------------------------------------------------------------
-- 3) Foreign keys on employees (omit any line that already exists)
-- ---------------------------------------------------------------------------

ALTER TABLE employees
  ADD CONSTRAINT fk_employees_currency FOREIGN KEY (currency_id) REFERENCES currencies (id),
  ADD CONSTRAINT fk_employees_work_permit FOREIGN KEY (work_permit_id) REFERENCES work_permit (id),
  ADD CONSTRAINT fk_employees_employee_compliance FOREIGN KEY (employee_compliance_id) REFERENCES employee_compliance (id),
  ADD CONSTRAINT fk_employees_employee_tax FOREIGN KEY (employee_tax_id) REFERENCES employee_tax (id);

-- ---------------------------------------------------------------------------
-- 4) If employees still stores work_permit_no / work_permit_valid_date /
--    work_permit_expire_date inline, run once: epms-employee-work-permit-denormalized-to-table.sql
-- ---------------------------------------------------------------------------
