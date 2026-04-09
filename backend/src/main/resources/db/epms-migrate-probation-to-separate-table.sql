-- Run once on databases that still have probation columns on employees.
-- Migrates data into employee_probation then drops the old columns.

CREATE TABLE IF NOT EXISTS employee_probation (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  employee_id BIGINT NOT NULL UNIQUE,
  probation_month INT NULL,
  probation_start_date DATE NULL,
  probation_end_date DATE NULL,
  CONSTRAINT fk_employee_probation_employee FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

INSERT INTO employee_probation (employee_id, probation_month, probation_start_date, probation_end_date)
SELECT e.id, e.probation_month, e.probation_start_date, e.probation_end_date
FROM employees e
WHERE (e.probation_month IS NOT NULL
   OR e.probation_start_date IS NOT NULL
   OR e.probation_end_date IS NOT NULL)
  AND NOT EXISTS (SELECT 1 FROM employee_probation p WHERE p.employee_id = e.id);

ALTER TABLE employees DROP COLUMN probation_month;
ALTER TABLE employees DROP COLUMN probation_start_date;
ALTER TABLE employees DROP COLUMN probation_end_date;
