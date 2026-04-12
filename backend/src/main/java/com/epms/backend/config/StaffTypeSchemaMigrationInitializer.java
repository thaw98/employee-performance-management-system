package com.epms.backend.config;

import javax.sql.DataSource;

import org.springframework.beans.BeansException;
import org.springframework.beans.factory.BeanCreationException;
import org.springframework.beans.factory.config.BeanPostProcessor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import lombok.extern.slf4j.Slf4j;

/**
 * Ensures {@code staff_type} reference rows and {@code employees.staff_type_id} exist before JPA
 * schema update runs.
 */
@Component
@Slf4j
public class StaffTypeSchemaMigrationInitializer implements BeanPostProcessor {

	@Override
	public Object postProcessAfterInitialization(Object bean, String beanName) throws BeansException {
		if (!"dataSource".equals(beanName) || !(bean instanceof DataSource dataSource)) {
			return bean;
		}
		try {
			migrate(dataSource);
		} catch (Exception e) {
			throw new BeanCreationException("staff_type / employees.staff_type_id migration failed", e);
		}
		return bean;
	}

	private void migrate(DataSource dataSource) {
		JdbcTemplate jdbc = new JdbcTemplate(dataSource);
		if (!tableExists(jdbc, "employees")) {
			return;
		}
		jdbc.execute("""
				CREATE TABLE IF NOT EXISTS staff_type (
					id BIGINT NOT NULL PRIMARY KEY,
					name VARCHAR(100) NOT NULL,
					UNIQUE KEY uq_staff_type_name (name)
				)
				""");
		jdbc.update("INSERT IGNORE INTO staff_type (id, name) VALUES (1, 'Permanent'), (2, 'Probation')");
		if (!columnExists(jdbc, "employees", "staff_type_id")) {
			jdbc.execute("ALTER TABLE employees ADD COLUMN staff_type_id BIGINT NULL");
			jdbc.execute("""
					ALTER TABLE employees
					ADD CONSTRAINT fk_employees_staff_type
					FOREIGN KEY (staff_type_id) REFERENCES staff_type(id)
					""");
			log.info("Added employees.staff_type_id");
			if (tableExists(jdbc, "employee_probation")) {
				if (columnExists(jdbc, "employee_probation", "employee_id")) {
					jdbc.execute("""
							UPDATE employees e
							INNER JOIN employee_probation p ON e.id = p.employee_id
							SET e.staff_type_id = 2
							WHERE e.staff_type_id IS NULL
							""");
				} else if (columnExists(jdbc, "employees", "employee_probation_id")) {
					jdbc.execute("""
							UPDATE employees e
							INNER JOIN employee_probation p ON e.employee_probation_id = p.id
							SET e.staff_type_id = 2
							WHERE e.staff_type_id IS NULL
							""");
				}
			}
			jdbc.execute("UPDATE employees SET staff_type_id = 1 WHERE staff_type_id IS NULL");
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
