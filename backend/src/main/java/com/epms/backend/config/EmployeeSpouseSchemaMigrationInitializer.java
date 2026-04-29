package com.epms.backend.config;

import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.Statement;
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
 * Normalizes spouse fields to {@code employee_spouse} with {@code employees.employee_spouse_id}
 * referencing {@code employee_spouse.spouse_id}, and drops denormalized spouse columns on {@code employees}.
 * <p>
 * Runs as a {@link BeanPostProcessor} on the primary {@code dataSource} bean so this executes
 * before Hibernate {@code ddl-auto} applies the new mapping; otherwise legacy columns could be
 * dropped before data is copied.
 */
@Component
@Slf4j
public class EmployeeSpouseSchemaMigrationInitializer implements BeanPostProcessor {

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
			throw new BeanCreationException("employee_spouse migration failed", e);
		}
		return bean;
	}

	private void runMigration(DataSource dataSource) throws Exception {
		JdbcTemplate jdbcTemplate = new JdbcTemplate(dataSource);
		ensureEmployeeSpouseTable(jdbcTemplate, dataSource);
		ensureEmployeeSpousePrimaryKeyColumn(jdbcTemplate, dataSource);
		ensureEmployeeSpouseFkOnEmployees(jdbcTemplate, dataSource);
		copyDenormalizedSpouseRowsIntoEmployeeSpouse(jdbcTemplate, dataSource);
		dropDenormalizedSpouseColumnsFromEmployees(jdbcTemplate, dataSource);
	}


	private void ensureEmployeeSpouseTable(JdbcTemplate jdbcTemplate, DataSource dataSource) throws Exception {
		if (tableExists(dataSource, "employee_spouse")) {
			return;
		}
		jdbcTemplate.execute("""
				CREATE TABLE employee_spouse (
				  spouse_id BIGINT PRIMARY KEY AUTO_INCREMENT,
				  spouse_name VARCHAR(100) NULL,
				  spouse_nrc VARCHAR(100) NULL
				)
				""");
		log.info("Created table employee_spouse");
	}

	private void ensureEmployeeSpousePrimaryKeyColumn(JdbcTemplate jdbcTemplate, DataSource dataSource) throws Exception {
		if (!tableExists(dataSource, "employee_spouse")) {
			return;
		}
		boolean hasLegacyId = columnExists(dataSource, "employee_spouse", "id");
		boolean hasSpouseId = columnExists(dataSource, "employee_spouse", "spouse_id");
		if (hasLegacyId && !hasSpouseId) {
			jdbcTemplate.execute("ALTER TABLE employee_spouse CHANGE COLUMN id spouse_id BIGINT NOT NULL AUTO_INCREMENT");
			log.info("Renamed employee_spouse.id -> spouse_id");
		}
		if (columnExists(dataSource, "employee_spouse", "spouse_nrc_no")
				&& !columnExists(dataSource, "employee_spouse", "spouse_nrc")) {
			jdbcTemplate.execute(
					"ALTER TABLE employee_spouse CHANGE COLUMN spouse_nrc_no spouse_nrc VARCHAR(100) NULL");
			log.info("Renamed employee_spouse.spouse_nrc_no -> spouse_nrc");
		}
		if (columnExists(dataSource, "employee_spouse", "spouse_occupation")) {
			jdbcTemplate.execute("ALTER TABLE employee_spouse DROP COLUMN spouse_occupation");
			log.info("Dropped employee_spouse.spouse_occupation");
		}
		if (columnExists(dataSource, "employee_spouse", "spouse_no")) {
			jdbcTemplate.execute("ALTER TABLE employee_spouse DROP COLUMN spouse_no");
			log.info("Dropped employee_spouse.spouse_no");
		}
	}

	private void ensureEmployeeSpouseFkOnEmployees(JdbcTemplate jdbcTemplate, DataSource dataSource) throws Exception {
		if (!tableExists(dataSource, "employees") || !tableExists(dataSource, "employee_spouse")) {
			return;
		}
		if (!columnExists(dataSource, "employees", "employee_spouse_id")) {
			jdbcTemplate.execute("ALTER TABLE employees ADD COLUMN employee_spouse_id BIGINT NULL");
		}
		if (!hasForeignKeyOnColumn(jdbcTemplate, "employees", "employee_spouse_id", "employee_spouse", "spouse_id")) {
			jdbcTemplate.execute("""
					ALTER TABLE employees
					ADD CONSTRAINT fk_employees_employee_spouse
					FOREIGN KEY (employee_spouse_id) REFERENCES employee_spouse(spouse_id)
					""");
		}
		log.info("employees.employee_spouse_id migration finished");
	}

	private void copyDenormalizedSpouseRowsIntoEmployeeSpouse(JdbcTemplate jdbcTemplate, DataSource dataSource)
			throws Exception {
		if (!tableExists(dataSource, "employees") || !columnExists(dataSource, "employees", "spouse_name")) {
			return;
		}
		boolean hasLegacyNrc = columnExists(dataSource, "employees", "spouse_nrc_no");
		boolean hasModernNrc = columnExists(dataSource, "employees", "spouse_nrc");
		if (!hasLegacyNrc && !hasModernNrc) {
			return;
		}
		String nrcSelect = hasLegacyNrc ? "spouse_nrc_no" : "NULL as spouse_nrc_no";
		String altNrcSelect = hasModernNrc ? "spouse_nrc" : "NULL as spouse_nrc";
		String nrcFilter = hasLegacyNrc && hasModernNrc
				? "(spouse_name IS NOT NULL OR spouse_nrc_no IS NOT NULL OR spouse_nrc IS NOT NULL)"
				: hasLegacyNrc
						? "(spouse_name IS NOT NULL OR spouse_nrc_no IS NOT NULL)"
						: "(spouse_name IS NOT NULL OR spouse_nrc IS NOT NULL)";
		String sql = """
				SELECT id, spouse_name, %s, %s
				FROM employees
				WHERE employee_spouse_id IS NULL
				  AND %s
				""".formatted(nrcSelect, altNrcSelect, nrcFilter);
		List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql);
		for (Map<String, Object> row : rows) {
			Long empId = ((Number) row.get("id")).longValue();
			String spouseName = (String) row.get("spouse_name");
			String spouseNrcNo = (String) row.get("spouse_nrc_no");
			if (spouseNrcNo == null) {
				spouseNrcNo = (String) row.get("spouse_nrc");
			}
			final String spouseNrcValue = spouseNrcNo;
			GeneratedKeyHolder keyHolder = new GeneratedKeyHolder();
			jdbcTemplate.update(connection -> {
				PreparedStatement ps = connection.prepareStatement(
						"INSERT INTO employee_spouse (spouse_name, spouse_nrc) VALUES (?,?)",
						Statement.RETURN_GENERATED_KEYS);
				ps.setString(1, spouseName);
				ps.setString(2, spouseNrcValue);
				return ps;
			}, keyHolder);
			Number key = keyHolder.getKey();
			if (key != null) {
				jdbcTemplate.update("UPDATE employees SET employee_spouse_id = ? WHERE id = ?", key.longValue(), empId);
			}
		}
		if (!rows.isEmpty()) {
			log.info("Copied {} denormalized spouse row(s) into employee_spouse", rows.size());
		}
	}

	private void dropDenormalizedSpouseColumnsFromEmployees(JdbcTemplate jdbcTemplate, DataSource dataSource)
			throws Exception {
		if (!tableExists(dataSource, "employees")) {
			return;
		}
		for (String col : List.of("spouse_name", "spouse_nrc_no", "spouse_nrc", "spouse_occupation")) {
			if (columnExists(dataSource, "employees", col)) {
				jdbcTemplate.execute("ALTER TABLE employees DROP COLUMN `" + col + "`");
				log.info("Dropped legacy column employees.{}", col);
			}
		}
	}

	private boolean hasForeignKeyOnColumn(JdbcTemplate jdbcTemplate, String tableName, String columnName,
			String refTable, String refColumn) {
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
