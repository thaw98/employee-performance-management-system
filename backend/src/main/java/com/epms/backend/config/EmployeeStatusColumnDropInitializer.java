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
 * Drops legacy {@code employee.status}; employee state is represented by {@code employee.employment_status}.
 */
@Component
@Slf4j
public class EmployeeStatusColumnDropInitializer implements BeanPostProcessor, Ordered {

	@Override
	public int getOrder() {
		return 23;
	}

	@Override
	public Object postProcessAfterInitialization(Object bean, String beanName) throws BeansException {
		if (!"dataSource".equals(beanName) || !(bean instanceof DataSource dataSource)) {
			return bean;
		}
		try {
			dropColumnIfPresent(dataSource);
		} catch (Exception e) {
			throw new BeanCreationException("employee.status drop failed", e);
		}
		return bean;
	}

	private void dropColumnIfPresent(DataSource dataSource) {
		JdbcTemplate jdbc = new JdbcTemplate(dataSource);
		if (!tableExists(jdbc, "employee") || !columnExists(jdbc, "employee", "status")) {
			return;
		}
		log.info("Dropping legacy column employee.status");
		jdbc.execute("ALTER TABLE employee DROP COLUMN status");
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
