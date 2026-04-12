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
 * Drops {@code users.profile_picture_base64}; portrait is stored on {@code employees.profile_picture_base64} only.
 */
@Component
@Slf4j
public class UserProfilePictureColumnDropInitializer implements BeanPostProcessor, Ordered {

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
			dropColumnIfPresent(dataSource);
		} catch (Exception e) {
			throw new BeanCreationException("users.profile_picture_base64 drop failed", e);
		}
		return bean;
	}

	private void dropColumnIfPresent(DataSource dataSource) throws Exception {
		JdbcTemplate jdbc = new JdbcTemplate(dataSource);
		if (!tableExists(jdbc, "users") || !columnExists(jdbc, "users", "profile_picture_base64")) {
			return;
		}
		if (tableExists(jdbc, "employees") && columnExists(jdbc, "employees", "profile_picture_base64")) {
			int copied = jdbc.update("""
					UPDATE employees e
					INNER JOIN users u ON u.employee_id = e.id
					SET e.profile_picture_base64 = u.profile_picture_base64
					WHERE u.profile_picture_base64 IS NOT NULL AND TRIM(u.profile_picture_base64) <> ''
					AND (e.profile_picture_base64 IS NULL OR TRIM(e.profile_picture_base64) = '')
					""");
			if (copied > 0) {
				log.info("Copied {} profile picture(s) from users to employees before dropping users column", copied);
			}
		}
		log.info("Dropping users.profile_picture_base64 (use employees.profile_picture_base64)");
		jdbc.execute("ALTER TABLE users DROP COLUMN profile_picture_base64");
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
