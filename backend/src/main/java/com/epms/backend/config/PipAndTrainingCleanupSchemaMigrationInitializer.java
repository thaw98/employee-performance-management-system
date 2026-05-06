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
 * Drops legacy columns from PIP and Training Record tables if present.
 */
@Component
@Slf4j
public class PipAndTrainingCleanupSchemaMigrationInitializer implements BeanPostProcessor, Ordered {

	@Override
	public int getOrder() {
		return 100; // Run after most other schema migrations
	}

	@Override
	public Object postProcessAfterInitialization(Object bean, String beanName) throws BeansException {
		if (!"dataSource".equals(beanName) || !(bean instanceof DataSource dataSource)) {
			return bean;
		}
		try {
			migrate(dataSource);
		} catch (Exception e) {
			throw new BeanCreationException("PIP and Training cleanup schema migration failed", e);
		}
		return bean;
	}

	private void migrate(DataSource dataSource) {
		JdbcTemplate jdbc = new JdbcTemplate(dataSource);
		
		// 1. Drop cycle_id from performance_improvement_plan
		dropColumnIfPresent(jdbc, "performance_improvement_plan", "cycle_id");
		
		// 2. Drop notes from training_development_history
		dropColumnIfPresent(jdbc, "training_development_history", "notes");
	}

	private void dropColumnIfPresent(JdbcTemplate jdbc, String tableName, String columnName) {
		if (!tableExists(jdbc, tableName) || !columnExists(jdbc, tableName, columnName)) {
			return;
		}
		
		dropForeignKeysOnColumn(jdbc, tableName, columnName);
		dropIndexesOnColumn(jdbc, tableName, columnName);
		
		log.info("Dropping legacy column {}.{}", tableName, columnName);
		jdbc.execute("ALTER TABLE `" + tableName + "` DROP COLUMN `" + columnName + "`");
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
				log.info("Dropping foreign key {} on {}.{}", name, tableName, columnName);
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
				log.info("Dropping index {} on {}.{}", indexName, tableName, columnName);
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
