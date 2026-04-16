package com.epms.backend.config;

import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
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
import org.springframework.stereotype.Component;

import lombok.extern.slf4j.Slf4j;

/**
 * Normalizes probation fields to {@code employee_probation} with {@code employees.employee_probation_id}
 * referencing {@code employee_probation.id} (no {@code employee_probation.employee_id}).
 * <p>
 * Runs as a {@link BeanPostProcessor} on the primary {@code dataSource} bean so this executes before
 * Hibernate {@code ddl-auto} applies the new mapping.
 */
@Component
@Slf4j
public class EmployeeProbationSchemaMigrationInitializer implements BeanPostProcessor {

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
			runMigration(dataSource);
		} catch (Exception e) {
			MIGRATION_DONE.set(false);
			throw new BeanCreationException("employee_probation migration failed", e);
		}
		return bean;
	}

	private void runMigration(DataSource dataSource) throws Exception {
		JdbcTemplate jdbc = new JdbcTemplate(dataSource);
		ensureEmployeeProbationTable(jdbc, dataSource);
		migrateOldEmployeeIdColumnOffProbation(jdbc, dataSource);
		ensureEmployeeProbationFkOnEmployees(jdbc, dataSource);
		copyDenormalizedProbationColumnsIntoEmployeeProbation(jdbc, dataSource);
		dropDenormalizedProbationColumnsFromEmployees(jdbc, dataSource);
	}

	private void ensureEmployeeProbationTable(JdbcTemplate jdbc, DataSource dataSource) throws Exception {
		if (tableExists(dataSource, "employee_probation")) {
			return;
		}
		jdbc.execute("""
				CREATE TABLE employee_probation (
				  id BIGINT PRIMARY KEY AUTO_INCREMENT,
				  probation_month INT NULL,
				  probation_start_date DATE NULL,
				  probation_end_date DATE NULL
				)
				""");
		log.info("Created table employee_probation");
	}

	/**
	 * Legacy: {@code employee_probation.employee_id} referenced {@code employees.id}. New shape: FK on
	 * {@code employees.employee_probation_id} only.
	 */
	private void migrateOldEmployeeIdColumnOffProbation(JdbcTemplate jdbc, DataSource dataSource) throws Exception {
		if (!tableExists(dataSource, "employee_probation") || !tableExists(dataSource, "employees")) {
			return;
		}
		if (!columnExists(dataSource, "employee_probation", "employee_id")) {
			return;
		}
		if (!columnExists(dataSource, "employees", "employee_probation_id")) {
			jdbc.execute("ALTER TABLE employees ADD COLUMN employee_probation_id BIGINT NULL");
		}
		jdbc.execute("""
				UPDATE employees e
				INNER JOIN employee_probation p ON e.id = p.employee_id
				SET e.employee_probation_id = p.id
				WHERE e.employee_probation_id IS NULL
				""");
		dropForeignKeysOnColumn(jdbc, "employee_probation", "employee_id");
		dropSecondaryIndexesOnColumn(jdbc, "employee_probation", "employee_id");
		jdbc.execute("ALTER TABLE employee_probation DROP COLUMN employee_id");
		log.info("Dropped legacy column employee_probation.employee_id; employees.employee_probation_id populated");
	}

	private void ensureEmployeeProbationFkOnEmployees(JdbcTemplate jdbc, DataSource dataSource) throws Exception {
		if (!tableExists(dataSource, "employees") || !tableExists(dataSource, "employee_probation")) {
			return;
		}
		if (!columnExists(dataSource, "employees", "employee_probation_id")) {
			jdbc.execute("ALTER TABLE employees ADD COLUMN employee_probation_id BIGINT NULL");
		}
		alignEmployeeProbationFkColumnType(jdbc);
		if (!hasForeignKeyOnColumn(jdbc, "employees", "employee_probation_id", "employee_probation", "id")) {
			jdbc.execute("""
					ALTER TABLE employees
					ADD CONSTRAINT fk_employees_employee_probation
					FOREIGN KEY (employee_probation_id) REFERENCES employee_probation(id)
					""");
		}
		log.info("employees.employee_probation_id migration finished");
	}

	private void alignEmployeeProbationFkColumnType(JdbcTemplate jdbc) {
		String referencedType = jdbc.queryForObject("""
				SELECT COLUMN_TYPE
				FROM information_schema.COLUMNS
				WHERE TABLE_SCHEMA = DATABASE()
				  AND TABLE_NAME = 'employee_probation'
				  AND COLUMN_NAME = 'id'
				""", String.class);
		String currentType = jdbc.queryForObject("""
				SELECT COLUMN_TYPE
				FROM information_schema.COLUMNS
				WHERE TABLE_SCHEMA = DATABASE()
				  AND TABLE_NAME = 'employees'
				  AND COLUMN_NAME = 'employee_probation_id'
				""", String.class);
		if (referencedType == null || currentType == null) {
			return;
		}
		if (!referencedType.equalsIgnoreCase(currentType)) {
			jdbc.execute("ALTER TABLE employees MODIFY COLUMN employee_probation_id " + referencedType + " NULL");
			log.info("Aligned employees.employee_probation_id type to {}", referencedType);
		}
	}

	private void copyDenormalizedProbationColumnsIntoEmployeeProbation(JdbcTemplate jdbc, DataSource dataSource)
			throws Exception {
		if (!tableExists(dataSource, "employees")) {
			return;
		}
		boolean hasMonth = columnExists(dataSource, "employees", "probation_month");
		boolean hasStart = columnExists(dataSource, "employees", "probation_start_date");
		boolean hasEnd = columnExists(dataSource, "employees", "probation_end_date");
		if (!hasMonth && !hasStart && !hasEnd) {
			return;
		}
		String sql = """
				SELECT id, probation_month, probation_start_date, probation_end_date
				FROM employees
				WHERE employee_probation_id IS NULL
				  AND (probation_month IS NOT NULL
				   OR probation_start_date IS NOT NULL
				   OR probation_end_date IS NOT NULL)
				""";
		List<Map<String, Object>> rows = jdbc.queryForList(sql);
		for (Map<String, Object> row : rows) {
			Long empId = ((Number) row.get("id")).longValue();
			Object month = row.get("probation_month");
			Object start = row.get("probation_start_date");
			Object end = row.get("probation_end_date");
			GeneratedKeyHolder keyHolder = new GeneratedKeyHolder();
			jdbc.update(connection -> {
				PreparedStatement ps = connection.prepareStatement(
						"INSERT INTO employee_probation (probation_month, probation_start_date, probation_end_date) VALUES (?,?,?)",
						Statement.RETURN_GENERATED_KEYS);
				if (month != null) {
					ps.setInt(1, ((Number) month).intValue());
				} else {
					ps.setNull(1, Types.INTEGER);
				}
				setDateParameter(ps, 2, start);
				setDateParameter(ps, 3, end);
				return ps;
			}, keyHolder);
			Number key = keyHolder.getKey();
			if (key != null) {
				jdbc.update("UPDATE employees SET employee_probation_id = ? WHERE id = ?", key.longValue(), empId);
			}
		}
		if (!rows.isEmpty()) {
			log.info("Copied {} denormalized probation row(s) into employee_probation", rows.size());
		}
	}

	private void dropDenormalizedProbationColumnsFromEmployees(JdbcTemplate jdbc, DataSource dataSource)
			throws Exception {
		if (!tableExists(dataSource, "employees")) {
			return;
		}
		for (String col : List.of("probation_month", "probation_start_date", "probation_end_date")) {
			if (columnExists(dataSource, "employees", col)) {
				jdbc.execute("ALTER TABLE employees DROP COLUMN `" + col + "`");
				log.info("Dropped legacy column employees.{}", col);
			}
		}
	}

	private void dropForeignKeysOnColumn(JdbcTemplate jdbc, String tableName, String columnName) {
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

	private void dropSecondaryIndexesOnColumn(JdbcTemplate jdbc, String tableName, String columnName) {
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

	private boolean hasForeignKeyOnColumn(JdbcTemplate jdbc, String tableName, String columnName, String refTable,
			String refColumn) {
		Integer n = jdbc.queryForObject("""
				SELECT COUNT(*)
				FROM information_schema.KEY_COLUMN_USAGE
				WHERE TABLE_SCHEMA = DATABASE()
				  AND TABLE_NAME = ?
				  AND COLUMN_NAME = ?
				  AND REFERENCED_TABLE_NAME = ?
				  AND REFERENCED_COLUMN_NAME = ?
				""",
				Integer.class,
				tableName,
				columnName,
				refTable,
				refColumn);
		return n != null && n > 0;
	}

	private boolean tableExists(DataSource dataSource, String tableName) throws Exception {
		try (Connection connection = dataSource.getConnection()) {
			DatabaseMetaData metaData = connection.getMetaData();
			try (ResultSet rs = metaData.getTables(connection.getCatalog(), null, tableName, new String[] { "TABLE" })) {
				return rs.next();
			}
		}
	}

	private boolean columnExists(DataSource dataSource, String tableName, String columnName) throws Exception {
		try (Connection connection = dataSource.getConnection()) {
			DatabaseMetaData metaData = connection.getMetaData();
			try (ResultSet rs = metaData.getColumns(connection.getCatalog(), null, tableName, columnName)) {
				return rs.next();
			}
		}
	}

	private static void setDateParameter(PreparedStatement ps, int index, Object value) throws SQLException {
		if (value == null) {
			ps.setNull(index, Types.DATE);
			return;
		}
		LocalDate d;
		if (value instanceof java.sql.Date) {
			d = ((java.sql.Date) value).toLocalDate();
		} else if (value instanceof LocalDate) {
			d = (LocalDate) value;
		} else if (value instanceof java.sql.Timestamp) {
			d = ((java.sql.Timestamp) value).toLocalDateTime().toLocalDate();
		} else if (value instanceof java.util.Date) {
			d = new java.sql.Date(((java.util.Date) value).getTime()).toLocalDate();
		} else {
			throw new IllegalArgumentException("Unsupported date type: " + value.getClass().getName());
		}
		ps.setDate(index, java.sql.Date.valueOf(d));
	}
}
