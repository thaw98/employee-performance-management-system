package com.epms.backend.config;

import javax.sql.DataSource;

import org.springframework.beans.BeansException;
import org.springframework.beans.factory.BeanCreationException;
import org.springframework.beans.factory.config.BeanPostProcessor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import lombok.extern.slf4j.Slf4j;

/**
 * Aligns {@code emergency_contact} with JPA: primary key column is {@code id}, not legacy
 * {@code emergency_id}. If both columns exist, drops the redundant {@code emergency_id}.
 */
@Component
@Slf4j
public class EmergencyContactEmergencyIdColumnMigrationInitializer implements BeanPostProcessor {

	@Override
	public Object postProcessAfterInitialization(Object bean, String beanName) throws BeansException {
		if (!"dataSource".equals(beanName) || !(bean instanceof DataSource dataSource)) {
			return bean;
		}
		try {
			migrate(new JdbcTemplate(dataSource));
		} catch (Exception e) {
			throw new BeanCreationException("emergency_contact.emergency_id migration failed", e);
		}
		return bean;
	}

	private void migrate(JdbcTemplate jdbc) {
		if (!tableExists(jdbc, "emergency_contact") || !columnExists(jdbc, "emergency_contact", "emergency_id")) {
			return;
		}
		if (columnExists(jdbc, "emergency_contact", "id")) {
			log.info("Dropping redundant column emergency_contact.emergency_id (id is already present)");
			jdbc.execute("ALTER TABLE emergency_contact DROP COLUMN emergency_id");
			return;
		}
		log.info("Renaming emergency_contact.emergency_id -> id");
		String columnType = jdbc.queryForObject(
				"""
						SELECT COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS
						WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'emergency_contact' AND COLUMN_NAME = 'emergency_id'
						""",
				String.class);
		String isNullable = jdbc.queryForObject(
				"""
						SELECT IS_NULLABLE FROM INFORMATION_SCHEMA.COLUMNS
						WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'emergency_contact' AND COLUMN_NAME = 'emergency_id'
						""",
				String.class);
		String extra = jdbc.queryForObject(
				"""
						SELECT COALESCE(EXTRA, '') FROM INFORMATION_SCHEMA.COLUMNS
						WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'emergency_contact' AND COLUMN_NAME = 'emergency_id'
						""",
				String.class);
		StringBuilder suffix = new StringBuilder();
		if ("NO".equals(isNullable)) {
			suffix.append(" NOT NULL");
		}
		if (extra != null && extra.toLowerCase().contains("auto_increment")) {
			suffix.append(" AUTO_INCREMENT");
		}
		jdbc.execute("ALTER TABLE emergency_contact CHANGE COLUMN emergency_id id " + columnType + suffix);
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
