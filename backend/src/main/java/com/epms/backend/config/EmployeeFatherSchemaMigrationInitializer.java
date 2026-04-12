package com.epms.backend.config;

import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.Statement;
import java.util.List;
import java.util.Map;

import javax.sql.DataSource;

import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Migrates legacy father / employee_info shapes to: {@code employees.employee_father_id}
 * referencing {@code employee_father.id} (father fields only on {@code employee_father}).
 */
@Component
@Order(2)
@RequiredArgsConstructor
@Slf4j
public class EmployeeFatherSchemaMigrationInitializer implements CommandLineRunner {

	private final DataSource dataSource;
	private final JdbcTemplate jdbcTemplate;

	@Override
	public void run(String... args) throws Exception {
		migrateLegacyEmployeeInfoIdOnEmployeeFather();
		migrateEmployeeFatherFkOntoEmployees();
		dropDenormalizedFatherColumnsFromEmployees();
		dropEmployeeInfoTableIfPresent();
	}

	/**
	 * Legacy: {@code employee_father.employee_info_id} and {@code employee_father.employee_id} (FK to
	 * {@code employees.id}). New installs skip this.
	 */
	private void migrateLegacyEmployeeInfoIdOnEmployeeFather() throws Exception {
		if (!tableExists("employee_father") || !columnExists("employee_father", "employee_info_id")) {
			return;
		}

		log.info("Migrating employee_father: dropping employee_info_id, using employee_id only");

		if (!columnExists("employee_father", "employee_id")) {
			jdbcTemplate.execute("ALTER TABLE employee_father ADD COLUMN employee_id BIGINT NULL");
		}

		if (tableExists("employee_info")) {
			jdbcTemplate.execute("""
					UPDATE employee_father ef
					INNER JOIN employee_info ei ON ei.id = ef.employee_info_id
					SET ef.employee_id = ei.employee_ref_id
					""");
		}

		Integer nullEmployeeIds = jdbcTemplate.queryForObject(
				"SELECT COUNT(*) FROM employee_father WHERE employee_id IS NULL",
				Integer.class);
		if (nullEmployeeIds != null && nullEmployeeIds > 0) {
			log.warn(
					"Skipping employee_father migration: {} row(s) have NULL employee_id; "
							+ "repair data or restore employee_info, then restart.",
					nullEmployeeIds);
			return;
		}

		dropForeignKeysOnColumn("employee_father", "employee_info_id");
		dropSecondaryIndexesOnColumn("employee_father", "employee_info_id");

		jdbcTemplate.execute("ALTER TABLE employee_father DROP COLUMN employee_info_id");
		jdbcTemplate.execute("ALTER TABLE employee_father MODIFY employee_id BIGINT NOT NULL");

		if (!hasUniqueIndexOnColumn("employee_father", "employee_id")) {
			jdbcTemplate.execute(
					"ALTER TABLE employee_father ADD UNIQUE KEY uq_employee_father_employee_id (employee_id)");
		}
		if (!hasForeignKeyOnColumn("employee_father", "employee_id", "employees", "id")) {
			jdbcTemplate.execute("""
					ALTER TABLE employee_father
					ADD CONSTRAINT fk_employee_father_employee
					FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
					""");
		}

		log.info("employee_father legacy employee_info_id migration finished");
	}

	private void migrateEmployeeFatherFkOntoEmployees() throws Exception {
		if (!tableExists("employees") || !tableExists("employee_father")) {
			return;
		}

		if (!columnExists("employees", "employee_father_id")) {
			jdbcTemplate.execute("ALTER TABLE employees ADD COLUMN employee_father_id BIGINT NULL");
		}

		if (columnExists("employee_father", "employee_id")) {
			jdbcTemplate.execute("""
					UPDATE employees e
					INNER JOIN employee_father f ON f.employee_id = e.id
					SET e.employee_father_id = f.id
					""");
		}

		if (columnExists("employees", "father_name")) {
			copyDenormalizedFatherRowsIntoEmployeeFather();
		}

		if (columnExists("employee_father", "employee_id")) {
			dropForeignKeysOnColumn("employee_father", "employee_id");
			dropSecondaryIndexesOnColumn("employee_father", "employee_id");
			jdbcTemplate.execute("ALTER TABLE employee_father DROP COLUMN employee_id");
		}

		if (!hasForeignKeyOnColumn("employees", "employee_father_id", "employee_father", "id")) {
			jdbcTemplate.execute("""
					ALTER TABLE employees
					ADD CONSTRAINT fk_employees_employee_father
					FOREIGN KEY (employee_father_id) REFERENCES employee_father(id)
					""");
		}

		log.info("employees.employee_father_id migration finished");
	}

