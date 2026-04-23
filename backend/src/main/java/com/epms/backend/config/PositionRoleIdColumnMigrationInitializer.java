package com.epms.backend.config;

import javax.sql.DataSource;

import org.springframework.beans.BeansException;
import org.springframework.beans.factory.BeanCreationException;
import org.springframework.beans.factory.config.BeanPostProcessor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import lombok.extern.slf4j.Slf4j;

/**
 * Adds {@code position.role_id} and a foreign key to {@code role} for legacy databases; Hibernate
 * {@code ddl-auto=update} may add the column without the FK.
 */
@Component
@Slf4j
public class PositionRoleIdColumnMigrationInitializer implements BeanPostProcessor {

	@Override
	public Object postProcessAfterInitialization(Object bean, String beanName) throws BeansException {
		if (!"dataSource".equals(beanName) || !(bean instanceof DataSource dataSource)) {
			return bean;
		}
		try {
			migrate(dataSource);
		} catch (Exception e) {
			throw new BeanCreationException("position.role_id migration failed", e);
		}
		return bean;
	}

	private void migrate(DataSource dataSource) {
		JdbcTemplate jdbc = new JdbcTemplate(dataSource);
		if (!tableExists(jdbc, "position")) {
			return;
		}
		if (!columnExists(jdbc, "position", "role_id")) {
			jdbc.execute("ALTER TABLE `position` ADD COLUMN role_id BIGINT NULL");
			log.info("Added position.role_id");
		}
		if (!positionRoleFkExists(jdbc)) {
			jdbc.execute("ALTER TABLE `position` ADD CONSTRAINT fk_position_role FOREIGN KEY (role_id) REFERENCES `role`(`id`)");
			log.info("Added foreign key position.role_id -> role.id");
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

	private static boolean positionRoleFkExists(JdbcTemplate jdbc) {
		return Boolean.TRUE.equals(jdbc.queryForObject(
				"""
						SELECT COUNT(*) > 0 FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
						WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'position'
						  AND COLUMN_NAME = 'role_id' AND REFERENCED_TABLE_NAME = 'role'
						""",
				Boolean.class));
	}
}
