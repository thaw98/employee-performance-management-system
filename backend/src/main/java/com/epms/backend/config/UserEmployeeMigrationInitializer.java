package com.epms.backend.config;

import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.ResultSet;
import java.sql.Types;
import java.util.ArrayList;
import java.util.List;

import javax.sql.DataSource;

import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;

@Component
@Order(1)
@RequiredArgsConstructor
public class UserEmployeeMigrationInitializer implements CommandLineRunner {

	private final DataSource dataSource;
	private final JdbcTemplate jdbcTemplate;

	@Override
	public void run(String... args) throws Exception {
		if (!tableExists("users") || !tableExists("employees") || !columnExists("users", "employee_id")) {
			return;
		}

		int employeeIdColumnType = getColumnType("users", "employee_id");
		if (employeeIdColumnType == Types.BIGINT) {
			migrateNumericEmployeeIdColumnToEmployeeCode();
		}

		ensureEmployeeForeignKeyToEmployeesEmployeeId();
	}

	private void migrateNumericEmployeeIdColumnToEmployeeCode() throws Exception {
		// Clean up any stale temp column from interrupted runs.
		if (columnExists("users", "employee_id_tmp")) {
			jdbcTemplate.execute("ALTER TABLE users DROP COLUMN employee_id_tmp");
		}
		if (!columnExists("users", "employee_id_new")) {
			jdbcTemplate.execute("ALTER TABLE users ADD COLUMN employee_id_new VARCHAR(50) NULL");
		}

		// Numeric legacy shape: users.employee_id stores employees.id.
		jdbcTemplate.execute("""
				UPDATE users u
				JOIN employees e ON e.id = u.employee_id
				SET u.employee_id_new = e.employee_id
				WHERE u.employee_id_new IS NULL
				""");

		Integer unresolvedCount = jdbcTemplate.queryForObject(
				"SELECT COUNT(*) FROM users WHERE employee_id IS NOT NULL AND employee_id_new IS NULL",
				Integer.class);
		if (unresolvedCount != null && unresolvedCount > 0) {
			throw new IllegalStateException(
					"Cannot migrate users.employee_id values to employees.employee_id. "
							+ "Found users with employee_id values that do not match employees table.");
		}

		dropUserEmployeeForeignKeys();
		jdbcTemplate.execute("ALTER TABLE users DROP COLUMN employee_id");
		jdbcTemplate.execute("ALTER TABLE users CHANGE COLUMN employee_id_new employee_id VARCHAR(50) NULL");
		jdbcTemplate.execute("ALTER TABLE users MODIFY COLUMN employee_id VARCHAR(50) NOT NULL");
	}

	private void ensureEmployeeForeignKeyToEmployeesEmployeeId() throws Exception {
		if (!columnExists("users", "employee_id")) {
			return;
		}

		if (hasEmployeeIdForeignKeyToEmployeesEmployeeId()) {
			return;
		}

		dropUserEmployeeForeignKeys();
		jdbcTemplate.execute(
				"ALTER TABLE users ADD CONSTRAINT fk_users_employee FOREIGN KEY (employee_id) REFERENCES employees(employee_id)");
	}

	private void dropUserEmployeeForeignKeys() throws Exception {
		List<String> fkNames = getEmployeeForeignKeyNamesOnUsers();
		for (String fkName : fkNames) {
			jdbcTemplate.execute("ALTER TABLE users DROP FOREIGN KEY " + fkName);
		}
	}

	private List<String> getEmployeeForeignKeyNamesOnUsers() throws Exception {
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

	private boolean hasEmployeeIdForeignKeyToEmployeesEmployeeId() throws Exception {
		try (Connection connection = dataSource.getConnection()) {
			DatabaseMetaData metaData = connection.getMetaData();
			try (ResultSet rs = metaData.getImportedKeys(connection.getCatalog(), null, "users")) {
				while (rs.next()) {
					String fkColumn = rs.getString("FKCOLUMN_NAME");
					String pkTable = rs.getString("PKTABLE_NAME");
					String pkColumn = rs.getString("PKCOLUMN_NAME");
					if ("employee_id".equalsIgnoreCase(fkColumn)
							&& "employees".equalsIgnoreCase(pkTable)
							&& "employee_id".equalsIgnoreCase(pkColumn)) {
						return true;
					}
				}
			}
			return false;
		}
	}

	private int getColumnType(String tableName, String columnName) throws Exception {
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
