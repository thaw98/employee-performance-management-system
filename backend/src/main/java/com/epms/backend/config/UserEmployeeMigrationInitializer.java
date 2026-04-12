package com.epms.backend.config;

import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.ResultSet;
import java.sql.Types;
import java.util.ArrayList;
import java.util.List;

import javax.sql.DataSource;

import org.springframework.beans.BeansException;
import org.springframework.beans.factory.BeanCreationException;
import org.springframework.beans.factory.config.BeanPostProcessor;
import org.springframework.core.Ordered;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import lombok.extern.slf4j.Slf4j;

/**
 * Ensures {@code users.employee_id} is a BIGINT foreign key to {@code employees.id}. Legacy string
 * {@code users.employee_id} values are resolved using {@code employees.employee_id} when present.
 * <p>
 * Runs as a {@link BeanPostProcessor} on the primary {@code dataSource} bean so this executes
 * <strong>before</strong> Hibernate {@code ddl-auto} builds the schema. A {@link CommandLineRunner}
 * would run too late and Hibernate would attempt {@code ALTER COLUMN ... BIGINT} while legacy string
 * values (e.g. {@code MGR001}) are still stored.
 */
@Component
@Slf4j
public class UserEmployeeMigrationInitializer implements BeanPostProcessor, Ordered {

	/**
	 * Stub numeric {@code employees.employee_id} when the column is a numeric SQL type; VARCHAR stubs
	 * use {@code CONCAT('EPMS-', users.id)} instead.
	 */
	private static final long STUB_EMPLOYEE_ID_NUMERIC_BASE = 9_000_000_000L;

	@Override
	public int getOrder() {
		return 10;
	}

	@Override
	public Object postProcessAfterInitialization(Object bean, String beanName) throws BeansException {
		if (!"dataSource".equals(beanName) || !(bean instanceof DataSource dataSource)) {
			return bean;
		}
		try {
			runMigration(dataSource);
		} catch (Exception e) {
			throw new BeanCreationException("User/employee id migration failed", e);
		}
		return bean;
	}

	private void runMigration(DataSource dataSource) throws Exception {
		JdbcTemplate jdbcTemplate = new JdbcTemplate(dataSource);
		if (!tableExists(dataSource, "users") || !tableExists(dataSource, "employees")
				|| !columnExists(dataSource, "users", "employee_id")) {
			return;
		}

		// Legacy databases may still have users.employee_id -> employees.employee_id. Repair logic
		// assigns employees.id (PK), so the old constraint must be removed first; the correct FK to
		// employees(id) is added in ensureUsersForeignKeyToEmployeesId.
		dropUserEmployeeForeignKeys(dataSource, jdbcTemplate);

		// Fix rows where users.employee_id is 0, NULL, or not a real employees.id (e.g. MySQL coerced
		// legacy strings to 0, or a past failed migration left orphans). Must run even when the column
		// is already BIGINT — otherwise we skip varchar migration and never repair.
		repairInvalidUserEmployeeReferences(dataSource, jdbcTemplate);
		ensureStubEmployeesForOrphanUsers(dataSource, jdbcTemplate);
		repairInvalidUserEmployeeReferences(dataSource, jdbcTemplate);

		migrateUsersEmployeeIdToEmployeesPk(dataSource, jdbcTemplate);
		ensureStubEmployeesForOrphanUsers(dataSource, jdbcTemplate);
		repairInvalidUserEmployeeReferences(dataSource, jdbcTemplate);
		ensureUsersForeignKeyToEmployeesId(dataSource, jdbcTemplate);
	}

	/**
	 * Sets {@code users.employee_id} from {@code employees.id} using login email when the current FK
	 * value does not reference an existing employee. Skipped when {@code employees.email_address}
	 * was already dropped (see {@link EmployeeEmailAddressColumnDropInitializer}).
	 */
	private void repairInvalidUserEmployeeReferences(DataSource dataSource, JdbcTemplate jdbcTemplate)
			throws Exception {
		if (!columnExists(dataSource, "employees", "email_address")) {
			return;
		}
		int updated = jdbcTemplate.update(
				"""
						UPDATE users u
						INNER JOIN employees e
						  ON LOWER(TRIM(e.email_address)) = LOWER(TRIM(u.email))
						 AND TRIM(COALESCE(e.email_address, '')) <> ''
						SET u.employee_id = e.id
						WHERE NOT EXISTS (SELECT 1 FROM employees x WHERE x.id = u.employee_id)
						   OR u.employee_id = 0
						""");
		if (updated > 0) {
			log.info("Repaired {} user row(s): users.employee_id set from employees.id by email match", updated);
		}
	}

