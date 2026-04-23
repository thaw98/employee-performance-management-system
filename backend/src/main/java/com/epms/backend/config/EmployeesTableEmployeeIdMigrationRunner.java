package com.epms.backend.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Removes legacy {@code employees.employee_code}, ensures {@code employees.employee_id} is populated
 * for every row (defaults to the string form of primary key {@code id}). Runs after JPA schema sync.
 */
@Component
@Order(100)
@RequiredArgsConstructor
@Slf4j
public class EmployeesTableEmployeeIdMigrationRunner implements CommandLineRunner {

	private final JdbcTemplate jdbcTemplate;

	@Override
	public void run(String... args) {
		if (!tableExists("employees")) {
			return;
		}
		dropEmployeeCodeIfPresent();
		backfillEmployeeIds();
	}

	private void dropEmployeeCodeIfPresent() {
		if (!columnExists("employees", "employee_code")) {
			return;
		}
		log.info("Dropping legacy column employees.employee_code");
		jdbcTemplate.execute("ALTER TABLE employees DROP COLUMN employee_code");
	}

	private void backfillEmployeeIds() {
		if (!columnExists("employees", "employee_id")) {
			return;
		}
		int updated = jdbcTemplate.update(
				"""
						UPDATE employees
						SET employee_id = CAST(id AS CHAR)
						WHERE employee_id IS NULL OR TRIM(COALESCE(employee_id, '')) = ''
						""");
		if (updated > 0) {
			log.info("Set default employees.employee_id from id for {} row(s)", updated);
		}
	}

	private boolean tableExists(String tableName) {
		return Boolean.TRUE.equals(jdbcTemplate.queryForObject(
				"""
						SELECT COUNT(*) > 0 FROM INFORMATION_SCHEMA.TABLES
						WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?
						""",
				Boolean.class,
				tableName));
	}

	private boolean columnExists(String tableName, String columnName) {
		return Boolean.TRUE.equals(jdbcTemplate.queryForObject(
				"""
						SELECT COUNT(*) > 0 FROM INFORMATION_SCHEMA.COLUMNS
						WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?
						""",
				Boolean.class,
				tableName,
				columnName));
	}
}
