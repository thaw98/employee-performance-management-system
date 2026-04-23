package com.epms.backend.config;

import javax.sql.DataSource;

import org.springframework.beans.BeansException;
import org.springframework.beans.factory.BeanCreationException;
import org.springframework.beans.factory.config.BeanPostProcessor;
import org.springframework.core.Ordered;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import lombok.extern.slf4j.Slf4j;

/**
 * Creates {@code department_has_position} join table and removes {@code department_id} from
 * {@code position} table. Also adds {@code department_position_id} to {@code employee} table.
 */
@Component
@Slf4j
public class DepartmentPositionSchemaMigrationInitializer implements BeanPostProcessor, Ordered {

	@Override
	public int getOrder() {
		return 20;
	}

	@Override
	public Object postProcessAfterInitialization(Object bean, String beanName) throws BeansException {
		if (!"dataSource".equals(beanName) || !(bean instanceof DataSource dataSource)) {
			return bean;
		}
		try {
			migrate(dataSource);
		} catch (Exception e) {
			throw new BeanCreationException("department_has_position migration failed", e);
		}
		return bean;
	}

	private void migrate(DataSource dataSource) {
		JdbcTemplate jdbc = new JdbcTemplate(dataSource);
		createDepartmentHasPositionTable(jdbc);
		dropPositionDepartmentIdColumn(jdbc);
		addEmployeeDepartmentPositionIdColumn(jdbc);
	}

	private void createDepartmentHasPositionTable(JdbcTemplate jdbc) {
		if (tableExists(jdbc, "department_has_position")) {
			log.info("department_has_position table already exists");
			return;
		}

		jdbc.execute("""
				CREATE TABLE department_has_position (
					id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
					department_id BIGINT NOT NULL,
					position_id BIGINT NOT NULL,
					status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
					created_by BIGINT NULL,
					created_on DATETIME NULL,
					updated_by BIGINT NULL,
					updated_on DATETIME NULL,
					UNIQUE KEY uq_dept_position (department_id, position_id),
					INDEX idx_dhp_department (department_id),
					INDEX idx_dhp_position (position_id),
					CONSTRAINT fk_dept_pos_join_department FOREIGN KEY (department_id) REFERENCES `department`(`department_id`),
					CONSTRAINT fk_dept_pos_join_position FOREIGN KEY (position_id) REFERENCES `position`(`position_id`)
				) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
				""");
		log.info("Created department_has_position table");
	}

	private void dropPositionDepartmentIdColumn(JdbcTemplate jdbc) {
		if (!tableExists(jdbc, "position")) {
			return;
		}
		if (!columnExists(jdbc, "position", "department_id")) {
			log.info("position.department_id already dropped or not present");
			return;
		}

		dropAllForeignKeysOnColumn(jdbc, "position", "department_id");
		jdbc.execute("ALTER TABLE `position` DROP COLUMN department_id");
		log.info("Dropped position.department_id column");
	}

	private void addEmployeeDepartmentPositionIdColumn(JdbcTemplate jdbc) {
		if (!tableExists(jdbc, "employee")) {
			return;
		}
		if (columnExists(jdbc, "employee", "department_position_id")) {
			log.info("employee.department_position_id already exists");
			return;
		}

		jdbc.execute("ALTER TABLE `employee` ADD COLUMN department_position_id BIGINT NULL");
		jdbc.execute("""
				ALTER TABLE `employee`
				ADD CONSTRAINT fk_employee_department_position
				FOREIGN KEY (department_position_id) REFERENCES department_has_position(id)
				""");
		log.info("Added employee.department_position_id column with FK");
	}

	private void dropForeignKeyIfExists(JdbcTemplate jdbc, String tableName, String constraintName) {
		if (fkConstraintExists(jdbc, tableName, constraintName)) {
			jdbc.execute(String.format("ALTER TABLE `%s` DROP FOREIGN KEY %s", tableName, constraintName));
			log.info("Dropped FK {} from table {}", constraintName, tableName);
		}
	}

	private void dropAllForeignKeysOnColumn(JdbcTemplate jdbc, String tableName, String columnName) {
		jdbc.query(
				"""
						SELECT CONSTRAINT_NAME
						FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
						WHERE TABLE_SCHEMA = DATABASE()
						  AND TABLE_NAME = ?
						  AND COLUMN_NAME = ?
						  AND REFERENCED_TABLE_NAME IS NOT NULL
						""",
				rs -> {
					String constraintName = rs.getString("CONSTRAINT_NAME");
					dropForeignKeyIfExists(jdbc, tableName, constraintName);
				},
				tableName,
				columnName);
	}

	private static boolean fkConstraintExists(JdbcTemplate jdbc, String tableName, String constraintName) {
		Integer n = jdbc.queryForObject(
				"""
						SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
						WHERE CONSTRAINT_SCHEMA = DATABASE()
						  AND TABLE_NAME = ?
						  AND CONSTRAINT_NAME = ?
						  AND CONSTRAINT_TYPE = 'FOREIGN KEY'
						""",
				Integer.class,
				tableName,
				constraintName);
		return n != null && n > 0;
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