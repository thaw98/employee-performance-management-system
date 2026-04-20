package com.epms.backend.config;

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
 * Drops legacy parent-department linkage columns from {@code department} if present.
 */
@Component
@Slf4j
public class DepartmentParentDepartmentColumnDropInitializer implements BeanPostProcessor, Ordered {

	@Override
	public int getOrder() {
		return 22;
	}

	@Override
	public Object postProcessAfterInitialization(Object bean, String beanName) throws BeansException {
		if (!"dataSource".equals(beanName) || !(bean instanceof DataSource dataSource)) {
			return bean;
		}
		try {
			dropLegacyColumnsIfPresent(dataSource);
		} catch (Exception e) {
			throw new BeanCreationException("department parent_department_id drop failed", e);
		}
		return bean;
	}

	private void dropLegacyColumnsIfPresent(DataSource dataSource) throws Exception {
		JdbcTemplate jdbc = new JdbcTemplate(dataSource);
		if (!tableExists(jdbc, "department")) {
			return;
		}
		dropDepartmentColumnIfPresent(jdbc, "parent_department_id");
		dropDepartmentColumnIfPresent(jdbc, "parent_deparment_id");
	}

	private void dropDepartmentColumnIfPresent(JdbcTemplate jdbc, String columnName) {
		if (!columnExists(jdbc, "department", columnName)) {
			return;
		}
		dropForeignKeysOnColumn(jdbc, "department", columnName);
		dropIndexesOnColumn(jdbc, "department", columnName);
		log.info("Dropping legacy column department.{}", columnName);
		jdbc.execute("ALTER TABLE department DROP COLUMN `" + columnName + "`");
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

	private static void dropIndexesOnColumn(JdbcTemplate jdbc, String tableName, String columnName) {
		List<String> indexNames = jdbc.query("""
				SELECT DISTINCT INDEX_NAME
				FROM information_schema.STATISTICS
				WHERE TABLE_SCHEMA = DATABASE()
				  AND TABLE_NAME = ?
				  AND COLUMN_NAME = ?
				  AND INDEX_NAME <> 'PRIMARY'
				""",
				(rs, rowNum) -> rs.getString(1),
				tableName,
				columnName);
		for (String indexName : indexNames) {
			if (indexName != null) {
				jdbc.execute("ALTER TABLE `" + tableName + "` DROP INDEX `" + indexName + "`");
			}
		}
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
