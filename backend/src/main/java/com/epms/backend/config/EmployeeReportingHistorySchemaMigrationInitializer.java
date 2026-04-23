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
public class EmployeeReportingHistorySchemaMigrationInitializer implements BeanPostProcessor {

    @Override
    public Object postProcessAfterInitialization(Object bean, String beanName) throws BeansException {
        if (!"dataSource".equals(beanName) || !(bean instanceof DataSource dataSource)) {
            return bean;
        }
        try {
            migrate(dataSource);
        } catch (Exception e) {
            throw new BeanCreationException("employee_reporting_history migration failed", e);
        }
        return bean;
    }

    private void migrate(DataSource dataSource) {
        JdbcTemplate jdbc = new JdbcTemplate(dataSource);
        if (tableExists(jdbc, "employee_reporting_history")) {
            return;
        }
        jdbc.execute("""
            CREATE TABLE employee_reporting_history (
                id BIGINT NOT NULL AUTO_INCREMENT,
                employee_id BIGINT NOT NULL,
                manager_employee_id BIGINT NOT NULL,
                effective_start_date DATE NOT NULL,
                effective_end_date DATE NULL,
                is_current BIT(1) NOT NULL DEFAULT 0,
                reason TEXT NULL,
                remarks TEXT NULL,
                created_by BIGINT NULL,
                created_on DATETIME NOT NULL,
                updated_by BIGINT NULL,
                updated_on DATETIME NULL,
                PRIMARY KEY (id),
                CONSTRAINT fk_erh_employee FOREIGN KEY (employee_id) REFERENCES employee(employee_id),
                CONSTRAINT fk_erh_manager FOREIGN KEY (manager_employee_id) REFERENCES employee(employee_id),
                INDEX idx_erh_employee_current (employee_id, is_current),
                INDEX idx_erh_employee_start (employee_id, effective_start_date)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
            """);
        log.info("Created employee_reporting_history table");
    }

    private static boolean tableExists(JdbcTemplate jdbc, String tableName) {
        return Boolean.TRUE.equals(jdbc.queryForObject(
            "SELECT COUNT(*) > 0 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?",
            Boolean.class, tableName));
    }
}