	/**
	 * Creates minimal {@code employees} rows when a user has no valid {@code users.employee_id}, so
	 * {@link #repairInvalidUserEmployeeReferences} can match on email. Only runs while
	 * {@code employees.email_address} still exists (removed later by {@link EmployeeEmailAddressColumnDropInitializer}).
	 * <p>
	 * After {@code email_address} is dropped, stubs use a unique business {@code employees.employee_id}:
	 * {@code CONCAT('EPMS-', users.id)} when the column is non-numeric, or {@code 9_000_000_000 + users.id}
	 * when the column is a numeric type, then link {@code users.employee_id} to the new row.
	 */
	private void ensureStubEmployeesForOrphanUsers(DataSource dataSource, JdbcTemplate jdbcTemplate) throws Exception {
		if (columnExists(dataSource, "employees", "email_address")) {
			int inserted = jdbcTemplate.update(
					"""
							INSERT INTO employees (employee_name, email_address)
							SELECT
							  COALESCE(NULLIF(TRIM(SUBSTRING_INDEX(TRIM(u.email), '@', 1)), ''), 'User') AS employee_name,
							  TRIM(u.email) AS email_address
							FROM users u
							WHERE TRIM(COALESCE(u.email, '')) <> ''
							  AND (
							    u.employee_id IS NULL
							    OR u.employee_id = 0
							    OR NOT EXISTS (SELECT 1 FROM employees ex WHERE ex.id = u.employee_id)
							  )
							  AND NOT EXISTS (
							    SELECT 1 FROM employees e
							    WHERE LOWER(TRIM(e.email_address)) = LOWER(TRIM(u.email))
							  )
							""");
			if (inserted > 0) {
				log.info("Inserted {} stub employee row(s) for user(s) with no employees.email_address match", inserted);
			}
			return;
		}

		int employeeIdSqlType = getColumnType(dataSource, "employees", "employee_id");
		boolean numericEmployeeId = isNumericSqlType(employeeIdSqlType);
		int userIdSqlType = getColumnType(dataSource, "users", "id");
		boolean numericUserId = isNumericSqlType(userIdSqlType);
		// Legacy DBs may use VARCHAR primary keys (e.g. "USR-1"); arithmetic on u.id then fails.
		String stubNumericExpr = numericUserId
				? "(" + STUB_EMPLOYEE_ID_NUMERIC_BASE + " + u.id)"
				: "(" + STUB_EMPLOYEE_ID_NUMERIC_BASE
						+ " + (CRC32(CONCAT('epms|user|', CAST(u.id AS CHAR))) % 1000000000))";
		String stubKeySql = numericEmployeeId
				? stubNumericExpr
				: "CONCAT('EPMS-', CAST(u.id AS CHAR))";

		int inserted = jdbcTemplate.update(
				"""
						INSERT INTO employees (employee_name, employee_id)
						SELECT
						  COALESCE(NULLIF(TRIM(SUBSTRING_INDEX(TRIM(COALESCE(u.email, '')), '@', 1)), ''), CONCAT('User ', u.id)) AS employee_name,
						  %s AS employee_id
						FROM users u
						WHERE (
						    u.employee_id IS NULL
						    OR u.employee_id = 0
						    OR NOT EXISTS (SELECT 1 FROM employees ex WHERE ex.id = u.employee_id)
						  )
						  AND NOT EXISTS (
						    SELECT 1 FROM employees e WHERE e.employee_id = %s
						  )
						""".formatted(stubKeySql, stubKeySql));
		if (inserted > 0) {
			log.info(
					"Inserted {} stub employee row(s) after employees.email_address was dropped (business key: {})",
					inserted,
					numericEmployeeId ? STUB_EMPLOYEE_ID_NUMERIC_BASE + " + users.id" : "CONCAT('EPMS-', users.id)");
		}
		int linked = jdbcTemplate.update(
				"""
						UPDATE users u
						INNER JOIN employees e ON e.employee_id = %s
						SET u.employee_id = e.id
						WHERE u.employee_id IS NULL
						   OR u.employee_id = 0
						   OR NOT EXISTS (SELECT 1 FROM employees ex WHERE ex.id = u.employee_id)
						""".formatted(stubKeySql));
		if (linked > 0) {
			log.info(
					"Linked {} user row(s) to migration stub employees ({})",
					linked,
					numericEmployeeId ? STUB_EMPLOYEE_ID_NUMERIC_BASE + " + users.id" : "CONCAT('EPMS-', users.id)");
		}
	}

	private static boolean isNumericSqlType(int sqlType) {
		return sqlType == Types.BIGINT
				|| sqlType == Types.INTEGER
				|| sqlType == Types.SMALLINT
				|| sqlType == Types.TINYINT
				|| sqlType == Types.FLOAT
				|| sqlType == Types.REAL
				|| sqlType == Types.DOUBLE
				|| sqlType == Types.DECIMAL
				|| sqlType == Types.NUMERIC;
	}

