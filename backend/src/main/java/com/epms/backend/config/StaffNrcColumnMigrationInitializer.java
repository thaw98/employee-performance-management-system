package com.epms.backend.config;

import javax.sql.DataSource;

import org.springframework.beans.BeansException;
import org.springframework.beans.factory.BeanCreationException;
import org.springframework.beans.factory.config.BeanPostProcessor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import lombok.extern.slf4j.Slf4j;

/**
 * Replaces split NRC columns and legacy {@code employee_nrc_no} with {@code employees.staff_nrc_no}.
 */
@Component
@Slf4j
public class StaffNrcColumnMigrationInitializer implements BeanPostProcessor {

	@Override
	public Object postProcessAfterInitialization(Object bean, String beanName) throws BeansException {
		if (!"dataSource".equals(beanName) || !(bean instanceof DataSource dataSource)) {
			return bean;
		}
		try {
			migrate(dataSource);
		} catch (Exception e) {
			throw new BeanCreationException("employees.staff_nrc_no migration failed", e);
		}
		return bean;
	}

	private void migrate(DataSource dataSource) throws Exception {
		JdbcTemplate jdbc = new JdbcTemplate(dataSource);
		if (!tableExists(jdbc, "employees")) {
			return;
		}
		if (!columnExists(jdbc, "employees", "staff_nrc_no")) {
			jdbc.execute("ALTER TABLE employees ADD COLUMN staff_nrc_no VARCHAR(100) NULL");
			log.info("Added employees.staff_nrc_no column");
		}

		if (columnExists(jdbc, "employees", "nrc_full")) {
			jdbc.execute("""
					UPDATE employees
					SET staff_nrc_no = nrc_full
					WHERE (staff_nrc_no IS NULL OR TRIM(staff_nrc_no) = '')
					  AND nrc_full IS NOT NULL AND TRIM(nrc_full) != ''
					""");
		}
		if (columnExists(jdbc, "employees", "nrc_state_code")
				&& columnExists(jdbc, "employees", "nrc_township_code")
				&& columnExists(jdbc, "employees", "nrc_type")
				&& columnExists(jdbc, "employees", "nrc_number")) {
			jdbc.execute("""
					UPDATE employees
					SET staff_nrc_no = CONCAT(
						nrc_state_code, '/', nrc_township_code, '(', nrc_type, ')', nrc_number)
					WHERE (staff_nrc_no IS NULL OR TRIM(staff_nrc_no) = '')
					  AND nrc_state_code IS NOT NULL AND nrc_township_code IS NOT NULL
					  AND nrc_type IS NOT NULL AND nrc_number IS NOT NULL
					""");
		}
		if (columnExists(jdbc, "employees", "employee_nrc_no")) {
			jdbc.execute("""
					UPDATE employees
					SET staff_nrc_no = employee_nrc_no
					WHERE (staff_nrc_no IS NULL OR TRIM(staff_nrc_no) = '')
					  AND employee_nrc_no IS NOT NULL AND TRIM(employee_nrc_no) != ''
					""");
		}

		for (String col : new String[] { "nrc_full", "nrc_state_code", "nrc_township_code", "nrc_type", "nrc_number",
				"employee_nrc_no" }) {
			if (columnExists(jdbc, "employees", col)) {
				jdbc.execute("ALTER TABLE employees DROP COLUMN `" + col + "`");
				log.info("Dropped employees.{}", col);
			}
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
