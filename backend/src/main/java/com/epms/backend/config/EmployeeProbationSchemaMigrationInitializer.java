package com.epms.backend.config;

import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.ResultSet;
import java.util.List;
import java.util.concurrent.atomic.AtomicBoolean;

import javax.sql.DataSource;

import org.springframework.beans.BeansException;
import org.springframework.beans.factory.BeanCreationException;
import org.springframework.beans.factory.config.BeanPostProcessor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import lombok.extern.slf4j.Slf4j;

@Component
@Slf4j
public class EmployeeProbationSchemaMigrationInitializer implements BeanPostProcessor {

	private static final AtomicBoolean MIGRATION_DONE = new AtomicBoolean(false);
	private static final String LEGACY_EMPLOYEE_PROBATION_COLUMN = "employee_probation";

	@Override
	public Object postProcessAfterInitialization(Object bean, String beanName) throws BeansException {
		if (!"dataSource".equals(beanName) || !(bean instanceof DataSource dataSource)) {
			return bean;
		}
		if (!MIGRATION_DONE.compareAndSet(false, true)) {
			return bean;
		}
		try {
			runMigration(dataSource);
		} catch (Exception e) {
			MIGRATION_DONE.set(false);
			throw new BeanCreationException("employee probation migration failed", e);
		}
		return bean;
	}

	private void runMigration(DataSource dataSource) throws Exception {
		JdbcTemplate jdbc = new JdbcTemplate(dataSource);
		String employeeTable = resolveEmployeeTable(dataSource);
		if (employeeTable == null) {
			log.info("Skipped employee probation migration because employee table was not found");
			return;
		}

		ensureEmployeeProbationTable(jdbc, dataSource);
		ensureProbationDaysColumn(jdbc, dataSource);
		ensureProbationEmployeeIdColumn(jdbc, dataSource);
		backfillProbationEmployeeIdFromEmployeeColumn(jdbc, employeeTable, dataSource);
		ensureProbationEmployeeForeignKey(jdbc, employeeTable);
		dropLegacyEmployeeProbationColumn(jdbc, employeeTable, dataSource);
	}

	private static void ensureEmployeeProbationTable(JdbcTemplate jdbc, DataSource dataSource) throws Exception {
		if (tableExists(dataSource, "employee_probation")) {
			return;
		}
		jdbc.execute("""
				CREATE TABLE employee_probation (
				  id BIGINT PRIMARY KEY AUTO_INCREMENT,
				  probation_days INT NULL,
				  probation_start_date DATE NULL,
				  probation_end_date DATE NULL
				)
				""");
	}

	private static void ensureProbationDaysColumn(JdbcTemplate jdbc, DataSource dataSource) throws Exception {
		boolean hasProbationDays = columnExists(dataSource, "employee_probation", "probation_days");
		boolean hasProbationMonth = columnExists(dataSource, "employee_probation", "probation_month");

		if (!hasProbationDays && hasProbationMonth) {
			jdbc.execute("ALTER TABLE employee_probation CHANGE COLUMN probation_month probation_days INT NULL");
			return;
		}
		if (!hasProbationDays) {
			jdbc.execute("ALTER TABLE employee_probation ADD COLUMN probation_days INT NULL");
		}
		if (hasProbationMonth) {
			jdbc.execute("""
					UPDATE employee_probation
					SET probation_days = probation_month * 30
					WHERE probation_days IS NULL AND probation_month IS NOT NULL
					""");
			jdbc.execute("ALTER TABLE employee_probation DROP COLUMN probation_month");
		}
	}

	private static void ensureProbationEmployeeIdColumn(JdbcTemplate jdbc, DataSource dataSource) throws Exception {
		if (!columnExists(dataSource, "employee_probation", "employee_id")) {
			jdbc.execute("ALTER TABLE employee_probation ADD COLUMN employee_id BIGINT NULL");
		}
	}

	private static void backfillProbationEmployeeIdFromEmployeeColumn(
			JdbcTemplate jdbc,
			String employeeTable,
			DataSource dataSource) throws Exception {
		if (!columnExists(dataSource, employeeTable, LEGACY_EMPLOYEE_PROBATION_COLUMN)) {
			return;
		}

		jdbc.execute("""
				UPDATE employee_probation p
				INNER JOIN %s e ON e.%s = p.id
				SET p.employee_id = e.employee_id
				WHERE p.employee_id IS NULL
				""".formatted(employeeTable, LEGACY_EMPLOYEE_PROBATION_COLUMN));
	}

