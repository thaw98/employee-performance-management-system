package com.epms.backend.config;

import javax.sql.DataSource;

import org.springframework.beans.BeansException;
import org.springframework.beans.factory.BeanCreationException;
import org.springframework.beans.factory.config.BeanPostProcessor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import lombok.extern.slf4j.Slf4j;

/**
 * Maps JPA {@link com.epms.backend.entity.Employee#phoneNo} to {@code employee.phone_number}.
 * Renames legacy {@code phone_no} when present.
 */
@Component
@Slf4j
public class EmployeePhoneNumberColumnMigrationInitializer implements BeanPostProcessor {

	@Override
	public Object postProcessAfterInitialization(Object bean, String beanName) throws BeansException {
		if (!"dataSource".equals(beanName) || !(bean instanceof DataSource dataSource)) {
			return bean;
		}
		try {
			migrate(dataSource);
		} catch (Exception e) {
			throw new BeanCreationException("employee.phone_number migration failed", e);
		}
		return bean;
	}

	private void migrate(DataSource dataSource) throws Exception {
		JdbcTemplate jdbc = new JdbcTemplate(dataSource);
		if (!tableExists(jdbc, "employee")) {
			return;
		}
		boolean hasNew = columnExists(jdbc, "employee", "phone_number");
		boolean hasLegacy = columnExists(jdbc, "employee", "phone_no");

		if (hasLegacy && !hasNew) {
			jdbc.execute("ALTER TABLE employee CHANGE COLUMN phone_no phone_number VARCHAR(20) NULL");
			log.info("Renamed employee.phone_no to phone_number");
			return;
		}
		if (hasLegacy && hasNew) {
			int copied = jdbc.update("""
					UPDATE employee SET phone_number = phone_no
					WHERE (phone_number IS NULL OR TRIM(phone_number) = '')
					  AND phone_no IS NOT NULL AND TRIM(phone_no) <> ''
					""");
			if (copied > 0) {
				log.info("Copied {} phone value(s) from phone_no to phone_number", copied);
			}
			jdbc.execute("ALTER TABLE employee DROP COLUMN phone_no");
			log.info("Dropped legacy employee.phone_no");
			return;
		}
		if (!hasNew) {
			jdbc.execute("ALTER TABLE employee ADD COLUMN phone_number VARCHAR(20) NULL");
			log.info("Added employee.phone_number column");
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
