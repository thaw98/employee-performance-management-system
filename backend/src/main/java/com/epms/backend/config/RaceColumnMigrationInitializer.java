package com.epms.backend.config;



import java.util.List;



import javax.sql.DataSource;



import org.springframework.beans.BeansException;

import org.springframework.beans.factory.BeanCreationException;

import org.springframework.beans.factory.config.BeanPostProcessor;

import org.springframework.jdbc.core.JdbcTemplate;

import org.springframework.stereotype.Component;



import lombok.extern.slf4j.Slf4j;



/**
 * Normalizes employee ethnicity columns to the final shape:
 * <ol>
 *   <li>Convert legacy {@code nationality_id} to plain {@code nationality} text.</li>
 *   <li>Drop any existing {@code race} column.</li>
 *   <li>Rename {@code nationality} to {@code race}.</li>
 * </ol>
 */

@Component

@Slf4j

public class RaceColumnMigrationInitializer implements BeanPostProcessor {



	@Override

	public Object postProcessAfterInitialization(Object bean, String beanName) throws BeansException {

		if (!"dataSource".equals(beanName) || !(bean instanceof DataSource dataSource)) {

			return bean;

		}

		try {

			migrate(dataSource);

		} catch (Exception e) {

			throw new BeanCreationException("employees.race migration failed", e);

		}

		return bean;

	}



	private void migrate(DataSource dataSource) throws Exception {

		JdbcTemplate jdbc = new JdbcTemplate(dataSource);

		if (!tableExists(jdbc, "employees")) {

			return;

		}

		if (columnExists(jdbc, "employees", "nationality_id")) {

			if (!columnExists(jdbc, "employees", "nationality")) {
				jdbc.execute("ALTER TABLE employees ADD COLUMN nationality VARCHAR(100) NULL");
				log.info("Added employees.nationality column");
			}

			if (tableExists(jdbc, "nationalities")) {
				jdbc.execute("""
						UPDATE employees e
						INNER JOIN nationalities n ON e.nationality_id = n.id
						SET e.nationality = n.name
						WHERE e.nationality_id IS NOT NULL
						  AND (e.nationality IS NULL OR e.nationality = '')
						""");
				log.info("Backfilled employees.nationality from nationalities table");
			}

			dropForeignKeysOnColumn(jdbc, "employees", "nationality_id");
			jdbc.execute("ALTER TABLE employees DROP COLUMN nationality_id");
			log.info("Dropped employees.nationality_id");
		}

		if (tableExists(jdbc, "nationalities")) {
			jdbc.execute("DROP TABLE IF EXISTS nationalities");
			log.info("Dropped table nationalities");
		}

		if (columnExists(jdbc, "employees", "race")) {
			jdbc.execute("ALTER TABLE employees DROP COLUMN race");
			log.info("Dropped existing employees.race column");
		}

		if (columnExists(jdbc, "employees", "nationality")) {
			jdbc.execute("ALTER TABLE employees CHANGE COLUMN nationality race VARCHAR(100) NULL");
			log.info("Renamed employees.nationality to employees.race");
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