	private void migrateUsersEmployeeIdToEmployeesPk(DataSource dataSource, JdbcTemplate jdbcTemplate) throws Exception {
		int type = getColumnType(dataSource, "users", "employee_id");
		if (type == Types.BIGINT) {
			return;
		}
		if (type != Types.VARCHAR && type != Types.CHAR && type != Types.LONGNVARCHAR && type != Types.LONGVARCHAR) {
			throw new IllegalStateException("Unsupported users.employee_id SQL type for migration: " + type);
		}

		log.info("Migrating users.employee_id from string business key to employees.id (BIGINT)");
		dropUserEmployeeForeignKeys(dataSource, jdbcTemplate);

		final String tmp = "employee_id_to_pk_tmp";
		if (columnExists(dataSource, "users", tmp)) {
			jdbcTemplate.execute("ALTER TABLE users DROP COLUMN " + tmp);
		}
		jdbcTemplate.execute("ALTER TABLE users ADD COLUMN " + tmp + " BIGINT NULL");

		if (columnExists(dataSource, "employees", "employee_id")) {
			jdbcTemplate.execute(
					"""
							UPDATE users u
							INNER JOIN employees e
							  ON LOWER(TRIM(e.employee_id)) = LOWER(TRIM(CAST(u.employee_id AS CHAR)))
							SET u.%s = e.id
							""".formatted(tmp));
		}

		// Legacy string was numeric employee PK
		jdbcTemplate.execute(
				"""
						UPDATE users u
						INNER JOIN employees e ON e.id = CAST(u.employee_id AS UNSIGNED)
						SET u.%s = e.id
						WHERE u.employee_id REGEXP '^[0-9]+$'
						  AND u.%s IS NULL
						""".formatted(tmp, tmp));

		// Rows with NULL legacy employee_id still need employees.id in tmp before NOT NULL — e.g. user
		// rows whose email matched a stub employee but employee_id was never back-filled.
		if (columnExists(dataSource, "employees", "email_address")) {
			jdbcTemplate.execute(
					"""
							UPDATE users u
							INNER JOIN employees e
							  ON LOWER(TRIM(e.email_address)) = LOWER(TRIM(u.email))
							 AND TRIM(COALESCE(e.email_address, '')) <> ''
							 AND TRIM(COALESCE(u.email, '')) <> ''
							SET u.%s = e.id
							WHERE u.%s IS NULL
							""".formatted(tmp, tmp));

			int stubsForTmp = jdbcTemplate.update(
					"""
							INSERT INTO employees (employee_name, email_address)
							SELECT
							  COALESCE(NULLIF(TRIM(SUBSTRING_INDEX(TRIM(COALESCE(u.email, '')), '@', 1)), ''), CONCAT('User ', u.id)) AS employee_name,
							  CASE WHEN TRIM(COALESCE(u.email, '')) <> ''
							    THEN TRIM(u.email)
							    ELSE CONCAT('user-', u.id, '@migration.stub')
							  END AS email_address
							FROM users u
							WHERE u.%s IS NULL
							  AND NOT EXISTS (
							    SELECT 1 FROM employees ex
							    WHERE ex.email_address = CASE WHEN TRIM(COALESCE(u.email, '')) <> ''
							      THEN TRIM(u.email)
							      ELSE CONCAT('user-', u.id, '@migration.stub')
							    END
							  )
							""".formatted(tmp));
			if (stubsForTmp > 0) {
				log.info("Inserted {} stub employee row(s) so users.{} can be resolved for NOT NULL migration",
						stubsForTmp, tmp);
			}

			jdbcTemplate.execute(
					"""
							UPDATE users u
							INNER JOIN employees e
							  ON (
							    (TRIM(COALESCE(u.email, '')) <> ''
							      AND LOWER(TRIM(e.email_address)) = LOWER(TRIM(u.email)))
							    OR (TRIM(COALESCE(u.email, '')) = ''
							      AND e.email_address = CONCAT('user-', u.id, '@migration.stub'))
							  )
							SET u.%s = e.id
							WHERE u.%s IS NULL
							""".formatted(tmp, tmp));
		}

		Integer unresolved = jdbcTemplate.queryForObject(
				"SELECT COUNT(*) FROM users WHERE " + tmp + " IS NULL",
				Integer.class);
		if (unresolved != null && unresolved > 0) {
			List<String> samples = jdbcTemplate.query(
					"""
							SELECT CONCAT('id=', u.id, ', employee_id=', u.employee_id, ', email=', u.email)
							FROM users u
							WHERE u.%s IS NULL
							LIMIT 10
							""".formatted(tmp),
					(rs, rowNum) -> rs.getString(1));
			jdbcTemplate.execute("ALTER TABLE users DROP COLUMN " + tmp);
			throw new IllegalStateException(
					"Cannot migrate users.employee_id: " + unresolved
							+ " row(s) do not match employees (by business key or email). Examples: " + samples);
		}

		jdbcTemplate.execute("ALTER TABLE users DROP COLUMN employee_id");
		jdbcTemplate.execute("ALTER TABLE users CHANGE COLUMN " + tmp + " employee_id BIGINT NOT NULL");
	}

