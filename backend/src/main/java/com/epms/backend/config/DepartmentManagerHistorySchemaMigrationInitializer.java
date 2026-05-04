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
public class DepartmentManagerHistorySchemaMigrationInitializer implements BeanPostProcessor {

	@Override
	public Object postProcessAfterInitialization(Object bean, String beanName) throws BeansException {
		if (!"dataSource".equals(beanName) || !(bean instanceof DataSource dataSource)) {
			return bean;
		}
		try {
			migrate(dataSource);
		} catch (Exception e) {
			throw new BeanCreationException("department_manager_history migration failed", e);
		}
		return bean;
	}

	private void migrate(DataSource dataSource) {
		JdbcTemplate jdbc = new JdbcTemplate(dataSource);
		if (tableExists(jdbc, "department_manager_history")) {
			return;
		}
		jdbc.execute("""
			CREATE TABLE department_manager_history (
				id BIGINT NOT NULL AUTO_INCREMENT,
				department_id BIGINT NOT NULL,
				manager_employee_id BIGINT NOT NULL,
				start_date DATE NOT NULL,
				end_date DATE NULL,
				created_by BIGINT NULL,
				created_on DATETIME NOT NULL,
				PRIMARY KEY (id),
				CONSTRAINT fk_dmh_department FOREIGN KEY (department_id) REFERENCES department(department_id),
				CONSTRAINT fk_dmh_manager FOREIGN KEY (manager_employee_id) REFERENCES employee(employee_id),
				INDEX idx_dmh_department_current (department_id, end_date),
				INDEX idx_dmh_manager_start (manager_employee_id, start_date)
			) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
			""");
		log.info("Created department_manager_history table");
	}

	private static boolean tableExists(JdbcTemplate jdbc, String tableName) {
		return Boolean.TRUE.equals(jdbc.queryForObject(
				"SELECT COUNT(*) > 0 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?",
				Boolean.class, tableName));
	}
}
