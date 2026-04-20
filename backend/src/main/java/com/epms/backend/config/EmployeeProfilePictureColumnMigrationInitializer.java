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
 * Ensures {@code employee.profile_picture_base64} exists (JPA maps portrait here). Renames legacy
 * {@code profile_picture_base_64} if present; previously a migration incorrectly targeted {@code employees}.
 */
@Component
@Slf4j
public class EmployeeProfilePictureColumnMigrationInitializer implements BeanPostProcessor, Ordered {

	@Override
	public int getOrder() {
		return 20;
	}

	@Override
	public Object postProcessAfterInitialization(Object bean, String beanName) throws BeansException {
		if (!"dataSource".equals(beanName) || !(bean instanceof DataSource dataSource)) {
			return bean;
		}
		try {
			migrate(dataSource);
		} catch (Exception e) {
			throw new BeanCreationException("employee.profile_picture_base64 migration failed", e);
		}
		return bean;
	}

	private void migrate(DataSource dataSource) throws Exception {
		JdbcTemplate jdbc = new JdbcTemplate(dataSource);
		if (!tableExists(jdbc, "employee")) {
			return;
		}
		boolean hasNew = columnExists(jdbc, "employee", "profile_picture_base64");
		boolean hasLegacy = columnExists(jdbc, "employee", "profile_picture_base_64");

		if (hasLegacy && !hasNew) {
			jdbc.execute(
					"ALTER TABLE employee CHANGE COLUMN profile_picture_base_64 profile_picture_base64 LONGTEXT NULL");
			log.info("Renamed employee.profile_picture_base_64 to profile_picture_base64");
			return;
		}
		if (hasLegacy && hasNew) {
			int copied = jdbc.update("""
					UPDATE employee SET profile_picture_base64 = profile_picture_base_64
					WHERE (profile_picture_base64 IS NULL OR TRIM(profile_picture_base64) = '')
					  AND profile_picture_base_64 IS NOT NULL AND TRIM(profile_picture_base_64) <> ''
					""");
			if (copied > 0) {
				log.info("Copied {} profile picture(s) from profile_picture_base_64 to profile_picture_base64", copied);
			}
			jdbc.execute("ALTER TABLE employee DROP COLUMN profile_picture_base_64");
			log.info("Dropped legacy employee.profile_picture_base_64");
			return;
		}
		if (!hasNew) {
			jdbc.execute("ALTER TABLE employee ADD COLUMN profile_picture_base64 LONGTEXT NULL");
			log.info("Added employee.profile_picture_base64 column");
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
