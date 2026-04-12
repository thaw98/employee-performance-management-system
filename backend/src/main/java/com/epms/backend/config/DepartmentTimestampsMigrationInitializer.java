package com.epms.backend.config;

import javax.sql.DataSource;

import org.springframework.beans.BeansException;
import org.springframework.beans.factory.BeanCreationException;
import org.springframework.beans.factory.config.BeanPostProcessor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import lombok.extern.slf4j.Slf4j;

/**
 * Adds {@code departments.created_at} and {@code departments.updated_at} for legacy databases,
 * then sets any NULL values to the current timestamp before Hibernate {@code ddl-auto} runs.
 */
@Component
@Slf4j
public class DepartmentTimestampsMigrationInitializer implements BeanPostProcessor {

	@Override
	public Object postProcessAfterInitialization(Object bean, String beanName) throws BeansException {
		if (!"dataSource".equals(beanName) || !(bean instanceof DataSource dataSource)) {
			return bean;
		}
		try {
			migrate(dataSource);
		} catch (Exception e) {
			throw new BeanCreationException("departments created_at / updated_at migration failed", e);
		}
		return bean;
	}

	private void migrate(DataSource dataSource) {
		JdbcTemplate jdbc = new JdbcTemplate(dataSource);
		if (!tableExists(jdbc, "departments")) {
			return;
		}
		if (!columnExists(jdbc, "departments", "created_at")) {
			jdbc.execute("ALTER TABLE departments ADD COLUMN created_at DATETIME NULL");
			log.info("Added departments.created_at");
		}
		if (!columnExists(jdbc, "departments", "updated_at")) {
			jdbc.execute("ALTER TABLE departments ADD COLUMN updated_at DATETIME NULL");
			log.info("Added departments.updated_at");
		}
		int created = jdbc.update("UPDATE departments SET created_at = CURRENT_TIMESTAMP WHERE created_at IS NULL");
		int updated = jdbc.update("UPDATE departments SET updated_at = CURRENT_TIMESTAMP WHERE updated_at IS NULL");
		if (created > 0 || updated > 0) {
			log.info("Backfilled department timestamps (created_at rows: {}, updated_at rows: {})", created, updated);
		}
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
