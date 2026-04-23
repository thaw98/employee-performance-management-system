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
 * Aligns appraisal category/question key column types before Hibernate ddl-auto runs.
 *
 * Legacy databases can have INT keys while entities use Long. Hibernate tries to alter
 * appraisal_categories.id first, but MySQL rejects that while appraisal_questions.category_id
 * is still constrained with a foreign key. This migration normalizes both columns to BIGINT
 * and re-creates the FK in a safe order.
 */
@Component
@Slf4j
public class AppraisalSchemaMigrationInitializer implements BeanPostProcessor, Ordered {

	@Override
	public int getOrder() {
		return 19;
	}

	@Override
	public Object postProcessAfterInitialization(Object bean, String beanName) throws BeansException {
		if (!"dataSource".equals(beanName) || !(bean instanceof DataSource dataSource)) {
			return bean;
		}
		try {
			migrate(new JdbcTemplate(dataSource));
		} catch (Exception e) {
			throw new BeanCreationException("appraisal schema migration failed", e);
		}
		return bean;
	}

	private void migrate(JdbcTemplate jdbc) {
		if (!tableExists(jdbc, "appraisal_categories") || !tableExists(jdbc, "appraisal_questions")) {
			return;
		}
		if (!columnExists(jdbc, "appraisal_categories", "id")
				|| !columnExists(jdbc, "appraisal_questions", "category_id")) {
			return;
		}

		dropForeignKeysOnColumn(jdbc, "appraisal_questions", "category_id");
		jdbc.execute("ALTER TABLE appraisal_categories MODIFY COLUMN id BIGINT NOT NULL AUTO_INCREMENT");
		jdbc.execute("ALTER TABLE appraisal_questions MODIFY COLUMN category_id BIGINT NOT NULL");

		if (!fkConstraintExists(jdbc, "appraisal_questions", "fk_appraisal_questions_category")) {
			jdbc.execute("""
					ALTER TABLE appraisal_questions
					ADD CONSTRAINT fk_appraisal_questions_category
					FOREIGN KEY (category_id) REFERENCES appraisal_categories(id)
					""");
			log.info("Added fk_appraisal_questions_category");
		}
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
