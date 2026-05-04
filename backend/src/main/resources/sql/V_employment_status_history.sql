-- =============================================================
-- Migration: Add employment status history
-- Date: 2026-04-29
-- =============================================================

CREATE TABLE IF NOT EXISTS employment_status_history (
    id BIGINT NOT NULL AUTO_INCREMENT,
    employee_id BIGINT NOT NULL,
    previous_status VARCHAR(20) NULL,
    new_status VARCHAR(20) NOT NULL,
    effective_date DATE NOT NULL,
    changed_by_user_id BIGINT NULL,
    changed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reason VARCHAR(255) NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_esh_employee FOREIGN KEY (employee_id) REFERENCES employee(employee_id),
    INDEX idx_esh_employee_id (employee_id),
    INDEX idx_esh_effective_date (effective_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

ALTER TABLE employee
    ADD COLUMN IF NOT EXISTS status_effective_from DATE NULL,
    ADD COLUMN IF NOT EXISTS employment_status_reason VARCHAR(255) NULL;
