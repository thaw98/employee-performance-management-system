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
public class DepartmentManagerSchemaMigrationInitializer implements BeanPostProcessor {

	@Override
	public Object postProcessAfterInitialization(Object bean, String beanName) throws BeansException {
		if (!"dataSource".equals(beanName) || !(bean instanceof DataSource dataSource)) {
			return bean;
		}
		try {
			migrate(dataSource);
		} catch (Exception e) {
			throw new BeanCreationException("department.manager_id migration failed", e);
		}
		return bean;
	}

	private void migrate(DataSource dataSource) {
		JdbcTemplate jdbc = new JdbcTemplate(dataSource);
		if (!tableExists(jdbc, "department") || !tableExists(jdbc, "employee")) {
			return;
		}
		if (!columnExists(jdbc, "department", "manager_id")) {
			jdbc.execute("ALTER TABLE department ADD COLUMN manager_id BIGINT NULL");
			log.info("Added department.manager_id");
		}
		if (!departmentManagerFkExists(jdbc)) {
			jdbc.execute("""
					ALTER TABLE department
					ADD CONSTRAINT fk_department_manager
					FOREIGN KEY (manager_id) REFERENCES employee(employee_id)
					""");
			log.info("Added foreign key department.manager_id -> employee.employee_id");
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

	private static boolean departmentManagerFkExists(JdbcTemplate jdbc) {
		return Boolean.TRUE.equals(jdbc.queryForObject(
				"""
						SELECT COUNT(*) > 0 FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
						WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'department'
						  AND COLUMN_NAME = 'manager_id' AND REFERENCED_TABLE_NAME = 'employee'
						""",
				Boolean.class));
	}
}
