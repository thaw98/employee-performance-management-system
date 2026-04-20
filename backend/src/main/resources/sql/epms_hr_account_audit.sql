-- EPMS: HR create-account + audit (reference script for epms_db)
-- Hibernate `ddl-auto=update` and `AuditAndUserAccountSchemaMigrationInitializer` also apply these at runtime.

USE epms_db;

-- user_account: first-login flag (if missing)
-- ALTER TABLE user_account ADD COLUMN must_change_password TINYINT(1) NOT NULL DEFAULT 1;

-- Employee profile columns used by HR flow (if missing — Hibernate may add these)
-- ALTER TABLE employee MODIFY COLUMN full_name VARCHAR(50) NOT NULL;
-- ALTER TABLE employee MODIFY COLUMN email VARCHAR(255) NULL;
-- ALTER TABLE employee MODIFY COLUMN staff_no VARCHAR(50) NULL;
-- ALTER TABLE employee ADD COLUMN date_of_birth DATE NULL;
-- ALTER TABLE employee ADD COLUMN phone_number VARCHAR(20) NULL;
-- ALTER TABLE employee ADD COLUMN address TEXT NULL;
-- ALTER TABLE employee ADD COLUMN nationality VARCHAR(100) NULL;
-- ALTER TABLE employee ADD COLUMN created_by BIGINT NULL;
-- ALTER TABLE employee ADD COLUMN updated_by BIGINT NULL;

CREATE TABLE IF NOT EXISTS audit_log (
  audit_id BIGINT NOT NULL AUTO_INCREMENT,
  action_type VARCHAR(100) NOT NULL,
  target_type VARCHAR(100) NOT NULL,
  target_id BIGINT NULL,
  performed_by_user_id BIGINT NULL,
  performed_by_role_id BIGINT NULL,
  description TEXT NOT NULL,
  metadata_json JSON NULL,
  created_at DATETIME(3) NOT NULL,
  PRIMARY KEY (audit_id),
  KEY idx_audit_created (created_at),
  KEY idx_audit_action (action_type)
);
