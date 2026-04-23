package com.epms.backend.config;

import javax.sql.DataSource;

import org.springframework.beans.BeansException;
import org.springframework.beans.factory.BeanCreationException;
import org.springframework.beans.factory.config.BeanPostProcessor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import lombok.extern.slf4j.Slf4j;

/**
 * Converts legacy {@code employees.marital_status} from VARCHAR to {@code ENUM('SINGLE','MARRIED')} before JPA
 * schema management runs.
 */
@Component
@Slf4j
public class MaritalStatusColumnMigrationInitializer implements BeanPostProcessor {

	@Override
	public Object postProcessAfterInitialization(Object bean, String beanName) throws BeansException {
		if (!"dataSource".equals(beanName) || !(bean instanceof DataSource dataSource)) {
			return bean;
		}
		try {
			migrate(dataSource);
		} catch (Exception e) {
			throw new BeanCreationException("employees.marital_status ENUM migration failed", e);
		}
		return bean;
	}

	private void migrate(DataSource dataSource) throws Exception {
		JdbcTemplate jdbc = new JdbcTemplate(dataSource);
		if (!Boolean.TRUE.equals(jdbc.queryForObject(
				"""
						SELECT COUNT(*) > 0 FROM INFORMATION_SCHEMA.TABLES
						WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'employees'
						""",
				Boolean.class))) {
			return;
		}
		if (!Boolean.TRUE.equals(jdbc.queryForObject(
				"""
						SELECT COUNT(*) > 0 FROM INFORMATION_SCHEMA.COLUMNS
						WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'employees' AND COLUMN_NAME = 'marital_status'
						""",
				Boolean.class))) {
			return;
		}
		String columnType = jdbc.queryForObject(
				"""
						SELECT COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS
						WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'employees' AND COLUMN_NAME = 'marital_status'
						""",
				String.class);
		if (columnType != null && columnType.toLowerCase().startsWith("enum")) {
			return;
		}
		log.info("Migrating employees.marital_status to ENUM('SINGLE','MARRIED')");
		jdbc.execute("UPDATE employees SET marital_status = NULL WHERE marital_status IS NOT NULL AND TRIM(marital_status) = ''");
		jdbc.execute("""
				UPDATE employees SET marital_status = 'SINGLE'
				WHERE marital_status IS NOT NULL
				  AND UPPER(TRIM(marital_status)) IN ('SINGLE', 'UNMARRIED')
				""");
		jdbc.execute("""
				UPDATE employees SET marital_status = 'MARRIED'
				WHERE marital_status IS NOT NULL
				  AND UPPER(TRIM(marital_status)) = 'MARRIED'
				""");
		jdbc.execute("UPDATE employees SET marital_status = NULL WHERE marital_status IS NOT NULL AND marital_status NOT IN ('SINGLE','MARRIED')");
		jdbc.execute("ALTER TABLE employees MODIFY COLUMN marital_status ENUM('SINGLE','MARRIED') NULL");
	}
}
