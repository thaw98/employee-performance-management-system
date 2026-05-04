package com.epms.backend.config;

import javax.sql.DataSource;

import org.springframework.beans.BeansException;
import org.springframework.beans.factory.BeanCreationException;
import org.springframework.beans.factory.config.BeanPostProcessor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import lombok.extern.slf4j.Slf4j;

/**
 * Converts legacy {@code marital_status} from VARCHAR to {@code ENUM('Single','Married')} on
 * {@code employee} or legacy {@code employees} before JPA schema management runs.
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
			migrate(dataSource, "employee");
			migrate(dataSource, "employees");
		} catch (Exception e) {
			throw new BeanCreationException("marital_status ENUM migration failed", e);
		}
		return bean;
	}

	private void migrate(DataSource dataSource, String tableName) throws Exception {
		JdbcTemplate jdbc = new JdbcTemplate(dataSource);
		if (!Boolean.TRUE.equals(jdbc.queryForObject(
				"""
						SELECT COUNT(*) > 0 FROM INFORMATION_SCHEMA.TABLES
						WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?
						""",
				Boolean.class,
				tableName))) {
			return;
		}
		if (!Boolean.TRUE.equals(jdbc.queryForObject(
				"""
						SELECT COUNT(*) > 0 FROM INFORMATION_SCHEMA.COLUMNS
						WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = 'marital_status'
						""",
				Boolean.class,
				tableName))) {
			return;
		}
		String columnType = jdbc.queryForObject(
				"""
						SELECT COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS
						WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = 'marital_status'
						""",
				String.class,
				tableName);
		if (columnType != null && columnType.toLowerCase().startsWith("enum")) {
			return;
		}
		log.info("Migrating {}.marital_status to ENUM('Single','Married')", tableName);
		String q = "`" + tableName + "`";
		jdbc.execute("UPDATE " + q + " SET marital_status = NULL WHERE marital_status IS NOT NULL AND TRIM(marital_status) = ''");
		jdbc.execute("""
				UPDATE %s SET marital_status = 'Single'
				WHERE marital_status IS NOT NULL
				  AND (
				    UPPER(TRIM(marital_status)) IN ('SINGLE', 'UNMARRIED')
				    OR TRIM(marital_status) = 'Single'
				  )
				""".formatted(q));
		jdbc.execute("""
				UPDATE %s SET marital_status = 'Married'
				WHERE marital_status IS NOT NULL
				  AND (
				    UPPER(TRIM(marital_status)) = 'MARRIED'
				    OR TRIM(marital_status) = 'Married'
				  )
				""".formatted(q));
		jdbc.execute("UPDATE " + q + " SET marital_status = NULL WHERE marital_status IS NOT NULL AND marital_status NOT IN ('Single','Married')");
		jdbc.execute("ALTER TABLE " + q + " MODIFY COLUMN marital_status ENUM('Single','Married') NULL");
	}
}