	private static void ensureProbationEmployeeForeignKey(JdbcTemplate jdbc, String employeeTable) {
		if (!hasConstraintOnColumn(jdbc, "employee_probation", "employee_id", "FOREIGN KEY")) {
			jdbc.execute("""
					ALTER TABLE employee_probation
					ADD CONSTRAINT fk_employee_probation_employee
					FOREIGN KEY (employee_id) REFERENCES %s(employee_id)
					""".formatted(employeeTable));
		}
		if (!hasConstraintOnColumn(jdbc, "employee_probation", "employee_id", "UNIQUE")) {
			jdbc.execute("""
					ALTER TABLE employee_probation
					ADD CONSTRAINT uq_employee_probation_employee_id UNIQUE (employee_id)
					""");
		}
	}

	private static void dropLegacyEmployeeProbationColumn(
			JdbcTemplate jdbc,
			String employeeTable,
			DataSource dataSource) throws Exception {
		if (!columnExists(dataSource, employeeTable, LEGACY_EMPLOYEE_PROBATION_COLUMN)) {
			return;
		}
		dropForeignKeysOnColumn(jdbc, employeeTable, LEGACY_EMPLOYEE_PROBATION_COLUMN);
		dropSecondaryIndexesOnColumn(jdbc, employeeTable, LEGACY_EMPLOYEE_PROBATION_COLUMN);
		jdbc.execute("ALTER TABLE " + employeeTable + " DROP COLUMN " + LEGACY_EMPLOYEE_PROBATION_COLUMN);
		log.info("Dropped {}.{}", employeeTable, LEGACY_EMPLOYEE_PROBATION_COLUMN);
	}

	private static String resolveEmployeeTable(DataSource dataSource) throws Exception {
		if (tableExists(dataSource, "employee")) {
			return "employee";
		}
		if (tableExists(dataSource, "employees")) {
			return "employees";
		}
		return null;
	}

	private static void dropForeignKeysOnColumn(JdbcTemplate jdbc, String tableName, String columnName) {
		List<String> names = jdbc.query("""
				SELECT DISTINCT CONSTRAINT_NAME
				FROM information_schema.KEY_COLUMN_USAGE
				WHERE TABLE_SCHEMA = DATABASE()
				  AND TABLE_NAME = ?
				  AND COLUMN_NAME = ?
				  AND REFERENCED_TABLE_NAME IS NOT NULL
				""",
				(rs, rowNum) -> rs.getString(1),
				tableName,
				columnName);
		for (String name : names) {
			if (name != null) {
				jdbc.execute("ALTER TABLE `" + tableName + "` DROP FOREIGN KEY `" + name + "`");
			}
		}
	}

	private static void dropSecondaryIndexesOnColumn(JdbcTemplate jdbc, String tableName, String columnName) {
		List<String> indexNames = jdbc.query("""
				SELECT DISTINCT INDEX_NAME
				FROM information_schema.STATISTICS
				WHERE TABLE_SCHEMA = DATABASE()
				  AND TABLE_NAME = ?
				  AND COLUMN_NAME = ?
				  AND INDEX_NAME != 'PRIMARY'
				""",
				(rs, rowNum) -> rs.getString(1),
				tableName,
				columnName);
		for (String indexName : indexNames) {
			if (indexName == null) {
				continue;
			}
			jdbc.execute("ALTER TABLE `" + tableName + "` DROP INDEX `" + indexName + "`");
		}
	}

	private static boolean hasConstraintOnColumn(
			JdbcTemplate jdbc,
			String tableName,
			String columnName,
			String constraintType) {
		Integer count = jdbc.queryForObject("""
				SELECT COUNT(*)
				FROM information_schema.TABLE_CONSTRAINTS tc
				JOIN information_schema.KEY_COLUMN_USAGE kcu
				  ON tc.CONSTRAINT_SCHEMA = kcu.CONSTRAINT_SCHEMA
				 AND tc.TABLE_NAME = kcu.TABLE_NAME
				 AND tc.CONSTRAINT_NAME = kcu.CONSTRAINT_NAME
				WHERE tc.CONSTRAINT_SCHEMA = DATABASE()
				  AND tc.TABLE_NAME = ?
				  AND kcu.COLUMN_NAME = ?
				  AND tc.CONSTRAINT_TYPE = ?
				""",
				Integer.class,
				tableName,
				columnName,
				constraintType);
		return count != null && count > 0;
	}

	private static boolean tableExists(DataSource dataSource, String tableName) throws Exception {
		try (Connection connection = dataSource.getConnection()) {
			DatabaseMetaData metaData = connection.getMetaData();
			try (ResultSet rs = metaData.getTables(connection.getCatalog(), null, tableName, new String[] { "TABLE" })) {
				return rs.next();
			}
		}
	}

	private static boolean columnExists(DataSource dataSource, String tableName, String columnName) throws Exception {
		try (Connection connection = dataSource.getConnection()) {
			DatabaseMetaData metaData = connection.getMetaData();
			try (ResultSet rs = metaData.getColumns(connection.getCatalog(), null, tableName, columnName)) {
				return rs.next();
			}
		}
	}
}