	private void ensureUsersForeignKeyToEmployeesId(DataSource dataSource, JdbcTemplate jdbcTemplate) throws Exception {
		if (hasUsersForeignKeyToEmployeesId(dataSource)) {
			return;
		}
		int orphanCount = countOrphanUserEmployeeReferences(jdbcTemplate);
		if (orphanCount > 0) {
			List<String> samples = jdbcTemplate.query(
					"""
							SELECT CONCAT('user id=', u.id, ', employee_id=', u.employee_id, ', email=', u.email)
							FROM users u
							LEFT JOIN employees e ON e.id = u.employee_id
							WHERE (u.employee_id IS NULL OR u.employee_id = 0 OR e.id IS NULL)
							LIMIT 15
							""",
					(rs, rowNum) -> rs.getString(1));
			throw new IllegalStateException(
					"Cannot add users.employee_id foreign key: " + orphanCount
							+ " user row(s) still reference a missing employees.id after repair. "
							+ "Fix users.employee_id or delete orphan users. Rows: "
							+ samples);
		}
		dropUserEmployeeForeignKeys(dataSource, jdbcTemplate);
		jdbcTemplate.execute(
				"ALTER TABLE users ADD CONSTRAINT fk_users_employee FOREIGN KEY (employee_id) REFERENCES employees(id)");
	}

	private int countOrphanUserEmployeeReferences(JdbcTemplate jdbcTemplate) {
		Integer count = jdbcTemplate.queryForObject(
				"""
						SELECT COUNT(*)
						FROM users u
						LEFT JOIN employees e ON e.id = u.employee_id
						WHERE u.employee_id IS NOT NULL
						  AND e.id IS NULL
						""",
				Integer.class);
		return count == null ? 0 : count;
	}

	private boolean hasUsersForeignKeyToEmployeesId(DataSource dataSource) throws Exception {
		try (Connection connection = dataSource.getConnection()) {
			DatabaseMetaData metaData = connection.getMetaData();
			try (ResultSet rs = metaData.getImportedKeys(connection.getCatalog(), null, "users")) {
				while (rs.next()) {
					if ("employee_id".equalsIgnoreCase(rs.getString("FKCOLUMN_NAME"))
							&& "employees".equalsIgnoreCase(rs.getString("PKTABLE_NAME"))
							&& "id".equalsIgnoreCase(rs.getString("PKCOLUMN_NAME"))) {
						return true;
					}
				}
			}
			return false;
		}
	}

	private void dropUserEmployeeForeignKeys(DataSource dataSource, JdbcTemplate jdbcTemplate) throws Exception {
		List<String> fkNames = getEmployeeForeignKeyNamesOnUsers(dataSource);
		for (String fkName : fkNames) {
			jdbcTemplate.execute("ALTER TABLE users DROP FOREIGN KEY " + fkName);
		}
	}

	private List<String> getEmployeeForeignKeyNamesOnUsers(DataSource dataSource) throws Exception {
		try (Connection connection = dataSource.getConnection()) {
			DatabaseMetaData metaData = connection.getMetaData();
			List<String> names = new ArrayList<>();
			try (ResultSet rs = metaData.getImportedKeys(connection.getCatalog(), null, "users")) {
				while (rs.next()) {
					String fkColumn = rs.getString("FKCOLUMN_NAME");
					String pkTable = rs.getString("PKTABLE_NAME");
					String fkName = rs.getString("FK_NAME");
					if ("employee_id".equalsIgnoreCase(fkColumn)
							&& "employees".equalsIgnoreCase(pkTable)
							&& fkName != null
							&& !names.contains(fkName)) {
						names.add(fkName);
					}
				}
			}
			return names;
		}
	}

	private int getColumnType(DataSource dataSource, String tableName, String columnName) throws Exception {
		try (Connection connection = dataSource.getConnection()) {
			DatabaseMetaData metaData = connection.getMetaData();
			try (ResultSet rs = metaData.getColumns(connection.getCatalog(), null, tableName, columnName)) {
				if (!rs.next()) {
					throw new IllegalStateException("Column not found: " + tableName + "." + columnName);
				}
				return rs.getInt("DATA_TYPE");
			}
		}
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
}
