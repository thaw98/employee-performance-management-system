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
 * Renames {@code employee.profile_picture_base64} to {@code employee.profile_picture_url} and clears
 * legacy embedded data URLs. Must run after {@link UserProfilePictureColumnDropInitializer}.
 */
@Component
@Slf4j
public class EmployeeProfilePictureUrlColumnMigrationInitializer implements BeanPostProcessor, Ordered {

	@Override
	public int getOrder() {
		return 24;
	}

	@Override
	public Object postProcessAfterInitialization(Object bean, String beanName) throws BeansException {
		if (!"dataSource".equals(beanName) || !(bean instanceof DataSource dataSource)) {
			return bean;
		}
		try {
			migrate(dataSource);
		} catch (Exception e) {
			throw new BeanCreationException("employee.profile_picture_url migration failed", e);
		}
		return bean;
	}

	private void migrate(DataSource dataSource) throws Exception {
		JdbcTemplate jdbc = new JdbcTemplate(dataSource);
		if (!tableExists(jdbc, "employee")) {
			return;
		}
		boolean hasUrl = columnExists(jdbc, "employee", "profile_picture_url");
		boolean hasBase64 = columnExists(jdbc, "employee", "profile_picture_base64");

		if (hasUrl && hasBase64) {
			jdbc.execute("ALTER TABLE employee DROP COLUMN profile_picture_base64");
			log.info("Dropped duplicate employee.profile_picture_base64 (profile_picture_url already present)");
			return;
		}
		if (hasUrl || !hasBase64) {
			return;
		}

		jdbc.update("""
				UPDATE employee SET profile_picture_base64 = NULL
				WHERE profile_picture_base64 LIKE 'data:%'
				   OR CHAR_LENGTH(profile_picture_base64) > 2048
				""");
		jdbc.execute(
				"ALTER TABLE employee CHANGE COLUMN profile_picture_base64 profile_picture_url VARCHAR(2048) NULL");
		log.info("Renamed employee.profile_picture_base64 to profile_picture_url");
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
