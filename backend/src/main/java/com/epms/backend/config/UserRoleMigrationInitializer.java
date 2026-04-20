package com.epms.backend.config;

import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.ResultSet;

import javax.sql.DataSource;

import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;

@Component
@Order(0)
@RequiredArgsConstructor
public class UserRoleMigrationInitializer implements CommandLineRunner {

	private final DataSource dataSource;
	private final JdbcTemplate jdbcTemplate;

	@Override
	public void run(String... args) throws Exception {
		if (!tableExists("users")) {
			return;
		}

		boolean hasLegacyRoleColumn = columnExists("users", "role");
		boolean hasRoleIdColumn = columnExists("users", "role_id");

		if (!hasLegacyRoleColumn) {
			return;
		}

		if (!hasRoleIdColumn) {
			jdbcTemplate.execute("ALTER TABLE users ADD COLUMN role_id BIGINT NULL");
		}

		// Map legacy enum/text role values to role.id (HR = 1, etc).
		jdbcTemplate.execute("""
				UPDATE users u
				JOIN `role` r
				  ON UPPER(REPLACE(r.name, ' ', '_')) = UPPER(u.role)
				SET u.role_id = r.id
				WHERE u.role_id IS NULL
				""");

		Integer unresolvedCount = jdbcTemplate.queryForObject(
				"SELECT COUNT(*) FROM users WHERE role_id IS NULL",
				Integer.class);

		if (unresolvedCount != null && unresolvedCount > 0) {
			throw new IllegalStateException(
					"Found users with unmapped legacy ROLE values. Please fix role values before migration.");
		}

		jdbcTemplate.execute("ALTER TABLE users MODIFY COLUMN role_id BIGINT NOT NULL");
		if (!foreignKeyExists("users", "fk_users_role")) {
			jdbcTemplate.execute("ALTER TABLE users ADD CONSTRAINT fk_users_role FOREIGN KEY (role_id) REFERENCES `role`(id)");
		}
		jdbcTemplate.execute("ALTER TABLE users DROP COLUMN role");
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

	private boolean foreignKeyExists(String tableName, String fkName) throws Exception {
		try (Connection connection = dataSource.getConnection()) {
			DatabaseMetaData metaData = connection.getMetaData();
			try (ResultSet rs = metaData.getImportedKeys(connection.getCatalog(), null, tableName)) {
				while (rs.next()) {
					String existingFkName = rs.getString("FK_NAME");
					if (fkName.equalsIgnoreCase(existingFkName)) {
						return true;
					}
				}
				return false;
			}
		}
	}
}