	private void copyDenormalizedFatherRowsIntoEmployeeFather() {
		String sql = """
				SELECT id, father_name, father_nrc_no, father_occupation
				FROM employees
				WHERE employee_father_id IS NULL
				  AND (father_name IS NOT NULL OR father_nrc_no IS NOT NULL OR father_occupation IS NOT NULL)
				""";
		List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql);
		for (Map<String, Object> row : rows) {
			Long empId = ((Number) row.get("id")).longValue();
			String fatherName = (String) row.get("father_name");
			String fatherNrcNo = (String) row.get("father_nrc_no");
			String fatherOccupation = (String) row.get("father_occupation");
			GeneratedKeyHolder keyHolder = new GeneratedKeyHolder();
			jdbcTemplate.update(connection -> {
				PreparedStatement ps = connection.prepareStatement(
						"INSERT INTO employee_father (father_name, father_nrc_no, father_occupation) VALUES (?,?,?)",
						Statement.RETURN_GENERATED_KEYS);
				ps.setString(1, fatherName);
				ps.setString(2, fatherNrcNo);
				ps.setString(3, fatherOccupation);
				return ps;
			}, keyHolder);
			Number key = keyHolder.getKey();
			if (key != null) {
				jdbcTemplate.update("UPDATE employees SET employee_father_id = ? WHERE id = ?", key.longValue(), empId);
			}
		}
	}

	private void dropDenormalizedFatherColumnsFromEmployees() throws Exception {
		if (!tableExists("employees")) {
			return;
		}
		for (String col : List.of("father_name", "father_occupation", "father_nrc_no")) {
			if (columnExists("employees", col)) {
				jdbcTemplate.execute("ALTER TABLE employees DROP COLUMN `" + col + "`");
				log.info("Dropped legacy column employees.{}", col);
			}
		}
	}

	private void dropEmployeeInfoTableIfPresent() throws Exception {
		if (!tableExists("employee_info")) {
			return;
		}
		jdbcTemplate.execute("DROP TABLE IF EXISTS employee_info");
		log.info("Dropped table employee_info");
	}

	private void dropForeignKeysOnColumn(String tableName, String columnName) throws Exception {
		List<String> names = jdbcTemplate.query("""
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
				jdbcTemplate.execute("ALTER TABLE `" + tableName + "` DROP FOREIGN KEY `" + name + "`");
			}
		}
	}

	private void dropSecondaryIndexesOnColumn(String tableName, String columnName) throws Exception {
		List<String> indexNames = jdbcTemplate.query("""
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
			jdbcTemplate.execute("ALTER TABLE `" + tableName + "` DROP INDEX `" + indexName + "`");
		}
	}

	private boolean hasUniqueIndexOnColumn(String tableName, String columnName) throws Exception {
		Integer n = jdbcTemplate.queryForObject("""
				SELECT COUNT(*)
				FROM information_schema.STATISTICS
				WHERE TABLE_SCHEMA = DATABASE()
				  AND TABLE_NAME = ?
				  AND COLUMN_NAME = ?
				  AND NON_UNIQUE = 0
				  AND INDEX_NAME != 'PRIMARY'
				""",
				Integer.class,
				tableName,
				columnName);
		return n != null && n > 0;
	}

	private boolean hasForeignKeyOnColumn(String tableName, String columnName, String refTable, String refColumn)
			throws Exception {
		Integer n = jdbcTemplate.queryForObject("""
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

	private boolean tableExists(String tableName) throws Exception {
		try (Connection connection = dataSource.getConnection()) {
			DatabaseMetaData metaData = connection.getMetaData();
			try (ResultSet rs = metaData.getTables(connection.getCatalog(), null, tableName, new String[] { "TABLE" })) {
				return rs.next();
			}
		}
	}

	private boolean columnExists(String tableName, String columnName) throws Exception {
		try (Connection connection = dataSource.getConnection()) {
			DatabaseMetaData metaData = connection.getMetaData();
			try (ResultSet rs = metaData.getColumns(connection.getCatalog(), null, tableName, columnName)) {
				return rs.next();
			}
		}
	}
}
