-- One-time: copy inline work permit columns on employees into work_permit and wire work_permit_id.
-- Prerequisites: epms-employee-compensation-compliance-migration.sql (creates work_permit + work_permit_id on employees).
-- Run only while employees.work_permit_no (or the date columns) still exist.

ALTER TABLE work_permit ADD COLUMN IF NOT EXISTS _mig_employee_id BIGINT NULL UNIQUE;

INSERT INTO work_permit (work_permit_no, work_permit_valid_date, work_permit_expire_date, _mig_employee_id)
SELECT e.work_permit_no, e.work_permit_valid_date, e.work_permit_expire_date, e.id
FROM employees e
WHERE (e.work_permit_no IS NOT NULL AND TRIM(e.work_permit_no) <> '')
   OR e.work_permit_valid_date IS NOT NULL
   OR e.work_permit_expire_date IS NOT NULL;

UPDATE employees e
INNER JOIN work_permit w ON w._mig_employee_id = e.id
SET e.work_permit_id = w.id
WHERE e.work_permit_id IS NULL;

ALTER TABLE work_permit DROP COLUMN IF EXISTS _mig_employee_id;

ALTER TABLE employees
  DROP COLUMN IF EXISTS work_permit_no,
  DROP COLUMN IF EXISTS work_permit_valid_date,
  DROP COLUMN IF EXISTS work_permit_expire_date;
