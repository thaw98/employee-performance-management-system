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
 * Drops legacy {@code users.employee_id_new} if present. The canonical link to an employee is
 * {@code users.employee_id} ({@link com.epms.backend.entity.User#getEmployee()}).
 */
@Component
@Slf4j
public class UsersEmployeeIdNewColumnDropInitializer implements BeanPostProcessor, Ordered {

	@Override
	public int getOrder() {
		return 21;
	}

	@Override
	public Object postProcessAfterInitialization(Object bean, String beanName) throws BeansException {
		if (!"dataSource".equals(beanName) || !(bean instanceof DataSource dataSource)) {
			return bean;
		}
		try {
			dropColumnIfPresent(dataSource);
		} catch (Exception e) {
			throw new BeanCreationException("users.employee_id_new drop failed", e);
		}
		return bean;
	}

	private void dropColumnIfPresent(DataSource dataSource) throws Exception {
		JdbcTemplate jdbc = new JdbcTemplate(dataSource);
		if (!tableExists(jdbc, "users") || !columnExists(jdbc, "users", "employee_id_new")) {
			return;
		}
		dropForeignKeysOnColumn(jdbc, "users", "employee_id_new");
		log.info("Dropping legacy column users.employee_id_new");
		jdbc.execute("ALTER TABLE users DROP COLUMN employee_id_new");
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
