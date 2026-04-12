package com.epms.backend.config;

import java.util.concurrent.atomic.AtomicBoolean;

import javax.sql.DataSource;

import org.springframework.beans.BeansException;
import org.springframework.beans.factory.BeanCreationException;
import org.springframework.beans.factory.config.BeanPostProcessor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import lombok.extern.slf4j.Slf4j;

/**
 * Ensures a {@code passport} row table exists (migrating legacy {@code employees.passport_no} /
 * {@code employees.passport_expire_date} when present), and ensures career-tracking date columns
 * exist on {@code employees} for databases created before those fields were added.
 */
@Component
@Slf4j
public class EmployeePassportAndCareerDatesMigrationInitializer implements BeanPostProcessor {

	private static final AtomicBoolean MIGRATION_DONE = new AtomicBoolean(false);

	@Override
	public Object postProcessAfterInitialization(Object bean, String beanName) throws BeansException {
		if (!"dataSource".equals(beanName) || !(bean instanceof DataSource dataSource)) {
			return bean;
		}
		if (!MIGRATION_DONE.compareAndSet(false, true)) {
			return bean;
		}
		try {
			migrate(dataSource);
		} catch (Exception e) {
			MIGRATION_DONE.set(false);
			throw new BeanCreationException("passport table / employees career date columns migration failed", e);
		}
		return bean;
	}

	private void migrate(DataSource dataSource) {
		JdbcTemplate jdbc = new JdbcTemplate(dataSource);
		if (!tableExists(jdbc, "employees")) {
			return;
		}
		ensurePassportTable(jdbc);
		migrateLegacyPassportColumnsFromEmployees(jdbc);
		addColumnIfMissing(jdbc, "date_of_demotion", "DATE NULL");
		addColumnIfMissing(jdbc, "date_of_title_change", "DATE NULL");
		addColumnIfMissing(jdbc, "date_of_promotion", "DATE NULL");
		addColumnIfMissing(jdbc, "date_of_transfer", "DATE NULL");
	}

	private void ensurePassportTable(JdbcTemplate jdbc) {
		if (tableExists(jdbc, "passport")) {
			return;
		}
		jdbc.execute("""
				CREATE TABLE passport (
				  id BIGINT PRIMARY KEY AUTO_INCREMENT,
				  employee_id BIGINT NOT NULL,
				  passport_no VARCHAR(100) NULL,
				  passport_expire_date DATE NULL,
				  UNIQUE KEY uq_passport_employee (employee_id),
				  CONSTRAINT fk_passport_employee FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
				)
				""");
		log.info("Created table passport");
	}

	private void migrateLegacyPassportColumnsFromEmployees(JdbcTemplate jdbc) {
		boolean hasPassportNo = columnExists(jdbc, "employees", "passport_no");
		boolean hasPassportExpire = columnExists(jdbc, "employees", "passport_expire_date");
		if (!hasPassportNo && !hasPassportExpire) {
			return;
		}
		int inserted;
		if (hasPassportNo && hasPassportExpire) {
			inserted = jdbc.update("""
					INSERT INTO passport (employee_id, passport_no, passport_expire_date)
					SELECT e.id, e.passport_no, e.passport_expire_date FROM employees e
					WHERE NOT EXISTS (SELECT 1 FROM passport p WHERE p.employee_id = e.id)
					AND (e.passport_no IS NOT NULL OR e.passport_expire_date IS NOT NULL)
					""");
		} else if (hasPassportNo) {
			inserted = jdbc.update("""
					INSERT INTO passport (employee_id, passport_no, passport_expire_date)
					SELECT e.id, e.passport_no, NULL FROM employees e
					WHERE NOT EXISTS (SELECT 1 FROM passport p WHERE p.employee_id = e.id)
					AND e.passport_no IS NOT NULL
					""");
		} else {
			inserted = jdbc.update("""
					INSERT INTO passport (employee_id, passport_no, passport_expire_date)
					SELECT e.id, NULL, e.passport_expire_date FROM employees e
					WHERE NOT EXISTS (SELECT 1 FROM passport p WHERE p.employee_id = e.id)
					AND e.passport_expire_date IS NOT NULL
					""");
		}
		if (inserted > 0) {
			log.info("Migrated {} passport row(s) from employees into passport", inserted);
		}
		if (hasPassportNo) {
			jdbc.execute("ALTER TABLE employees DROP COLUMN `passport_no`");
			log.info("Dropped employees.passport_no (moved to passport)");
		}
		if (hasPassportExpire) {
			jdbc.execute("ALTER TABLE employees DROP COLUMN `passport_expire_date`");
			log.info("Dropped employees.passport_expire_date (moved to passport)");
		}
	}

	private void addColumnIfMissing(JdbcTemplate jdbc, String columnName, String sqlType) {
		if (columnExists(jdbc, "employees", columnName)) {
			return;
		}
		jdbc.execute("ALTER TABLE employees ADD COLUMN `" + columnName + "` " + sqlType);
		log.info("Added employees.{} column", columnName);
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
