package com.epms.backend.config;

import javax.sql.DataSource;

import org.springframework.beans.BeansException;
import org.springframework.beans.factory.BeanCreationException;
import org.springframework.beans.factory.config.BeanPostProcessor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import lombok.extern.slf4j.Slf4j;

@Component
@Slf4j
public class PipHoursSchemaMigrationInitializer implements BeanPostProcessor {

	@Override
	public Object postProcessAfterInitialization(Object bean, String beanName) throws BeansException {
		if (!"dataSource".equals(beanName) || !(bean instanceof DataSource dataSource)) {
			return bean;
		}
		try {
			migrate(dataSource);
		} catch (Exception e) {
			throw new BeanCreationException("PIP hours schema migration failed", e);
		}
		return bean;
	}

	private void migrate(DataSource dataSource) {
		JdbcTemplate jdbc = new JdbcTemplate(dataSource);
		if (!tableExists(jdbc, "performance_improvement_plan")) {
			return;
		}
		if (!columnExists(jdbc, "performance_improvement_plan", "total_hours")) {
			jdbc.execute("ALTER TABLE performance_improvement_plan ADD COLUMN total_hours INT NULL");
			log.info("Added performance_improvement_plan.total_hours");
		}
		if (!columnExists(jdbc, "performance_improvement_plan", "completed_hours")) {
			jdbc.execute("ALTER TABLE performance_improvement_plan ADD COLUMN completed_hours INT NULL");
			log.info("Added performance_improvement_plan.completed_hours");
		}
		int updated = jdbc.update("""
				UPDATE performance_improvement_plan
				SET completed_hours = 0
				WHERE completed_hours IS NULL
				""");
		if (updated > 0) {
			log.info("Backfilled performance_improvement_plan.completed_hours for {} rows", updated);
		}
		if (tableExists(jdbc, "training_development_history")) {
			if (columnExists(jdbc, "training_development_history", "certification_received")) {
				jdbc.execute("ALTER TABLE training_development_history DROP COLUMN certification_received");
				log.info("Dropped training_development_history.certification_received");
			}
			if (!columnExists(jdbc, "training_development_history", "total_completed_hours")) {
				jdbc.execute("ALTER TABLE training_development_history ADD COLUMN total_completed_hours INT NULL");
				log.info("Added training_development_history.total_completed_hours");
			}
			if (!columnExists(jdbc, "training_development_history", "percentage_completion")) {
				jdbc.execute("ALTER TABLE training_development_history ADD COLUMN percentage_completion INT NULL");
				log.info("Added training_development_history.percentage_completion");
			}
			if (!columnExists(jdbc, "training_development_history", "feedback_notes")) {
				jdbc.execute("ALTER TABLE training_development_history ADD COLUMN feedback_notes TEXT NULL");
				log.info("Added training_development_history.feedback_notes");
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
