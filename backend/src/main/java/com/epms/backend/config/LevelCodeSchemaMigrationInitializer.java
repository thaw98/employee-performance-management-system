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
 * Ensures {@code level_code} exists and {@code position.level_code_id} references it, migrating
 * legacy {@code position.level_code} string values when present.
 */
@Component
@Slf4j
public class LevelCodeSchemaMigrationInitializer implements BeanPostProcessor, Ordered {

	@Override
	public int getOrder() {
		return 18;
	}

	@Override
	public Object postProcessAfterInitialization(Object bean, String beanName) throws BeansException {
		if (!"dataSource".equals(beanName) || !(bean instanceof DataSource dataSource)) {
			return bean;
		}
		try {
			migrate(dataSource);
		} catch (Exception e) {
			throw new BeanCreationException("level_code / position.level_code_id migration failed", e);
		}
		return bean;
	}

	private void migrate(DataSource dataSource) {
		JdbcTemplate jdbc = new JdbcTemplate(dataSource);
		ensureLevelCodeTable(jdbc);
		seedLevelCodeReferenceData(jdbc);
		migratePosition(jdbc);
	}

	private void ensureLevelCodeTable(JdbcTemplate jdbc) {
		if (!tableExists(jdbc, "level_code")) {
			jdbc.execute("""
					CREATE TABLE level_code (
						level_code_id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
						level_code VARCHAR(10) NULL,
						description VARCHAR(50) NULL,
						UNIQUE KEY uq_level_code_code (level_code)
					)
					""");
			log.info("Created table level_code");
			return;
		}
		if (columnExists(jdbc, "level_code", "id") && !columnExists(jdbc, "level_code", "level_code_id")) {
			jdbc.execute("ALTER TABLE level_code CHANGE COLUMN id level_code_id BIGINT NOT NULL AUTO_INCREMENT");
			log.info("Renamed level_code.id to level_code_id");
		}
	}

	/**
	 * Canonical reference rows: L01–L09 with {@code level_code_id} 1–9 and {@code description} NULL.
	 */
	private void seedLevelCodeReferenceData(JdbcTemplate jdbc) {
		if (!tableExists(jdbc, "level_code")) {
			return;
		}
		jdbc.execute("""
				INSERT INTO level_code (level_code_id, level_code, description) VALUES
				(1, 'L01', NULL),
				(2, 'L02', NULL),
				(3, 'L03', NULL),
				(4, 'L04', NULL),
				(5, 'L05', NULL),
				(6, 'L06', NULL),
				(7, 'L07', NULL),
				(8, 'L08', NULL),
				(9, 'L09', NULL)
				ON DUPLICATE KEY UPDATE
					level_code = VALUES(level_code),
					description = VALUES(description)
				""");
	}

	private void migratePosition(JdbcTemplate jdbc) {
		if (!tableExists(jdbc, "position")) {
			return;
		}
		boolean hasVarchar = columnExists(jdbc, "position", "level_code");
		boolean hasFkCol = columnExists(jdbc, "position", "level_code_id");

		if (!hasVarchar && hasFkCol) {
			addPositionLevelCodeFkIfMissing(jdbc);
			return;
		}
		if (!hasVarchar && !hasFkCol) {
			jdbc.execute("ALTER TABLE position ADD COLUMN level_code_id BIGINT NULL");
			addPositionLevelCodeFkIfMissing(jdbc);
			return;
		}
		if (hasVarchar && !hasFkCol) {
			jdbc.execute("""
					INSERT IGNORE INTO level_code (level_code, description)
					SELECT DISTINCT TRIM(level_code), NULL FROM position
					WHERE level_code IS NOT NULL AND TRIM(level_code) <> ''
					""");
			jdbc.execute("ALTER TABLE position ADD COLUMN level_code_id BIGINT NULL");
			jdbc.execute("""
					UPDATE position p
					INNER JOIN level_code lc ON TRIM(p.level_code) = lc.level_code
					SET p.level_code_id = lc.level_code_id
					""");
			jdbc.execute("ALTER TABLE position DROP COLUMN level_code");
			addPositionLevelCodeFkIfMissing(jdbc);
			log.info("Migrated position.level_code varchar to level_code_id");
			return;
		}
		if (hasVarchar && hasFkCol) {
			jdbc.execute("""
					INSERT IGNORE INTO level_code (level_code, description)
					SELECT DISTINCT TRIM(level_code), NULL FROM position
					WHERE level_code IS NOT NULL AND TRIM(level_code) <> ''
					""");
			jdbc.execute("""
					UPDATE position p
					INNER JOIN level_code lc ON TRIM(p.level_code) = lc.level_code
					SET p.level_code_id = lc.level_code_id
					WHERE p.level_code_id IS NULL AND p.level_code IS NOT NULL
					""");
			jdbc.execute("ALTER TABLE position DROP COLUMN level_code");
			addPositionLevelCodeFkIfMissing(jdbc);
			log.info("Dropped legacy position.level_code after backfill");
		}
	}

	private void addPositionLevelCodeFkIfMissing(JdbcTemplate jdbc) {
		if (fkConstraintExists(jdbc, "position", "fk_position_level_code")) {
			return;
		}
		jdbc.execute("""
				ALTER TABLE position
				ADD CONSTRAINT fk_position_level_code
				FOREIGN KEY (level_code_id) REFERENCES level_code(level_code_id)
				""");
		log.info("Added fk_position_level_code");
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
