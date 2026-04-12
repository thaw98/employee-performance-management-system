package com.epms.backend.config;

import java.sql.PreparedStatement;
import java.sql.Statement;
import java.sql.Types;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicBoolean;

import javax.sql.DataSource;

import org.springframework.beans.BeansException;
import org.springframework.beans.factory.BeanCreationException;
import org.springframework.beans.factory.config.BeanPostProcessor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Component;

import lombok.extern.slf4j.Slf4j;

/**
 * Ensures a {@code passport} table exists (without {@code employee_id}; link is
 * {@code employees.passport_id}), migrates legacy shapes and legacy
 * {@code employees.passport_no} / {@code employees.passport_expire_date}, and
 * ensures career-tracking date columns exist on {@code employees}.
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
		ensureEmployeesPassportIdColumn(jdbc);
		migratePassportEmployeeIdToEmployeesPassportId(jdbc);
		migrateLegacyPassportColumnsFromEmployees(jdbc);
		ensureEmployeesPassportForeignKey(jdbc);
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
				  passport_no VARCHAR(100) NULL,
				  passport_expire_date DATE NULL
				)
				""");
		log.info("Created table passport");
	}

	private void ensureEmployeesPassportIdColumn(JdbcTemplate jdbc) {
		if (columnExists(jdbc, "employees", "passport_id")) {
			return;
		}
		jdbc.execute("ALTER TABLE employees ADD COLUMN `passport_id` BIGINT NULL");
		log.info("Added employees.passport_id column");
	}

	/**
	 * Legacy: passport.employee_id referenced employees.id. Move link to employees.passport_id and drop
	 * passport.employee_id.
	 */
	private void migratePassportEmployeeIdToEmployeesPassportId(JdbcTemplate jdbc) {
		if (!tableExists(jdbc, "passport") || !columnExists(jdbc, "passport", "employee_id")) {
			return;
		}
		int updated = jdbc.update("""
				UPDATE employees e
				INNER JOIN passport p ON p.employee_id = e.id
				SET e.passport_id = p.id
				""");
		if (updated > 0) {
			log.info("Set employees.passport_id for {} row(s) from legacy passport.employee_id", updated);
		}
		String fkName = foreignKeyOnColumn(jdbc, "passport", "employee_id");
		if (fkName != null) {
			jdbc.execute("ALTER TABLE passport DROP FOREIGN KEY `" + fkName.replace("`", "``") + "`");
			log.info("Dropped foreign key {} on passport.employee_id", fkName);
		}
		jdbc.execute("ALTER TABLE passport DROP COLUMN `employee_id`");
		log.info("Dropped passport.employee_id (FK now employees.passport_id)");
	}

	private void migrateLegacyPassportColumnsFromEmployees(JdbcTemplate jdbc) {
		boolean hasPassportNo = columnExists(jdbc, "employees", "passport_no");
		boolean hasPassportExpire = columnExists(jdbc, "employees", "passport_expire_date");
		if (!hasPassportNo && !hasPassportExpire) {
			return;
		}
		if (!tableExists(jdbc, "passport")) {
			ensurePassportTable(jdbc);
		}
		ensureEmployeesPassportIdColumn(jdbc);
		List<Map<String, Object>> rows = jdbc.queryForList("""
				SELECT id, passport_no, passport_expire_date FROM employees
				WHERE (passport_no IS NOT NULL OR passport_expire_date IS NOT NULL)
				AND passport_id IS NULL
				""");
		for (Map<String, Object> row : rows) {
			Long empId = ((Number) row.get("id")).longValue();
			final String passportNo = (String) row.get("passport_no");
			Object expireObj = row.get("passport_expire_date");
			final java.sql.Date expire;
			if (expireObj instanceof java.sql.Date d) {
				expire = d;
			} else if (expireObj instanceof LocalDate ld) {
				expire = java.sql.Date.valueOf(ld);
			} else {
				expire = null;
			}
			KeyHolder keyHolder = new GeneratedKeyHolder();
			jdbc.update(connection -> {
				PreparedStatement ps = connection.prepareStatement(
						"INSERT INTO passport (passport_no, passport_expire_date) VALUES (?, ?)",
						Statement.RETURN_GENERATED_KEYS);
				if (passportNo != null) {
					ps.setString(1, passportNo);
				} else {
					ps.setNull(1, Types.VARCHAR);
				}
				if (expire != null) {
					ps.setDate(2, expire);
				} else {
					ps.setNull(2, Types.DATE);
				}
				return ps;
			}, keyHolder);
			Number key = keyHolder.getKey();
			if (key == null) {
				throw new IllegalStateException("Failed to read generated passport id");
			}
			jdbc.update("UPDATE employees SET passport_id = ? WHERE id = ?", key.longValue(), empId);
		}
		if (!rows.isEmpty()) {
			log.info("Migrated {} passport row(s) from employees columns into passport", rows.size());
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

	private void ensureEmployeesPassportForeignKey(JdbcTemplate jdbc) {
		if (!columnExists(jdbc, "employees", "passport_id") || !tableExists(jdbc, "passport")) {
			return;
		}
		if (foreignKeyOnColumn(jdbc, "employees", "passport_id") != null) {
			return;
		}
		jdbc.execute("""
				ALTER TABLE employees
				ADD CONSTRAINT fk_employees_passport
				FOREIGN KEY (passport_id) REFERENCES passport(id) ON DELETE SET NULL
				""");
		log.info("Added fk_employees_passport on employees.passport_id");
	}

	private void addColumnIfMissing(JdbcTemplate jdbc, String columnName, String sqlType) {
		if (columnExists(jdbc, "employees", columnName)) {
			return;
		}
		jdbc.execute("ALTER TABLE employees ADD COLUMN `" + columnName + "` " + sqlType);
		log.info("Added employees.{} column", columnName);
	}

	private static String foreignKeyOnColumn(JdbcTemplate jdbc, String tableName, String columnName) {
		List<String> names = jdbc.queryForList(
				"""
						SELECT CONSTRAINT_NAME FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
						WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?
						AND REFERENCED_TABLE_NAME IS NOT NULL
						LIMIT 1
						""",
				String.class,
				tableName,
				columnName);
		return names.isEmpty() ? null : names.get(0);
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
