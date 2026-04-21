package com.epms.backend.config;

import javax.sql.DataSource;

import org.springframework.beans.BeansException;
import org.springframework.beans.factory.BeanCreationException;
import org.springframework.beans.factory.config.BeanPostProcessor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import lombok.extern.slf4j.Slf4j;

/**
 * Ensures {@code audit_log} and {@code user_account.must_change_password} exist for HR account flows.
 */
@Component
@Slf4j
public class AuditAndUserAccountSchemaMigrationInitializer implements BeanPostProcessor {

	@Override
	public Object postProcessAfterInitialization(Object bean, String beanName) throws BeansException {
		if (!"dataSource".equals(beanName) || !(bean instanceof DataSource dataSource)) {
			return bean;
		}
		try {
			migrate(dataSource);
		} catch (Exception e) {
			throw new BeanCreationException("audit_log / must_change_password migration failed", e);
		}
		return bean;
	}

	private void migrate(DataSource dataSource) {
		JdbcTemplate jdbc = new JdbcTemplate(dataSource);
		if (!tableExists(jdbc, "user_account")) {
			return;
		}
		if (!columnExists(jdbc, "user_account", "must_change_password")) {
			jdbc.execute("ALTER TABLE user_account ADD COLUMN must_change_password TINYINT(1) NOT NULL DEFAULT 1");
			log.info("Added user_account.must_change_password");
		}
		jdbc.execute("""
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
				)
				""");
	}

	private static boolean tableExists(JdbcTemplate jdbc, String tableName) {
		return Boolean.TRUE.equals(jdbc.queryForObject(
				"""
						SELECT COUNT(*) > 0 FROM INFORMATION_SCHEMA.TABLES
						WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?
						""",
				Boolean.class,
				tableName));
	}

	private static boolean columnExists(JdbcTemplate jdbc, String tableName, String columnName) {
		return Boolean.TRUE.equals(jdbc.queryForObject(
				"""
						SELECT COUNT(*) > 0 FROM INFORMATION_SCHEMA.COLUMNS
						WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?
						""",
				Boolean.class,
				tableName,
				columnName));
	}
}
