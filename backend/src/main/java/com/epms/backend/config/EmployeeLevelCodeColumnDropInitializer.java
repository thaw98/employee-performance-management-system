package com.epms.backend.config;

import javax.sql.DataSource;

import org.springframework.beans.BeansException;
import org.springframework.beans.factory.BeanCreationException;
import org.springframework.beans.factory.config.BeanPostProcessor;
import org.springframework.core.Ordered;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import lombok.extern.slf4j.Slf4j;

/**
 * Drops deprecated {@code employee.level_code_id} if it still exists.
 */
@Component
@Slf4j
public class EmployeeLevelCodeColumnDropInitializer implements BeanPostProcessor, Ordered {

	@Override
	public int getOrder() {
		return 23;
	}

	@Override
	public Object postProcessAfterInitialization(Object bean, String beanName) throws BeansException {
		if (!"dataSource".equals(beanName) || !(bean instanceof DataSource dataSource)) {
			return bean;
		}
		try {
			dropLegacyColumnIfPresent(dataSource);
		} catch (Exception e) {
			throw new BeanCreationException("employee.level_code_id drop failed", e);
		}
		return bean;
	}

	private void dropLegacyColumnIfPresent(DataSource dataSource) {
		JdbcTemplate jdbc = new JdbcTemplate(dataSource);
		if (!tableExists(jdbc, "employee")) {
			return;
		}

		if (!columnExists(jdbc, "employee", "level_code_id")) {
			return;
		}

		dropEmployeeLevelCodeFkIfPresent(jdbc);
		jdbc.execute("ALTER TABLE employee DROP COLUMN level_code_id");
		log.info("Dropped employee.level_code_id column");
	}

	private static void dropEmployeeLevelCodeFkIfPresent(JdbcTemplate jdbc) {
		if (!fkConstraintExists(jdbc, "employee", "fk_employee_level_code")) {
			return;
		}
		jdbc.execute("ALTER TABLE employee DROP FOREIGN KEY fk_employee_level_code");
		log.info("Dropped fk_employee_level_code");
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

	private static boolean fkConstraintExists(JdbcTemplate jdbc, String tableName, String constraintName) {
		Integer n = jdbc.queryForObject(
				"""
						SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
						WHERE CONSTRAINT_SCHEMA = DATABASE()
						  AND TABLE_NAME = ?
						  AND CONSTRAINT_NAME = ?
						  AND CONSTRAINT_TYPE = 'FOREIGN KEY'
						""",
				Integer.class,
				tableName,
				constraintName);
		return n != null && n > 0;
	}
}
