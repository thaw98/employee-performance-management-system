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
public class EmployeeContextSnapshotSchemaMigrationInitializer implements BeanPostProcessor {

    @Override
    public Object postProcessAfterInitialization(Object bean, String beanName) throws BeansException {
        if (!"dataSource".equals(beanName) || !(bean instanceof DataSource dataSource)) {
            return bean;
        }
        try {
            migrate(dataSource);
        } catch (Exception e) {
            throw new BeanCreationException("employee_context_snapshot migration failed", e);
        }
        return bean;
    }

    private void migrate(DataSource dataSource) {
        JdbcTemplate jdbc = new JdbcTemplate(dataSource);
        if (tableExists(jdbc, "employee_context_snapshot")) {
            return;
        }
        jdbc.execute("""
            CREATE TABLE employee_context_snapshot (
                id BIGINT NOT NULL AUTO_INCREMENT,
                module_type VARCHAR(30) NOT NULL,
                reference_id BIGINT NOT NULL,
                employee_id BIGINT NOT NULL,
                employee_department_history_id BIGINT NOT NULL,
                employee_reporting_history_id BIGINT NULL,
                department_id BIGINT NOT NULL,
                department_name VARCHAR(255) NOT NULL,
                position_id BIGINT NOT NULL,
                position_name VARCHAR(255) NOT NULL,
                employee_name VARCHAR(255) NOT NULL,
                staff_no VARCHAR(50) NOT NULL,
                manager_employee_id BIGINT NULL,
                manager_name VARCHAR(255) NULL,
                appraiser_employee_id BIGINT NULL,
                appraiser_name VARCHAR(255) NULL,
                snapshot_effective_date DATE NOT NULL,
                created_by BIGINT NULL,
                created_on DATETIME NOT NULL,
                PRIMARY KEY (id),
                UNIQUE KEY uq_snapshot_module_ref (module_type, reference_id),
                INDEX idx_ecs_employee (employee_id),
                INDEX idx_ecs_dept_history (employee_department_history_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
            """);
        log.info("Created employee_context_snapshot table");
    }

    private static boolean tableExists(JdbcTemplate jdbc, String tableName) {
        return Boolean.TRUE.equals(jdbc.queryForObject(
            "SELECT COUNT(*) > 0 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?",
            Boolean.class, tableName));
    }
}
