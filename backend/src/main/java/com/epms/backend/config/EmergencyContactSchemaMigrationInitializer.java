package com.epms.backend.config;

import javax.sql.DataSource;

import org.springframework.beans.BeansException;
import org.springframework.beans.factory.BeanCreationException;
import org.springframework.beans.factory.config.BeanPostProcessor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import lombok.extern.slf4j.Slf4j;

/**
 * Migrates emergency contact linkage to the employee table so
 * {@code employee.emergency_contact_id} is the owning foreign key.
 */
@Component
@Slf4j
public class EmergencyContactSchemaMigrationInitializer implements BeanPostProcessor {

	@Override
	public Object postProcessAfterInitialization(Object bean, String beanName) throws BeansException {
		if (!"dataSource".equals(beanName) || !(bean instanceof DataSource dataSource)) {
			return bean;
		}
		try {
			migrate(new JdbcTemplate(dataSource));
		} catch (Exception e) {
			throw new BeanCreationException("Emergency contact schema migration failed", e);
		}
		return bean;
	}

	private void migrate(JdbcTemplate jdbc) {
		if (!tableExists(jdbc, "emergency_contact")) {
			return;
		}
		String employeeTable = resolveEmployeeTable(jdbc);
		if (employeeTable == null) {
			return;
		}

		if (!columnExists(jdbc, employeeTable, "emergency_contact_id")) {
			jdbc.execute("ALTER TABLE " + employeeTable + " ADD COLUMN emergency_contact_id BIGINT NULL");
			log.info("Added {}.emergency_contact_id", employeeTable);
		}

		if (columnExists(jdbc, "emergency_contact", "employee_id")) {
			int updated = jdbc.update(
					"""
							UPDATE %s e
							INNER JOIN emergency_contact ec ON ec.employee_id = e.employee_id
							SET e.emergency_contact_id = ec.id
							WHERE e.emergency_contact_id IS NULL
							"""
							.formatted(employeeTable));
			log.info("Backfilled {} employee row(s) for {}.emergency_contact_id", updated, employeeTable);
		}

		ensureForeignKey(jdbc, employeeTable);
	}

	private void ensureForeignKey(JdbcTemplate jdbc, String employeeTable) {
		boolean hasFk = Boolean.TRUE.equals(jdbc.queryForObject(
				"""
						SELECT COUNT(*) > 0
						FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
						WHERE TABLE_SCHEMA = DATABASE()
						  AND TABLE_NAME = ?
						  AND COLUMN_NAME = 'emergency_contact_id'
						  AND REFERENCED_TABLE_NAME = 'emergency_contact'
						  AND REFERENCED_COLUMN_NAME = 'id'
						""",
				Boolean.class,
				employeeTable));
		if (hasFk) {
			return;
		}
		jdbc.execute(
				"""
						ALTER TABLE %s
						ADD CONSTRAINT fk_%s_emergency_contact
						FOREIGN KEY (emergency_contact_id) REFERENCES emergency_contact(id)
						"""
						.formatted(employeeTable, employeeTable));
		log.info("Added foreign key for {}.emergency_contact_id -> emergency_contact.id", employeeTable);
	}

	private String resolveEmployeeTable(JdbcTemplate jdbc) {
		if (tableExists(jdbc, "employee")) {
			return "employee";
		}
		if (tableExists(jdbc, "employees")) {
			return "employees";
		}
		return null;
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
