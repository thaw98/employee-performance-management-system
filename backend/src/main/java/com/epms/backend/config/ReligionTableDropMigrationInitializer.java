package com.epms.backend.config;

import java.util.Locale;

import javax.sql.DataSource;

import org.springframework.beans.BeansException;
import org.springframework.beans.factory.BeanCreationException;
import org.springframework.beans.factory.config.BeanPostProcessor;
import org.springframework.jdbc.core.ConnectionCallback;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import lombok.extern.slf4j.Slf4j;

/**
 * Drops the legacy {@code religion} lookup table. Employee religion is stored
 * on {@code employees.religion} via {@link com.epms.backend.entity.EmployeeReligion}.
 */
@Component
@Slf4j
public class ReligionTableDropMigrationInitializer implements BeanPostProcessor {

	@Override
	public Object postProcessAfterInitialization(Object bean, String beanName) throws BeansException {
		if (!"dataSource".equals(beanName) || !(bean instanceof DataSource dataSource)) {
			return bean;
		}
		try {
			dropReligionTable(new JdbcTemplate(dataSource));
		} catch (Exception e) {
			throw new BeanCreationException("religion table drop migration failed", e);
		}
		return bean;
	}

	private void dropReligionTable(JdbcTemplate jdbc) {
		boolean mysql = Boolean.TRUE.equals(jdbc.execute((ConnectionCallback<Boolean>) conn -> {
			String name = conn.getMetaData().getDatabaseProductName();
			return name != null && name.toLowerCase(Locale.ROOT).contains("mysql");
		}));

		if (mysql) {
			jdbc.execute("SET FOREIGN_KEY_CHECKS = 0");
		}
		try {
			jdbc.execute("DROP TABLE IF EXISTS religion");
			log.info("Dropped table religion (if present)");
		} finally {
			if (mysql) {
				jdbc.execute("SET FOREIGN_KEY_CHECKS = 1");
			}
		}
	}
}
